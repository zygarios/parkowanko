import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../_types/auth/auth.model';
import { AuthService } from './auth.service';
import { GlobalSpinnerService } from './global-spinner.service';
import { SharedUtilsService } from './shared-utils.service';

/**
 * Handles social login API calls to the backend.
 *
 * Backend contract:
 *
 * Google (Authorization Code Flow):
 *   POST /auth/social/google/
 *   Body: { code: string }
 *   → Backend exchanges `code` for tokens via Google's token endpoint
 *     (https://oauth2.googleapis.com/token) using GOOGLE_CLIENT_SECRET
 *   → Verifies id_token, extracts user info, creates/finds user
 *   → Returns AuthResponse { access, refresh, expiresIn, user }
 */
@Injectable({ providedIn: 'root' })
export class SocialLoginService {
  private _http = inject(HttpClient);
  private _authService = inject(AuthService);
  private _globalSpinnerService = inject(GlobalSpinnerService);
  private _sharedUtilsService = inject(SharedUtilsService);

  loginWithGoogle(code: string): Observable<AuthResponse> {
    this._globalSpinnerService.show();
    return this._http
      .post<AuthResponse>(`${environment.apiUrl}/auth/social/google/`, {
        code,
      })
      .pipe(
        tap((res) => this._authService.handleAuthSuccess(res)),
        catchError((err: HttpErrorResponse) => {
          this._sharedUtilsService.openSnackbar('Błąd logowania przez Google', 'ERROR');
          return throwError(() => err);
        }),
        finalize(() => this._globalSpinnerService.hide()),
      );
  }
}
