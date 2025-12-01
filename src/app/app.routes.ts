import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

const routesList: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./_pages/main-page/main-page.component').then((c) => c.MainPageComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./_pages/auth-page/auth-page.component').then((c) => c.AuthPageComponent),
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
