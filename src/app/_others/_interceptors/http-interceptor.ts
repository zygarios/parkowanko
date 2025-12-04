import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { SharedUtilsService } from '../../_services/shared-utils.service';

export function httpInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const sharedUtilsService = inject(SharedUtilsService);

  return next(req).pipe(
    catchError((error) => {
      sharedUtilsService.openSnackbar(error, 'ERROR');
      return throwError(() => error);
    }),
  );
}
