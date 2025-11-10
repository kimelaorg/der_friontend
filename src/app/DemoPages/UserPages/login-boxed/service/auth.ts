import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

// Define response structures for clarity
interface TokenResponse {
    refresh: string;
    access: string;
    user_data: string; // Base64 encoded JSON string
}

interface RefreshResponse {
    access: string;
    refresh?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Dependencies
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = 'http://localhost:8000/api/auth'; 

  // Local Storage Key (Used only for Refresh Token persistence across refreshes)
  private readonly REFRESH_TOKEN_KEY = 'refresh_token_persistent';

  // In-Memory Tokens and Data
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private rawUserData: string | null = null; // Store the raw Base64 string

  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.loadPersistentTokens();
  }

// --- Token Getters & Persistence ---
  
  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken || localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private loadPersistentTokens(): void {
    const persistentRefresh = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (persistentRefresh) {
        this.refreshToken = persistentRefresh;
        this.refreshAccessToken().subscribe({
            error: () => this.logout(false)
        });
    }
  }

  setTokens(access: string | null, refresh: string | null, rawUserData?: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.rawUserData = rawUserData || null;
    this.isAuthenticated.set(!!access); 

    if (refresh) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh);
    } else {
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

// --- User Data Decoding and RBAC Helpers ---

  /**
   * Decodes the Base64 'user_data' string and returns the parsed object.
   */
  getUserData(): any | null {
    if (!this.rawUserData) {
      return null;
    }
   
    try {
      const jsonString = atob(this.rawUserData);
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Error decoding or parsing user data:', e);
      return null;
    }
  }

  userInGroup(groupName: string): boolean {
    const userData = this.getUserData();
    // Assuming the decoded JSON has a top-level property 'groups' containing an array of strings
    const groups: string[] = userData?.groups || [];

    return groups.includes(groupName);
  }

// --- Auth Endpoints ---

  login(credentials: any): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/login/`, credentials).pipe(
        tap(response => {
            this.setTokens(response.access, response.refresh, response.user_data); 
        })
    );
  }

  refreshAccessToken(): Observable<RefreshResponse> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return new Observable(observer => observer.error('No refresh token available.'));
    }

    const payload = { refresh: refresh };

    return this.http.post<RefreshResponse>(`${this.baseUrl}/token/refresh/`, payload).pipe(
        tap(response => {
            this.setTokens(response.access, response.refresh || refresh, this.rawUserData || undefined);
            console.log('Access token successfully refreshed.');
        })
    );
  }


  logout(redirect: boolean = true): void {
    this.setTokens(null, null, null);
    this.rawUserData = null;

    if (redirect) {
      this.router.navigate(['/der']);
    }
    console.log('User logged out. Tokens removed from memory.');
  }

  checkAuthorization(): void {
    this.isAuthenticated.set(!!this.accessToken);
  }
}
