import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { provideServiceWorker } from '@angular/service-worker';
import { provideSentry } from './_others/_helpers/sentry';
import { authInterceptor } from './_others/_interceptors/auth.interceptor';
import { httpInterceptor } from './_others/_interceptors/http.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor, httpInterceptor])),
    ...provideSentry(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: `registerWhenStable:${30000}`,
    }),
    // {
    //   provide: STEPPER_GLOBAL_OPTIONS,
    //   useValue: { displayDefaultIndicatorType: false },
    // },
  ],
};
