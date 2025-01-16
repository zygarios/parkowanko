import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./test-inline/test-inline.component').then(
        (c) => c.TestInlineComponent
      ),
  },
];
