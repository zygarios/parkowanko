import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initSentry, provideSentry } from './_others/helpers/sentry';
import { httpInterceptor } from './_others/interceptors/http-interceptor';
import { routes } from './app.routes';

initSentry();

export const appConfig: ApplicationConfig = {
  providers: [
    provideSentry(),
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([httpInterceptor])),
    provideAnimationsAsync(),
    // TODO na pozniejszym etapie dodac obsluge i przetestowac
    // provideServiceWorker('ngsw-worker.js', {
    // enabled: !isDevMode(),
    //   registrationStrategy: 'registerWhenStable:30000',
    // }),
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } },
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
};
