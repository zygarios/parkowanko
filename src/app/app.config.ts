import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  SOCIAL_AUTH_CONFIG,
  SocialAuthServiceConfig,
} from '@abacritt/angularx-social-login';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withExperimentalAutoCleanupInjectors,
  withViewTransitions,
} from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_BOTTOM_SHEET_DEFAULT_OPTIONS } from '@angular/material/bottom-sheet';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { provideSentry } from './_others/_helpers/sentry';
import { authInterceptor } from './_others/_interceptors/auth.interceptor';
import { httpInterceptor } from './_others/_interceptors/http.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions(), withExperimentalAutoCleanupInjectors()),
    provideHttpClient(withInterceptors([authInterceptor, httpInterceptor])),
    ...provideSentry(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { autoFocus: false } },
    { provide: MAT_BOTTOM_SHEET_DEFAULT_OPTIONS, useValue: { autoFocus: false } },
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(environment.googleClientId),
          },
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider(environment.facebookAppId),
          },
        ],
        onError: (err) => {
          console.error(err);
        },
      } as SocialAuthServiceConfig,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: `registerWhenStable:${30000}`,
    }),
  ],
};
