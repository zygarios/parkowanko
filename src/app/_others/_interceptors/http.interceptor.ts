import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { SharedUtilsService } from '../../_services/_core/shared-utils.service';

export function httpInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const sharedUtilsService = inject(SharedUtilsService);

  return next(req).pipe(
    catchError((errorRes: HttpErrorResponse) => {
      sharedUtilsService.openSnackbar('Ups, wystąpił błąd serwera', 'ERROR');
      return throwError(() => errorRes);
    }),
  );
}
