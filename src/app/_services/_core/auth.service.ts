import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { extractFirstError } from '../../_others/_helpers/error-extractor';
import {
  AuthResponse,
  AuthResponseAfterRefresh,
  LoginSaveData,
  PasswordResetConfirmData,
  RegisterSaveData,
} from '../../_types/auth/auth.model';
import { User } from '../../_types/auth/user.type';
import { SharedUtilsService } from './shared-utils.service';

interface JwtPayload {
  exp: number;
  sub: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _http = inject(HttpClient);
  private _router = inject(Router);
  private _sharedUtilsService = inject(SharedUtilsService);

  private _tokenExpirationTimer?: ReturnType<typeof setTimeout>;
  private _currentUser = signal<User | null>(null);
  private _isAuthenticating = signal(false);

  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => !!this._currentUser());
  isAuthenticating = this._isAuthenticating.asReadonly();

  constructor() {
    this._tryAutoLogin();
  }

  login(data: LoginSaveData): Observable<AuthResponse> {
    this._isAuthenticating.set(true);
    return this._http.post<AuthResponse>(`${environment.apiUrl}/auth/login/`, data).pipe(
      tap((res) => this._setAuthData(res)),
      catchError((err: HttpErrorResponse) => {
        this._isAuthenticating.set(false);
        const errorMsg = extractFirstError(err.error);
        this._sharedUtilsService.openSnackbar(errorMsg || 'Nieprawidłowy login lub hasło', 'ERROR');
        return throwError(() => err);
      }),
      finalize(() => this._isAuthenticating.set(false)),
    );
  }

  register(data: RegisterSaveData): Observable<AuthResponse> {
    this._isAuthenticating.set(true);
    return this._http.post<AuthResponse>(`${environment.apiUrl}/auth/register/`, data).pipe(
      tap((res) => this._setAuthData(res)),
      catchError((err: HttpErrorResponse) => {
        this._isAuthenticating.set(false);
        if (err.status === 400) {
          const errorMsg = extractFirstError(err.error);
          this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
        }
        return throwError(() => err);
      }),
      finalize(() => this._isAuthenticating.set(false)),
    );
  }

  refreshToken(refresh: string): Observable<AuthResponseAfterRefresh> {
    return this._http
      .post<AuthResponseAfterRefresh>(`${environment.apiUrl}/auth/refresh/`, { refresh })
      .pipe(tap((res) => this._setAuthAfterRefreshTokens(res)));
  }

  requestPasswordReset(email: string): Observable<void> {
    return this._http.post<void>(`${environment.apiUrl}/auth/password-reset/`, { email }).pipe(
      catchError((err: HttpErrorResponse) => {
        const errorMsg = extractFirstError(err.error);
        this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
        return throwError(() => err);
      }),
    );
  }

  validatePasswordResetToken(token: string): Observable<{ status: string }> {
    return this._http
      .post<{ status: string }>(`${environment.apiUrl}/auth/password-reset/validate_token/`, {
        token,
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const errorMsg = extractFirstError(err.error);
          this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
          return throwError(() => err);
        }),
      );
  }

  confirmPasswordReset(data: PasswordResetConfirmData): Observable<{ status: string }> {
    return this._http
      .post<{ status: string }>(`${environment.apiUrl}/auth/password-reset/confirm/`, data)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const errorMsg = extractFirstError(err.error);
          this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
          return throwError(() => err);
        }),
      );
  }

  handleSocialAuthSuccess(res: AuthResponse): void {
    this._setAuthData(res);
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
