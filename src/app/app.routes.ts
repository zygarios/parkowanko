import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './_others/_guards/auth.guard';

const routesList: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./_pages/main-page/main-page.component').then((c) => c.MainPageComponent),
    canMatch: [authGuard('FOR_LOGGED')],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./_pages/auth-page/auth-page.component').then((c) => c.AuthPageComponent),
    canMatch: [authGuard('FOR_NOT_LOGGED')],
  },
  ...(!isDevMode()
    ? []
    : [
        {
          path: 'design',
          loadComponent: () =>
            import('./_pages/design-page/design-page.component').then((c) => c.DesignPageComponent),
        },
      ]),
  {
    path: '**',
    redirectTo: '',
  },
];

export const routes = routesList;
