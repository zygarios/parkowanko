import { ErrorHandler, isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { environment } from '../../../environments/environment.development';

export const initSentry = () => {
  if (isDevMode()) return;
  Sentry.init({
    dsn: environment.sentryDsn,
    integrations: [
      Sentry.replayIntegration({
        maskAllInputs: false,
        maskAllText: false,
        maxReplayDuration: 20000,
      }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: environment.environmentType,
    sendDefaultPii: true,
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
