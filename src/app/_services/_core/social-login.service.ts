import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../_types/auth/auth.model';
import { AuthService } from './auth.service';
import { GlobalSpinnerService } from './global-spinner.service';
import { SharedUtilsService } from './shared-utils.service';

@Injectable({ providedIn: 'root' })
export class SocialLoginService {
  private _http = inject(HttpClient);
  private _authService = inject(AuthService);
  private _globalSpinnerService = inject(GlobalSpinnerService);
  private _sharedUtilsService = inject(SharedUtilsService);

  loginWithGoogle(data: {
    access_token?: string;
    code?: string;
    id_token?: string;
  }): Observable<AuthResponse> {
    this._globalSpinnerService.show();
    console.log(data);
    return this._http.post<AuthResponse>(`${environment.apiUrl}/auth/social/google/`, data).pipe(
      tap((res) => this._authService.handleSocialAuthSuccess(res)),
      catchError((err: HttpErrorResponse) => {
        this._sharedUtilsService.openSnackbar('Błąd logowania przez Google', 'ERROR');
        return throwError(() => err);
      }),
      finalize(() => this._globalSpinnerService.hide()),
    );
  }

  loginWithFacebook(token: string): Observable<AuthResponse> {
    this._globalSpinnerService.show();
    return this._http
      .post<AuthResponse>(`${environment.apiUrl}/auth/social/facebook/`, {
        token: token,
      })
      .pipe(
        tap((res) => this._authService.handleSocialAuthSuccess(res)),
        catchError((err: HttpErrorResponse) => {
          this._sharedUtilsService.openSnackbar('Błąd logowania przez Facebook', 'ERROR');
          return throwError(() => err);
        }),
        finalize(() => this._globalSpinnerService.hide()),
      );
  }
}
