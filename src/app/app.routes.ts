import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './_others/_guards/auth.guard';
import { RouterPaths } from './_others/_helpers/router-paths';
import { AddressSearchService } from './_pages/main-page/_services/address-search.service';
import { MapPoisControllerService } from './_pages/main-page/_services/map-pois-controller.service';
import { MapInitializerService } from './_pages/main-page/_services/map/map-initializer.service';
import { MapLayersService } from './_pages/main-page/_services/map/map-layers.service';
import { MapRendererService } from './_pages/main-page/_services/map/map-renderer.service';
import { MapService } from './_pages/main-page/_services/map/map.service';

const routesList: Routes = [
  {
    path: RouterPaths.MAIN,
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
    path: RouterPaths.SETTINGS,
    loadComponent: () =>
      import('./_pages/settings-page/settings-page.component').then((c) => c.SettingsPageComponent),
    canMatch: [authGuard('FOR_LOGGED')],
  },
  {
    path: `${RouterPaths.AUTH}/:mode`,
    loadComponent: () =>
      import('./_pages/auth-page/auth-page.component').then((c) => c.AuthPageComponent),
    canMatch: [authGuard('FOR_NOT_LOGGED')],
  },
  {
    path: RouterPaths.FINISH_REGISTER_GOOGLE,
    loadComponent: () =>
      import('./_pages/auth-page/auth-page.component').then((c) => c.AuthPageComponent),
    canMatch: [authGuard('FOR_NOT_LOGGED')],
  },
  {
    path: RouterPaths.AUTH,
    redirectTo: RouterPaths.AUTH_LOGIN,
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
    path: RouterPaths.PRIVACY_POLICY,
    loadComponent: () =>
      import('./_pages/privacy-policy/privacy-policy.component').then(
        (c) => c.PrivacyPolicyComponent,
      ),
  },
  {
    path: '**',
    redirectTo: RouterPaths.MAIN,
  },
];

export const routes = routesList;
