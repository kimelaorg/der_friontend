import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Auth } from '../service/auth';


export const authenticityGuard: CanActivateFn = (route, state): boolean | UrlTree => {

    // Inject the necessary services
    const authService = inject(Auth);
    const router = inject(Router);

    // Check if the user has a valid access token (or is logged in)
    // Assuming authService.getAccessToken() returns the token string (truthy) or null/undefined (falsy)
    if (authService.getAccessToken()) {
        // 1. **Authenticated:** Access granted
        return true;
    } else {
        // 2. **Not Authenticated:** Access denied

        // Log a warning for security
        console.warn('Authentication credentials were not provided.');

        // Redirect the user to the public login route
        // 🚨 IMPORTANT: Change '/pages/login-boxed' to your actual login path if different
        return router.createUrlTree(['/der/account/login']);
    }
};
