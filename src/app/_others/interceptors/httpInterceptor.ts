import { HttpHandlerFn, HttpRequest } from '@angular/common/http';

export function httpInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  console.log(req.url);
  return next(req);
}
