import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../../_services/_core/auth.service';

// Mutex dla odświeżania tokena - zapobiega wielokrotnym żądaniom odświeżania jednocześnie
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const isOwnApi = req.url.startsWith(environment.apiUrl);
  const token = authService.getAccessToken();

  let request = req;

  if (isOwnApi && token) {
    request = addToken(req, token);
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Obsługujemy 401 tylko dla własnego API i pomijamy zapytanie o logowanie
      if (error.status === 401 && isOwnApi && !req.url.includes('/auth/login')) {
        return handle401Error(request, next, authService);
      }
      return throwError(() => error);
    }),
  );
}

function addToken(request: HttpRequest<any>, token: string) {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null); // Resetujemy strumień

    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      return authService.refreshToken(refreshToken).pipe(
        switchMap((res) => {
          isRefreshing = false;
          refreshTokenSubject.next(res.access);
          return next(addToken(request, res.access));
        }),
        catchError((err) => {
          isRefreshing = false;
          authService.logout();
          return throwError(() => err);
        }),
      );
    } else {
      isRefreshing = false;
      authService.logout();
      return throwError(() => new Error('Refresh token missing'));
    }
  } else {
    // Kolejne zapytania czekają na zakończenie odświeżania w strumieniu Subjecta
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addToken(request, token!))),
    );
  }
}
