import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { GuideDialogComponent } from '../../../../_components/guide-dialog/guide-dialog.component';
import { RouterPaths } from '../../../../_others/_helpers/router-paths';
import { ParkingsApiService } from '../../../../_services/_api/parkings-api.service';
import { AuthService } from '../../../../_services/_core/auth.service';
import { GlobalSpinnerService } from '../../../../_services/_core/global-spinner.service';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { GeocodeFeature } from '../../../../_types/geocode-api.type';
import { ParkingsFilter } from '../../../../_types/parkings-filter.type';
import { MapPoisControllerService } from '../../_services/map-pois-controller.service';
import { MapService } from '../../_services/map/map.service';
import { AddressSearchBoxComponent } from './_components/address-search-box/address-search-box.component';

@Component({
  selector: 'app-map-ui-overlay',
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    AddressSearchBoxComponent,
    MatTooltipModule,
  ],
  templateUrl: './map-ui-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .find-nearest-parking-button {
      --mat-fab-container-color: var(--par-color-primary);
      --mat-fab-foreground-color: white;
    }
  `,
})
export class MapUiOverlayComponent {
  private _authService = inject(AuthService);
  private _mapService = inject(MapService);
  private _parkingsApiService = inject(ParkingsApiService);
  private _matDialog = inject(MatDialog);
  private _mapPoisControllerService = inject(MapPoisControllerService);
  private _sharedUtilsService = inject(SharedUtilsService);
  private _globalSpinnerService = inject(GlobalSpinnerService);
  private _router = inject(Router);

  selectedAddress = signal<GeocodeFeature | null>(null);
  isAddingPoiActive = signal<boolean>(false);
  isSpinnerActive = this._globalSpinnerService.isSpinnerActive;

  activeFilter = this._parkingsApiService.parkingFilter;
  parkingsFilter = ParkingsFilter;

  logout() {
    this._sharedUtilsService
      .openInfoDialog({
        title: 'Wylogowanie',
        content: 'Czy na pewno chcesz się wylogować?',
      })
      .afterClosed()
      .pipe(filter((result) => !!result))
      .subscribe(() => this._authService.logout());
  }

  openHelpDialog() {
    this._matDialog.open(GuideDialogComponent, {
      autoFocus: false,
    });
  }

  openSettingsPage() {
    this._router.navigate([RouterPaths.SETTINGS]);
  }

  startAddingPoi() {
    this.isAddingPoiActive.set(true);

    this._mapPoisControllerService
      .startAddingPoi()
      .subscribe(() => this.isAddingPoiActive.set(false));
  }

  async findNearestParking() {
    this._mapService.findNearestParking(this.selectedAddress()?.coords);
  }

  setFilter(filter: ParkingsFilter) {
    this.activeFilter.set(filter);
  }
}
