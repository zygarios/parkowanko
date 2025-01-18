import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./_pages/main-page/main-page.component').then(
        (c) => c.MainPageComponent,
      ),
  },
];
