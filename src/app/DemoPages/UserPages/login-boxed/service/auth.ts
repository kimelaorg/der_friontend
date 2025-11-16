import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable, BehaviorSubject, catchError, throwError } from 'rxjs';

// --- Interface Definitions ---

// Structure of the successful login response
interface TokenResponse {
    refresh: string;
    access: string;
    user_data: string; // Base64 encoded JSON string
}

// Structure for the refresh response
interface RefreshResponse {
    access: string;
    refresh?: string;
}

// Structure of the nested 'user' object from the decoded payload
export interface User {
    phone_number: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    is_verified: boolean;
    is_staff: boolean;
    groups: string[]; // This is the key for your roles/permissions
}

// Structure of the decoded 'user_data' payload
export interface UserDataPayload {
    user: User;
    // Add other top-level properties from your payload here if necessary
}

// ------------------------------------

@Injectable({
    providedIn: 'root'
})
export class Auth {
    // Dependencies
    private standardHttp = inject(HttpClient);
    private router = inject(Router);
    private handler = inject(HttpBackend);

    // New Interceptor-Free Client
    private interceptorFreeHttp: HttpClient;

    private baseUrl = 'http://localhost:8000/api/auth';

    // Local Storage Keys
    private readonly ACCESS_TOKEN_KEY = 'access_token_app';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token_persistent';
    private readonly USER_DATA_KEY = 'user_data_app';

    // In-Memory Tokens and Data (for use by the Interceptor)
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private rawUserData: string | null = null;

    // Observable for checking token refresh status in the Interceptor
    private isRefreshing = new BehaviorSubject<boolean>(false);
    isRefreshing$ = this.isRefreshing.asObservable();

    isAuthenticated = signal<boolean>(false);

    constructor() {
        this.interceptorFreeHttp = new HttpClient(this.handler);
        this.loadPersistentTokens();
    }

// ------------------------------------
// --- Token Getters & Persistence ---
// ------------------------------------

    getAccessToken(): string | null {
        // Return in-memory token, but fall back to Local Storage on initial load/refresh
        return this.accessToken || localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return this.refreshToken || localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    private loadPersistentTokens(): void {
        const persistentAccess = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        const persistentRefresh = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        const persistentUserData = localStorage.getItem(this.USER_DATA_KEY);

        // 1. Restore Access Token and User Data into memory if available
        if (persistentAccess && persistentUserData) {
            this.accessToken = persistentAccess;
            this.rawUserData = persistentUserData;
            this.isAuthenticated.set(true);
            console.log('Session data restored from Local Storage.');
        }

        // 2. Use the Refresh Token to get a FRESH access token upon load (if present)
        if (persistentRefresh) {
            this.refreshToken = persistentRefresh;

            this.refreshAccessToken().subscribe({
                next: () => console.log('Session access token refreshed successfully.'),
                error: () => this.logout(false) // If refresh fails, log out quietly
            });
        }
    }

    setTokens(access: string | null, refresh: string | null, rawUserData?: string): void {
        this.accessToken = access;
        this.refreshToken = refresh;

        // Persist/Clear Access Token
        if (access) {
            localStorage.setItem(this.ACCESS_TOKEN_KEY, access);
        } else {
            localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        }

        // Persist/Clear Refresh Token
        if (refresh) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
        } else {
            localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        }

        // Persist/Clear User Data
        if (rawUserData) {
            this.rawUserData = rawUserData;
            localStorage.setItem(this.USER_DATA_KEY, rawUserData);
        } else if (rawUserData === null) {
            this.rawUserData = null;
            localStorage.removeItem(this.USER_DATA_KEY);
        }

        this.isAuthenticated.set(!!access);
    }

// ------------------------------------
// --- User Data Decoding and RBAC ---
// ------------------------------------

    /**
     * Decodes the Base64 'user_data' string and returns the parsed object.
     */
    getUserData(): UserDataPayload | null {
        if (!this.rawUserData) {
            return null;
        }

        try {
            const jsonString = atob(this.rawUserData);
            return JSON.parse(jsonString) as UserDataPayload;
        } catch (e) {
            console.error('Error decoding or parsing user data:', e);
            return null;
        }
    }

    /**
     * Checks if the user belongs to a specific group (role).
     * @param groupName The name of the group/role (e.g., 'System Administrator').
     */
    userInGroup(groupName: string): boolean {
        const userData = this.getUserData();
        const groups: string[] = userData?.user?.groups || [];

        return groups.includes(groupName);
    }

    getAuthenticatedUser(): User | null {
        const userData = this.getUserData();
        return userData?.user || null;
    }

// ------------------------------------
// --- Auth Endpoints ---
// ------------------------------------

    login(credentials: any): Observable<TokenResponse> {
        return this.standardHttp.post<TokenResponse>(`${this.baseUrl}/login/`, credentials).pipe(
            tap(response => {
                this.setTokens(response.access, response.refresh, response.user_data);
            })
        );
    }

    refreshAccessToken(): Observable<RefreshResponse> {
        this.isRefreshing.next(true);
        const refresh = this.getRefreshToken();

        if (!refresh) {
            this.isRefreshing.next(false);
            this.logout(true);
            return throwError(() => new Error('No refresh token available.'));
        }

        const payload = { refresh: refresh };

        // Use the interceptor-free client
        return this.interceptorFreeHttp.post<RefreshResponse>(`${this.baseUrl}/token/refresh/`, payload).pipe(
            tap(response => {
                const newRefresh = response.refresh || refresh;
                // Preserve the raw user data during refresh since the backend often doesn't return it
                this.setTokens(response.access, newRefresh, this.rawUserData || undefined);
            }),
            catchError(err => {
                this.logout(true);
                return throwError(() => err);
            }),
            tap(() => this.isRefreshing.next(false))
        );
    }


    logout(redirect: boolean = true): void {
        // Pass null for all to trigger cleanup of Local Storage in setTokens
        this.setTokens(null, null, null);
        this.rawUserData = null;

        if (redirect) {
            this.router.navigate(['/der']); // Change to your actual login route if different
        }
        console.log('User logged out. Tokens and data removed.');
    }
}
