import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  AuthResponse,
  AuthResponseAfterRefresh,
  LoginSaveData,
  RegisterSaveData,
} from '../../_types/auth/auth.model';
import { User } from '../../_types/auth/user.type';

interface JwtPayload {
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _http = inject(HttpClient);
  private _router = inject(Router);

  private _tokenExpirationTimer?: ReturnType<typeof setTimeout>;
  private _currentUser = signal<User | null>(null);

  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => !!this._currentUser());

  constructor() {
    this._tryAutoLogin();
  }

  login(data: LoginSaveData): Observable<AuthResponse> {
    return this._http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login/`, data)
      .pipe(tap((res) => this._setAuthData(res)));
  }

  register(data: RegisterSaveData): Observable<AuthResponse> {
    return this._http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register/`, data)
      .pipe(tap((res) => this._setAuthData(res)));
  }

  refreshToken(refresh: string): Observable<AuthResponse> {
    return this._http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh/`, { refresh })
      .pipe(tap((res) => this._setAuthAfterRefreshTokens(res)));
  }

  logout(): void {
    clearTimeout(this._tokenExpirationTimer);
    this._currentUser.set(null);
    localStorage.removeItem('auth_data');
    this._router.navigate(['/auth']);
  }

  getAccessToken(): string | null {
    return this._getStoredAuth()?.access ?? null;
  }

  getRefreshToken(): string | null {
    return this._getStoredAuth()?.refresh ?? null;
  }

  private _getStoredAuth(): AuthResponse | null {
    const data = localStorage.getItem('auth_data');
    return data ? JSON.parse(data) : null;
  }

  private _decodeJwt(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  private _setAuthData(res: AuthResponse): void {
    this._currentUser.set(res.user);
    localStorage.setItem('auth_data', JSON.stringify(res));
    const exp = this._decodeJwt(res.access)?.exp;
    if (exp) {
      this._setupAutoLogout(exp);
    }
    this._router.navigate(['/']);
  }

  private _setAuthAfterRefreshTokens(res: AuthResponseAfterRefresh): void {
    const storedAuth = this._getStoredAuth();
    if (!storedAuth) return;

    const exp = this._decodeJwt(res.access)?.exp;
    if (!exp) return;

    localStorage.setItem(
      'auth_data',
      JSON.stringify({
        user: storedAuth.user,
        access: res.access,
        refresh: res.refresh,
      }),
    );

    this._setupAutoLogout(exp);
  }

  private _setupAutoLogout(exp: number): void {
    clearTimeout(this._tokenExpirationTimer);

    const expiresInMs = exp * 1000 - Date.now();
    this._tokenExpirationTimer = setTimeout(() => this.logout(), Math.max(expiresInMs, 0));
  }

  private _tryAutoLogin(): void {
    const auth = this._getStoredAuth();
    const token = auth?.access;
    if (!token || !auth?.user) return;

    const exp = this._decodeJwt(token)?.exp;
    if (!exp || exp * 1000 < Date.now()) return;

    this._currentUser.set(auth.user);
    this._setupAutoLogout(exp);
  }
}
