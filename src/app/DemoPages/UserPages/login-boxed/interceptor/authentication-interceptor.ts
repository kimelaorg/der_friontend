import { Injectable, inject } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Auth } from '../service/auth'; // Your finalized AuthService

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {

    private authService = inject(Auth);
    // Flag to prevent concurrent token refresh requests (race condition protection)
    private isRefreshing = false;
    // Subject used to queue up failed requests until a new Access Token is available
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        // --- 1. Attaching the Token ---
        const authToken = this.authService.getAccessToken();
        let authReq = this.addToken(request, authToken);

        // --- 2. Defining Exclusion Paths ---
        // Exclude /token/ and other auth endpoints from having a potentially expired token attached
        const isAuthEndpoint =
            request.url.includes('/token/') ||
            request.url.includes('/login/') ||
            request.url.includes('/verify-otp/') ||
            request.url.includes('/register/');

        if (isAuthEndpoint) {
            return next.handle(request);
        }

        // --- 3. Error Handling and Token Refresh Logic ---
        return next.handle(authReq).pipe(
            catchError((error) => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
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
            this.refreshTokenSubject.next(null); // Signal that no new token is available yet

            // Call the refresh service method (which uses the persistent Refresh Token)
            return this.authService.refreshAccessToken().pipe(
                switchMap(() => {
                    this.isRefreshing = false;
                    const newAccessToken = this.authService.getAccessToken();
                    this.refreshTokenSubject.next(newAccessToken);
                    // Retry the original failed request with the new token
                    return next.handle(this.addToken(request, newAccessToken));
                }),
                catchError((err) => {
                    // If the refresh itself fails (e.g., Refresh Token expired), log the user out
                    this.isRefreshing = false;
                    this.authService.logout();
                    return throwError(() => err);
                })
            );

        } else {
            // If another request fails while a refresh is in progress, queue it up
            // by waiting for the new token to be emitted by the Subject.
            return this.refreshTokenSubject.pipe(
                filter(token => token != null),
                take(1),
                switchMap(jwt => {
                    return next.handle(this.addToken(request, jwt));
                })
            );
        }
    }
}
