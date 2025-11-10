import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Auth } from '../service/auth';
import { Observable } from 'rxjs';



export const roleGuard: (requiredGroups: string[]) => CanActivateFn =
    (requiredGroups: string[]) => {

    return (
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {

        const authService = inject(Auth);
        const router = inject(Router);

        // 1. Basic check: Is the user logged in (do they have a token)?
        if (!authService.getAccessToken()) {
            console.warn('Access denied: User not authenticated.');
            // Redirect to the login page if not logged in
            return router.createUrlTree(['/der/account/login']);
        }

        // 2. Authorization check: Does the user belong to ANY of the required groups?
        const isAuthorized = requiredGroups.some(group =>
            authService.userInGroup(group)
        );

        if (isAuthorized) {
            return true; // Access granted
        } else {
            // Access denied: Redirect to a safe, authenticated route
            alert('Access Denied. You do not have the required permissions.');
            console.warn(`Access Denied. User lacks required groups: ${requiredGroups.join(', ')}`);

            // Redirect to a default authenticated route (e.g., general dashboard)
            return router.createUrlTree(['/der/dashboard']);
        }
    };
};
