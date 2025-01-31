import { ErrorHandler, isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { environment } from '../../../environments/environment.development';

export const initSentry = () => {
  if (isDevMode()) return;
  Sentry.init({
    dsn: environment.sentryDsn,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: environment.environmentLabel,
  });
};

export const provideSentry = () => {
  if (isDevMode()) return [];
  return [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
  ];
};
