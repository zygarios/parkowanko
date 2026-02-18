import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { extractFirstError } from '../../_others/_helpers/error-extractor';
import { RouterPaths } from '../../_others/_helpers/router-paths';
import {
  AuthResponse,
  AuthResponseAfterRefresh,
  LoginSaveData,
  PasswordResetConfirmData,
  RegisterSaveData,
} from '../../_types/auth/auth.model';
import { User } from '../../_types/auth/user.type';
import { GlobalSpinnerService } from './global-spinner.service';
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
  private _globalSpinnerService = inject(GlobalSpinnerService);

  private _tokenExpirationTimer?: ReturnType<typeof setTimeout>;
  private _currentUser = signal<User | null>(null);

  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => !!this._currentUser());

  constructor() {
    this._tryAutoLogin();
  }

  login(data: LoginSaveData): Observable<AuthResponse> {
    this._globalSpinnerService.show();
    return this._http.post<AuthResponse>(`${environment.apiUrl}/auth/login/`, data).pipe(
      tap((res) => this.handleAuthSuccess(res)),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = extractFirstError(err.error);
        this._sharedUtilsService.openSnackbar(errorMsg || 'Nieprawidłowy login lub hasło', 'ERROR');
        return throwError(() => err);
      }),
      finalize(() => this._globalSpinnerService.hide()),
    );
  }

  register(data: RegisterSaveData): Observable<void> {
    this._globalSpinnerService.show();
    return this._http.post<void>(`${environment.apiUrl}/auth/register/`, data).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 400) {
          const errorMsg = extractFirstError(err.error);
          this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
        }
        return throwError(() => err);
      }),
      finalize(() => this._globalSpinnerService.hide()),
    );
  }

  confirmEmailAfterRegister(token: string): Observable<AuthResponse> {
    this._globalSpinnerService.show();
    return this._http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register/confirm-email/`, { key: token })
      .pipe(
        tap((res) => this.handleAuthSuccess(res)),
        finalize(() => this._globalSpinnerService.hide()),
      );
  }

  resendConfirmationEmail(email: string): Observable<void> {
    this._globalSpinnerService.show();
    return this._http
      .post<void>(`${environment.apiUrl}/auth/register/resend-confirm-email/`, { email })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const errorMsg = extractFirstError(err.error);
          this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
          return throwError(() => err);
        }),
        finalize(() => this._globalSpinnerService.hide()),
      );
  }

  refreshToken(refresh: string): Observable<AuthResponseAfterRefresh> {
    return this._http
      .post<AuthResponseAfterRefresh>(`${environment.apiUrl}/auth/token/refresh/`, { refresh })
      .pipe(tap((res) => this._setAuthAfterRefreshTokens(res)));
  }

  requestPasswordReset(email: string): Observable<void> {
    this._globalSpinnerService.show();
    return this._http.post<void>(`${environment.apiUrl}/auth/password-reset/`, { email }).pipe(
      catchError((err: HttpErrorResponse) => {
        const errorMsg = extractFirstError(err.error);
        this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
        return throwError(() => err);
      }),
      finalize(() => this._globalSpinnerService.hide()),
    );
  }

  validatePasswordResetToken(token: string): Observable<{ status: string }> {
    this._globalSpinnerService.show();
    return this._http
      .post<{ status: string }>(`${environment.apiUrl}/auth/password-reset/validate-token/`, {
        token,
      })
      .pipe(finalize(() => this._globalSpinnerService.hide()));
  }

  confirmPasswordReset(data: PasswordResetConfirmData): Observable<{ status: string }> {
    this._globalSpinnerService.show();
    return this._http
      .post<{ status: string }>(`${environment.apiUrl}/auth/password-reset/confirm/`, data)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const errorMsg = extractFirstError(err.error);
          this._sharedUtilsService.openSnackbar(errorMsg, 'ERROR');
          return throwError(() => err);
        }),
        finalize(() => this._globalSpinnerService.hide()),
      );
  }

  deleteAccount(): Observable<void> {
    this._globalSpinnerService.show();
    return this._http.delete<void>(`${environment.apiUrl}/auth/user/delete/`).pipe(
      tap(() => this.logout()),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = extractFirstError(err.error);
        this._sharedUtilsService.openSnackbar(errorMsg || 'Błąd podczas usuwania konta', 'ERROR');
        return throwError(() => err);
      }),
      finalize(() => this._globalSpinnerService.hide()),
    );
  }

  handleAuthSuccess(res: AuthResponse): void {
    this._currentUser.set(res.user);
    localStorage.setItem('auth_data', JSON.stringify(res));
    this._setupAutoLogoutFromToken(res.access);
    this._router.navigate([RouterPaths.MAIN], { replaceUrl: true });
  }

  logout(): void {
    clearTimeout(this._tokenExpirationTimer);
    this._currentUser.set(null);
    localStorage.removeItem('auth_data');
    this._router.navigate([RouterPaths.AUTH_LOGIN]);
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

  private _setupAutoLogoutFromToken(token: string): void {
    const exp = this._decodeJwt(token)?.exp;
    if (exp) {
      this._setupAutoLogout(exp);
    }
  }

  private _setAuthAfterRefreshTokens(res: AuthResponseAfterRefresh): void {
    const storedAuth = this._getStoredAuth();
    if (!storedAuth) return;

    localStorage.setItem(
      'auth_data',
      JSON.stringify({
        user: storedAuth.user,
        access: res.access,
        refresh: res.refresh,
      }),
    );

    this._setupAutoLogoutFromToken(res.access);
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
