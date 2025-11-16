import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Auth } from '../service/auth'; // Ensure this path is correct

/**
 * Checks if the user is authenticated AND authorized (has the required role) to access the route.
 *
 * Usage in Router:
 * {
 * path: 'admin/settings',
 * component: AdminComponent,
 * canActivate: [authenticationGuard],
 * data: {
 * allowedRoles: ['System Administrator', 'Executive Manager']
 * }
 * }
 */
export const authenticityGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state): boolean | UrlTree => {

    // Inject the necessary services
    const authService = inject(Auth);
    const router = inject(Router);
    const loginPath = '/der/account/login'; // Your defined login path

    // --- 1. AUTHENTICATION CHECK ---
    if (!authService.getAccessToken()) {
        console.warn('Authentication failed: Access token not found. Redirecting to login.');
        return router.createUrlTree([loginPath]);
    }

    // --- 2. AUTHORIZATION (ROLE) CHECK ---

    // Get the required roles from the route data property (e.g., data: { allowedRoles: [...] })
    const allowedRoles: string[] = route.data['allowedRoles'];

    // If no specific roles are defined for the route, and the user is authenticated, grant access.
    if (!allowedRoles || allowedRoles.length === 0) {
        return true;
    }

    // Check if the authenticated user's groups match any of the allowed roles
    const hasRequiredRole = allowedRoles.some(role => authService.userInGroup(role));

    if (hasRequiredRole) {
        // User is authenticated AND has one of the required roles.
        return true;
    } else {
        // User is authenticated but does NOT have the required role.
        console.error('Authorization failed: User does not have the required role(s).');

        // Redirect to a specific "Access Denied" page or to the default dashboard.
        // I recommend creating an 'access-denied' route.
        return router.createUrlTree(['/access-denied']);
    }
};
