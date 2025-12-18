import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../_services/_core/auth.service';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const isOwnApi = req.url.startsWith(environment.apiUrl);
  const token = authService.getAccessToken();

  let request = req;

  if (isOwnApi && token) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (
          !req.url.includes('/auth/login') &&
          !req.url.includes('/auth/register') &&
          !req.url.includes('/auth/refresh') &&
          authService.getRefreshToken()
        ) {
          return authService.refreshToken(authService.getRefreshToken()!).pipe(
            switchMap(({ access }) => {
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${access}`,
                  },
                }),
              );
            }),
            catchError((error: HttpErrorResponse) => {
              console.log(error);
              authService.logout();
              return throwError(() => error);
            }),
          );
        } else {
          authService.logout();
        }
      }
      return throwError(() => error);
    }),
  );
}
