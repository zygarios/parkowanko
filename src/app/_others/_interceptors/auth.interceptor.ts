import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../_services/_core/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export function authInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
    const authService = inject(AuthService);
    const token = authService.getToken();

    let request = req;

    if (token) {
        request = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                if (req.url.includes('/auth/refresh/') || req.url.includes('/auth/login/')) {
                    return throwError(() => error);
                }

                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);
                    const refreshToken = authService.getRefreshToken();

                    if (refreshToken) {
                        return authService.refreshToken(refreshToken).pipe(
                            switchMap((res) => {
                                isRefreshing = false;
                                refreshTokenSubject.next(res.access);
                                return next(
                                    req.clone({
                                        setHeaders: {
                                            Authorization: `Bearer ${res.access}`,
                                        },
                                    }),
                                );
                            }),
                            catchError((err) => {
                                isRefreshing = false;
                                authService.logout();
                                return throwError(() => err);
                            }),
                        );
                    } else {
                        authService.logout();
                        return throwError(() => error);
                    }
                } else {
                    return refreshTokenSubject.pipe(
                        filter((token) => token !== null),
                        take(1),
                        switchMap((token) => {
                            return next(
                                req.clone({
                                    setHeaders: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }),
                            );
                        }),
                    );
                }
            }
            return throwError(() => error);
        }),
    );
}
