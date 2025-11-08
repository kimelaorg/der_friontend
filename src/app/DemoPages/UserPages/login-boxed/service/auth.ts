import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Dependencies
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = 'http://localhost:8000/api/auth';

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userData: any = null;

  isAuthenticated = signal<boolean>(false);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(access: string | null, refresh: string | null, userData?: any): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.userData = userData; // Store the user data
    this.isAuthenticated.set(!!access); // Update auth signal based on access token
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/`, credentials);
  }


  logout(): void {
    this.setTokens(null, null, null);
    this.router.navigate(['/pages/login-boxed']);
    console.log('User logged out. Tokens removed from memory.');
  }

  checkAuthorization(): void {
    this.isAuthenticated.set(!!this.accessToken);
  }
}
