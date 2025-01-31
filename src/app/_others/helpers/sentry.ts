import { ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { environment } from '../../../environments/environment.development';

export const initSentry = () => {
  return Sentry.init({
    dsn: environment.sentryDsn,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
};

export const provideSentry = () => ({
  provide: ErrorHandler,
  useValue: Sentry.createErrorHandler(),
});
