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
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { GuideDialogComponent } from '../../../../_components/guide-dialog/guide-dialog.component';
import { ParkingsApiService } from '../../../../_services/_api/parkings-api.service';
import { AuthService } from '../../../../_services/_core/auth.service';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { GeocodeFeature } from '../../../../_types/geocode-api.type';
import { ParkingPoint } from '../../../../_types/parking-point.type';
import { AddReviewComponent } from '../add-review/add-review.component';
import { MapService } from '../map/_services/map.service';
import { ReviewsComponent } from '../reviews/reviews.component';
import { AddressSearchBoxComponent } from './_components/address-search-box/address-search-box.component';
import {
  addingPoiConfirmSheetConfig,
  changingPoiPositionOptionsSheetConfig,
  selectedPoiOptionsSheetConfig,
} from './_data/poi-controller-sheet-configs.data';
import { PoiActionsEnum } from './_types/poi-actions.model';

@Component({
  selector: 'app-ui-overlay',
  imports: [MatMenuModule, MatIconModule, MatButtonModule, AddressSearchBoxComponent],
  templateUrl: './ui-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .add-location-button {
      --mat-fab-small-container-color: var(--par-color-primary);
      --mat-fab-small-foreground-color: white;
    }

    .find-nearest-parking-button {
      --mat-fab-container-color: var(--par-color-primary);
      --mat-fab-foreground-color: white;
    }
  `,
})
export class UiOverlayComponent {
  private readonly _authService = inject(AuthService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _mapService = inject(MapService);
  private readonly _parkingsApiService = inject(ParkingsApiService);
  private readonly _sharedUtilsService = inject(SharedUtilsService);
  private readonly _matDialog = inject(MatDialog);

  isMapLoaded = this._mapService.getIsMapLoaded;

  readonly selectedParking = this._mapService.selectedParking;
  selectedAddress = signal<GeocodeFeature | null>(null);

  constructor() {
    effect(() => this.listenForSelectedPoiToStartEdit());
    effect(() => this.listenForSelectedAddressToFindNearestParking());
  }

  logout() {
    this._authService.logout();
  }

  listenForSelectedAddressToFindNearestParking() {
    this.isMapLoaded();
    this.selectedAddress();
    this.selectedParking();

    untracked(() => {
      if (!this.isMapLoaded()) return;

      const addressCoords = this.selectedAddress()?.coords;
      const parkingLocation = this.selectedParking()?.location;

      this._mapService.renderTargetLocation(addressCoords);

      if (addressCoords && parkingLocation) {
        this._mapService.renderLineBetweenPoints({
          fixedCoords: addressCoords,
          targetCoords: parkingLocation,
        });
      } else {
        this._mapService.renderLineBetweenPoints();
      }
    });
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

  startAddingPoi() {
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
              catchError(() => {
                this._sharedUtilsService.openSnackbar(
                  'Wystąpił błąd podczas dodawania parkingu.',
                  'ERROR',
                );
                sheetRef.dismiss();
                this._mapService.removeMoveableMarker();
                this.selectedParking.set(null);
                return EMPTY;
              }),
            );
          } else {
            sheetRef.dismiss();
            this._mapService.removeMoveableMarker();
            this.selectedParking.set(null);
            return EMPTY;
          }
        }),
        tap((newParking: ParkingPoint) => {
          this._sharedUtilsService.openSnackbar(
            'Gotowe!\nDodałeś/aś nowy punkt parkingowy.',
            'SUCCESS',
          );
          this._matDialog.open(AddReviewComponent, {
            data: { parkingPointId: newParking.id, skipVoteStep: true },
          });
          sheetRef.dismiss();
          this._mapService.removeMoveableMarker();
          this.selectedParking.set(null);
        }),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();
  }

  startEditingPoi() {
    if (!this.selectedParking()) return;
    this._mapService.removeMoveableMarker();
    const sheetRef = this._sharedUtilsService.openSheet(selectedPoiOptionsSheetConfig);

    sheetRef.onClick
      .pipe(takeUntilDestroyed(this._destroyRef))
      .pipe(
        switchMap((menu) => {
          if (menu.result === PoiActionsEnum.NAVIGATE) {
            sheetRef.dismiss();
            const location = this.selectedParking()?.location;
            if (location) {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
                '_blank',
              );
            }
            return EMPTY;
          } else if (menu.result === PoiActionsEnum.ADD_REVIEW) {
            this._matDialog.open(AddReviewComponent, {
              data: { parkingPointId: this.selectedParking()?.id },
            });
            sheetRef.dismiss();
            this._mapService.removeMoveableMarker();
            this.selectedParking.set(null);
            return EMPTY;
          } else if (menu.result === PoiActionsEnum.VIEW_REVIEWS) {
            this._matDialog.open(ReviewsComponent, {
              data: { parkingPointId: this.selectedParking()?.id },
            });
            sheetRef.dismiss();
            this._mapService.removeMoveableMarker();
            this.selectedParking.set(null);
            return EMPTY;
          } else if (menu.result === PoiActionsEnum.UPDATE) {
            sheetRef.dismiss();
            this.startUpdatingPoiPosition();
            return this.handleUpdateUserChoice();
          } else {
            sheetRef.dismiss();
            this._mapService.removeMoveableMarker();
            this.selectedParking.set(null);
            return EMPTY;
          }
        }),
      )
      .subscribe({
        next: () => {
          this._sharedUtilsService.openSnackbar(
            'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona.',
            'SUCCESS',
          );
          sheetRef.dismiss();
          this._mapService.removeMoveableMarker();
          this.selectedParking.set(null);
        },
      });
  }

  startUpdatingPoiPosition() {
    const selectedPoi: ParkingPoint | null = this.selectedParking();
    if (!selectedPoi) return;
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
                'Wystąpił błąd podczas aktualizacji pozycji parkingu.',
                'ERROR',
              );
              sheetRef.dismiss();
              this._mapService.removeMoveableMarker();
              this.selectedParking.set(null);
              return EMPTY;
            }),
          );
        } else {
          this._mapService.removeMoveableMarker();
          this.startEditingPoi();
          return EMPTY;
        }
      }),
      takeUntilDestroyed(this._destroyRef),
    );
  }

  confirmUpdatedPoiPosition() {
    const selectedPoi: ParkingPoint | null = this.selectedParking();
    const location = this._mapService.getMarkerLatLng();
    return this._parkingsApiService.patchParking(selectedPoi!.id, { location });
  }

  findNearestParking() {
    this._mapService.findNearestParking(this.selectedAddress()?.coords!);
  }
}
