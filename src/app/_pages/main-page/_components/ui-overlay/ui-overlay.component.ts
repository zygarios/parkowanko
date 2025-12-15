import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';
import { GuideDialogComponent } from '../../../../_components/guide-dialog/guide-dialog.component';
import { ParkingsApiService } from '../../../../_services/_api/parkings-api.service';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { GeocodeFeature } from '../../../../_types/geocode-api.type';
import { Parking } from '../../../../_types/parking.type';
import { AddReviewComponent } from '../add-review/add-review.component';
import { MapService } from '../map/_services/map.service';
import { AddressSearchBoxComponent } from './_components/address-search-box/address-search-box.component';
import {
  addingPoiConfirmSheetConfig,
  changingPoiPositionOptionsSheetConfig,
  selectedPoiOptionsSheetConfig,
} from './_data/poi-controller-sheet-configs.data';
import { PoiActionsEnum } from './_types/poi-actions.model';

enum ActiveModeEnum {
  DEFAULT = 'DEFAULT',
  ADDING_POI = 'ADDING_POI',
  EDITING_POI = 'EDITING_POI',
  UPDATING_POI_POSITION = 'UPDATE_POI_POSITION',
}
@Component({
  selector: 'app-ui-overlay',
  imports: [MatMenuModule, MatIconModule, MatButtonModule, AddressSearchBoxComponent, RouterLink],
  templateUrl: './ui-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .add-location-button {
      --mat-fab-small-container-color: var(--par-color-primary);
      --mat-fab-small-foreground-color: white;
    }

    .find-nearest-parking-button {
      --mat-fab-container-color: var(--par-color-success);
      --mat-fab-foreground-color: white;
    }
  `,
})
export class UiOverlayComponent {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _mapService = inject(MapService);
  private readonly _parkingsApiService = inject(ParkingsApiService);
  private readonly _sharedUtilsService = inject(SharedUtilsService);
  private readonly _matDialog = inject(MatDialog);

  environmentType = environment.environmentType;

  ACTIVE_MODE_ENUM = ActiveModeEnum;
  activeMode = signal(ActiveModeEnum.DEFAULT);
  isMapLoaded = this._mapService.getIsMapLoaded;

  readonly selectedParking = this._mapService.selectedParking;
  selectedAddress = signal<GeocodeFeature | null>(null);

  constructor() {
    effect(() => this.listenForSelectedPoiToStartEdit());
  }

  openHelpDialog() {
    this._matDialog.open(GuideDialogComponent, {
      autoFocus: false,
    });
  }

  private listenForSelectedPoiToStartEdit() {
    this.selectedParking();
    untracked(() => this.startEditingPoi());
  }

  setDefaultState() {
    this.activeMode.set(ActiveModeEnum.DEFAULT);
    this.selectedParking.set(null);
  }

  stopAddingPoi() {
    this._mapService.removeMoveableMarker();
    this.setDefaultState();
  }

  startAddingPoi() {
    this.activeMode.set(ActiveModeEnum.ADDING_POI);
    this._mapService.renderMoveableMarker();

    const sheetRef = this._sharedUtilsService.openSheet(
      addingPoiConfirmSheetConfig(this._mapService.isMarkerInsideDisabledZone),
      {
        disableClose: true,
      },
    );

    sheetRef.onClick
      .pipe(
        switchMap((menu) => {
          if (menu.result === PoiActionsEnum.CONFIRM) {
            const location = this._mapService.getMarkerLatLng();
            return this._parkingsApiService.postParking({ location }).pipe(
              tap((newParking) =>
                this._matDialog.open(AddReviewComponent, {
                  data: { parkingId: newParking.id, skipVoteStep: true },
                }),
              ),
              catchError(() => {
                this._matDialog.open(AddReviewComponent, {
                  data: { parkingId: 1, skipVoteStep: true },
                });
                this._sharedUtilsService.openSnackbar(
                  'Wystąpił błąd podczas dodawania parkingu',
                  'ERROR',
                );
                return EMPTY;
              }),
            );
          } else {
            sheetRef.dismiss();
            this.stopAddingPoi();
            return EMPTY;
          }
        }),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: () => {
          this._sharedUtilsService.openSnackbar(
            'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
            'SUCCESS',
          );
          sheetRef.dismiss();
          this.stopAddingPoi();
        },
      });
  }

  startEditingPoi() {
    if (!this.selectedParking() || this.activeMode() === ActiveModeEnum.ADDING_POI) return;
    this.activeMode.set(ActiveModeEnum.EDITING_POI);

    const sheetRef = this._sharedUtilsService.openSheet(selectedPoiOptionsSheetConfig);

    sheetRef.onClick
      .pipe(takeUntilDestroyed(this._destroyRef))
      .pipe(
        switchMap((menu) => {
          if (menu.result === PoiActionsEnum.UPDATE) {
            this.startUpdatingPoiPosition();
            return this.handleUpdateUserChoice();
          } else if (menu.result === PoiActionsEnum.NAVIGATE) {
            sheetRef.dismiss();
            const location = this.selectedParking()?.location;
            if (location) {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
                '_blank',
              );
            }
            return EMPTY;
          } else {
            sheetRef.dismiss();
            this._mapService.removeMoveableMarker();
            this.setDefaultState();
            return EMPTY;
          }
        }),
      )
      .subscribe({
        next: () => {
          this._sharedUtilsService.openSnackbar(
            'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona',
            'SUCCESS',
          );
          sheetRef.dismiss();
          this._mapService.removeMoveableMarker();
          this.setDefaultState();
        },
      });
  }

  startUpdatingPoiPosition() {
    const selectedPoi: Parking | null = this.selectedParking();
    if (!selectedPoi) return;
    this.activeMode.set(ActiveModeEnum.UPDATING_POI_POSITION);
    this._mapService.renderMoveableMarker(this.selectedParking()?.location);
    this._mapService.jumpToPoi(selectedPoi?.location, 'CLOSE_ZOOM');
  }

  handleUpdateUserChoice() {
    const sheetRef = this._sharedUtilsService.openSheet(
      changingPoiPositionOptionsSheetConfig(this._mapService.isMarkerInsideDisabledZone),
      {
        disableClose: true,
      },
    );

    return sheetRef.onClick.pipe(
      switchMap((menu) => {
        if (menu.result === PoiActionsEnum.CONFIRM) {
          return this.confirmUpdatedPoiPosition().pipe(
            catchError(() => {
              this._sharedUtilsService.openSnackbar(
                'Wystąpił błąd podczas aktualizacji pozycji parkingu',
                'ERROR',
              );
              return EMPTY;
            }),
          );
        } else {
          this.stopUpdatingPoiPosition();
          return EMPTY;
        }
      }),
      takeUntilDestroyed(this._destroyRef),
    );
  }

  stopUpdatingPoiPosition() {
    this._mapService.removeMoveableMarker();
    this.startEditingPoi();
  }

  confirmUpdatedPoiPosition() {
    const selectedPoi: Parking | null = this.selectedParking();
    const location = this._mapService.getMarkerLatLng();
    return this._parkingsApiService.patchParking(selectedPoi!.id, { location });
  }
}
