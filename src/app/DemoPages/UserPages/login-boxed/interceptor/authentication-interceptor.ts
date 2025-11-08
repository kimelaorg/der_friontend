import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  // 🛑 Removed and re-added HttpInterceptor to force correct type recognition
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
// NOTE: Corrected relative path to point to the sibling 'service' folder
import { Auth } from '../service/auth';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor { // This line requires the 'intercept' method

  // Inject AuthService to retrieve the in-memory token
  private authService = inject(Auth);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authToken = this.authService.getAccessToken();

    // Define the path segments that DO NOT require the token (Auth Endpoints)
    const isAuthRequest =
      request.url.includes('/login/') ||
      request.url.includes('/verify-otp/') ||
      request.url.includes('/register/');

    // If a token exists AND the request is not an auth request, clone and add the header
    if (authToken && !isAuthRequest) {

      // Clone the request and add the Authorization header
      const authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });

      return next.handle(authReq);
    }

    // Otherwise, pass the original request unmodified
    return next.handle(request);
  }
}
