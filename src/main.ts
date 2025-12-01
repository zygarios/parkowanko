import { bootstrapApplication } from '@angular/platform-browser';
import { initSentry } from './app/_others/helpers/sentry';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

initSentry();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
