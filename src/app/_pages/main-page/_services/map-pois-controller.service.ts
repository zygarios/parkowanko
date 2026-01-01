import { DestroyRef, inject, Injectable, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { catchError, EMPTY, of, switchMap, tap } from 'rxjs';
import { ParkingEditLocationApiService } from '../../../_services/_api/parking-edit-location-api.service';
import { ParkingsApiService } from '../../../_services/_api/parkings-api.service';
import { ParkingPointActionsSheetService } from '../../../_services/_core/parking-point-actions-sheet.service';
import { SharedUtilsService } from '../../../_services/_core/shared-utils.service';
import { ParkingPoint } from '../../../_types/parking-point.type';
import { AddReviewComponent } from '../_components/add-review/add-review.component';
import {
  addingPoiConfirmSheetConfig,
  changingPoiPositionOptionsSheetConfig,
} from '../_components/map-ui-overlay/_data/poi-controller-sheet-configs.data';
import { PoiActionsEnum } from '../_components/map-ui-overlay/_types/poi-actions.model';
import { ReviewsComponent } from '../_components/reviews/reviews.component';
import { MapService } from './map/map.service';

@Injectable()
export class MapPoisControllerService {
  private readonly _mapService = inject(MapService);
  private readonly _parkingEditLocationApiService = inject(ParkingEditLocationApiService);
  private readonly _parkingsApiService = inject(ParkingsApiService);
  private readonly _sharedUtilsService = inject(SharedUtilsService);
  private readonly _parkingPointActionsSheetService = inject(ParkingPointActionsSheetService);
  private readonly _matDialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _isMapLoaded = this._mapService.isMapLoaded;
  private readonly _selectedParking = this._mapService.selectedParking;

  listenForSelectedPoiToStartEdit() {
    if (this._isMapLoaded() && this._selectedParking()) {
      untracked(() => this.openDefaultPoiMenu());
    }
  }

  openDefaultPoiMenu() {
    this._mapService.removeMoveableMarker();
    this._mapService.flyToPoi(this._selectedParking()!.location, 'CLOSE_ZOOM');

    const sheetRef = this._parkingPointActionsSheetService.openSheet(
      {
        parkingPoint: this._selectedParking()!,
      },
      {
        hasBackdrop: true,
      },
    );

    sheetRef.onDismiss
      .pipe(
        switchMap((result) => {
          switch (result) {
            case PoiActionsEnum.NAVIGATE:
              const location = this._selectedParking()?.location;
              setTimeout(() => {
                if (location) {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
                    '_blank',
                  );
                }
              }, 100);
              break;
            case PoiActionsEnum.ADD_REVIEW:
              this._matDialog.open(AddReviewComponent, {
                data: { parkingPointId: this._selectedParking()?.id },
              });
              break;
            case PoiActionsEnum.VIEW_REVIEWS:
              this._matDialog.open(ReviewsComponent, {
                data: { parkingPoint: this._selectedParking() },
              });
              break;
            case PoiActionsEnum.UPDATE_LOCATION:
              sheetRef.dismiss();
              return this.handleUpdateUserChoice();
          }

          sheetRef.dismiss();
          this._selectedParking.set(null);
          return of(null);
        }),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();
  }

  handleUpdateUserChoice() {
    this._mapService.renderMoveableMarkerWithRadiusAndLineToFixedPoint(
      this._selectedParking()!.location,
    );
    this._mapService.jumpToPoi(this._selectedParking()!.location, 'CLOSE_ZOOM');

    const sheetRef = this._sharedUtilsService.openMenuSheet(
      changingPoiPositionOptionsSheetConfig(),
      {
        hasBackdrop: false,
      },
    );

    return sheetRef.onDismiss.pipe(
      switchMap((result) => {
        if (result === PoiActionsEnum.CONFIRM) {
          if (this._mapService.isMarkerInsideDisabledZone()) {
            this._sharedUtilsService.openSnackbar(
              'Twoje miejsce znajduje się zbyt blisko innych punktów parkingowych.',
              'ERROR',
            );
            return EMPTY;
          }

          const selectedPoi: ParkingPoint | null = this._selectedParking();
          const location = this._mapService.getMarkerLatLng();
          return this._parkingEditLocationApiService
            .addEditLocationProposal(selectedPoi!.id, {
              location,
            })
            .pipe(
              tap(() => {
                this._sharedUtilsService.openSnackbar(
                  'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona.',
                  'SUCCESS',
                );
              }),
              catchError(() => {
                this._sharedUtilsService.openSnackbar(
                  'Wystąpił błąd podczas aktualizacji pozycji parkingu.',
                  'ERROR',
                );
                return of(null);
              }),
            );
        } else {
          return of(null);
        }
      }),
      tap(() => {
        sheetRef.dismiss();
        this.openDefaultPoiMenu();
      }),
      takeUntilDestroyed(this._destroyRef),
    );
  }

  startAddingPoi() {
    this._mapService.renderMoveableMarkerWithRadiusAndLineToFixedPoint();

    const sheetRef = this._sharedUtilsService.openMenuSheet(addingPoiConfirmSheetConfig(), {
      hasBackdrop: false,
    });

    return sheetRef.onDismiss.pipe(
      switchMap((result) => {
        if (result === PoiActionsEnum.CONFIRM) {
          if (this._mapService.isMarkerInsideDisabledZone()) {
            this._sharedUtilsService.openSnackbar(
              'Twoje miejsce znajduje się zbyt blisko innych punktów parkingowych.',
              'ERROR',
            );
            return EMPTY;
          }
          const location = this._mapService.getMarkerLatLng();
          return this._parkingsApiService.postParking({ location }).pipe(
            tap((newParking: ParkingPoint) => {
              this._sharedUtilsService.openSnackbar(
                'Gotowe!\nDodałeś/aś nowy punkt parkingowy.',
                'SUCCESS',
              );
              this._matDialog.open(AddReviewComponent, {
                data: { parkingPointId: newParking.id, skipVoteStep: true },
              });
            }),
            catchError(() => {
              this._sharedUtilsService.openSnackbar(
                'Wystąpił błąd podczas dodawania parkingu.',
                'ERROR',
              );
              return of(null);
            }),
          );
        } else {
          return of(null);
        }
      }),
      tap(() => {
        sheetRef.dismiss();
        this._mapService.removeMoveableMarker();
        this._selectedParking.set(null);
      }),
      takeUntilDestroyed(this._destroyRef),
    );
  }
}
