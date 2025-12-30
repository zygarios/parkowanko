import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './_others/_guards/auth.guard';
import { AddressSearchService } from './_pages/main-page/_services/address-search.service';
import { MapPoisControllerService } from './_pages/main-page/_services/map-pois-controller.service';
import { MapInitializerService } from './_pages/main-page/_services/map/map-initializer.service';
import { MapLayersService } from './_pages/main-page/_services/map/map-layers.service';
import { MapRendererService } from './_pages/main-page/_services/map/map-renderer.service';
import { MapService } from './_pages/main-page/_services/map/map.service';

const routesList: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./_pages/main-page/main-page.component').then((c) => c.MainPageComponent),
    canMatch: [authGuard('FOR_LOGGED')],
    providers: [
      MapInitializerService,
      MapService,
      MapRendererService,
      MapLayersService,
      AddressSearchService,
      MapPoisControllerService,
    ],
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
