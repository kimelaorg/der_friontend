import { Injectable, inject } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { Auth } from '../service/auth'; // Your finalized AuthService (assuming this path is correct)

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {

    private authService = inject(Auth);

    // Flag to prevent concurrent token refresh requests (race condition protection)
    private isRefreshing = false;

    // Subject used to queue up failed requests until a new Access Token is available
    // It emits the new Access Token upon successful refresh.
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        // --- 1. Defining Exclusion Paths ---
        // Do not attach a token to public authentication endpoints.
        const isAuthEndpoint =
            request.url.includes('/token/') ||
            request.url.includes('/login/') ||
            request.url.includes('/verify-otp/') ||
            request.url.includes('/register/');

        if (isAuthEndpoint) {
            // Simply pass the request through without modification
            return next.handle(request);
        }

        // --- 2. Attaching the Token ---
        const authToken = this.authService.getAccessToken();
        let authReq = this.addToken(request, authToken);

        // --- 3. Error Handling and Token Refresh Logic ---
        return next.handle(authReq).pipe(
            catchError((error) => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    // This is a protected request that failed, initiate refresh
                    return this.handle401Error(authReq, next);
                }

                // For all other errors (400, 403, 500, etc.), just rethrow
                return throwError(() => error);
            })
        );
    }

    /** Helper function to clone request and add the Bearer token */
    private addToken(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
        if (!token) return request;

        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    /** Handles token refresh when a 401 error is received */
    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null); // Clear the subject value

            // Call the refresh service method (which uses the persistent Refresh Token)
            return this.authService.refreshAccessToken().pipe(
                switchMap(() => {
                    const newAccessToken = this.authService.getAccessToken();
                    this.refreshTokenSubject.next(newAccessToken);

                    // Retry the original failed request with the new token
                    return next.handle(this.addToken(request, newAccessToken));
                }),
                catchError((err) => {
                    // If the refresh itself fails (e.g., Refresh Token expired), log the user out
                    this.authService.logout();
                    return throwError(() => err);
                }),
                // The 'finalize' operator ensures 'isRefreshing' is set to false
                // regardless of whether the refresh succeeded or failed.
                finalize(() => {
                    this.isRefreshing = false;
                })
            );

        } else {
            // If another request fails while a refresh is in progress, queue it up
            return this.refreshTokenSubject.pipe(
                filter(token => token != null), // Wait until a new token is emitted
                take(1),
                switchMap(jwt => {
                    // Retry the original request with the new token
                    return next.handle(this.addToken(request, jwt));
                })
            );
        }
    }
}
