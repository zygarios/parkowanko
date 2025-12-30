import { DestroyRef, inject, Injectable, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { catchError, EMPTY, of, switchMap, tap } from 'rxjs';
import { ParkingEditLocationApiService } from '../../../_services/_api/parking-edit-location-api.service';
import { ParkingsApiService } from '../../../_services/_api/parkings-api.service';
import { SharedUtilsService } from '../../../_services/_core/shared-utils.service';
import { ParkingPoint } from '../../../_types/parking-point.type';
import { AddReviewComponent } from '../_components/add-review/add-review.component';
import {
  addingPoiConfirmSheetConfig,
  changingPoiPositionOptionsSheetConfig,
  selectedPoiOptionsSheetConfig,
  voteForUpdatedPoiPositionProposalSheetConfig,
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

    const sheetRef = this._sharedUtilsService.openSheet(
      selectedPoiOptionsSheetConfig({
        hasEditLocationProposal: this._selectedParking()!.hasEditLocationProposal,
      }),
      {
        hasBackdrop: true,
      },
    );

    sheetRef.onClick
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
            case PoiActionsEnum.VIEW_UPDATE_LOCATION_PROPOSAL:
              return this.handleVoteForUpdatedPoiPositionProposal();
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

    const sheetRef = this._sharedUtilsService.openSheet(
      changingPoiPositionOptionsSheetConfig(this._mapService.isMarkerInsideDisabledZone),
      {
        hasBackdrop: false,
      },
    );

    return sheetRef.onClick.pipe(
      switchMap((result) => {
        if (result === PoiActionsEnum.CONFIRM) {
          return this.confirmUpdatedPoiPosition().pipe(
            tap(() => {
              this._sharedUtilsService.openSnackbar(
                'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona.',
                'SUCCESS',
              );
              this._mapService.removeMoveableMarker();
              sheetRef.dismiss();
              this._selectedParking.set(null);
            }),
            catchError(() => {
              this._sharedUtilsService.openSnackbar(
                'Wystąpił błąd podczas aktualizacji pozycji parkingu.',
                'ERROR',
              );
              this._mapService.flyToPoi(this._selectedParking()!.location, 'CLOSE_ZOOM');
              this._mapService.removeMoveableMarker();
              sheetRef.dismiss();
              this.openDefaultPoiMenu();
              return EMPTY;
            }),
          );
        } else {
          this._mapService.flyToPoi(this._selectedParking()!.location, 'CLOSE_ZOOM');
          this._mapService.removeMoveableMarker();
          sheetRef.dismiss();
          this.openDefaultPoiMenu();
          return EMPTY;
        }
      }),
      takeUntilDestroyed(this._destroyRef),
    );
  }

  confirmUpdatedPoiPosition() {
    const selectedPoi: ParkingPoint | null = this._selectedParking();
    const location = this._mapService.getMarkerLatLng();
    return this._parkingEditLocationApiService.addEditLocationProposal(selectedPoi!.id, {
      location,
    });
  }

  handleVoteForUpdatedPoiPositionProposal() {
    const parkingPoint = this._selectedParking()!;
    const coords = {
      lat: parkingPoint!.location.lat,
      lng: parkingPoint!.location.lng,
    };

    return this._parkingEditLocationApiService.getEditLocationProposal(parkingPoint.id).pipe(
      tap((res) => {
        this._mapService.renderMarker(res.location);
        this._mapService.renderLineBetweenPoints({
          fixedCoords: coords,
          targetCoords: res.location,
        });
        this._mapService.fitBoundsToPoints(coords, res.location);
      }),
      switchMap(() => {
        const sheetRef = this._sharedUtilsService.openSheet(
          voteForUpdatedPoiPositionProposalSheetConfig(),
          {
            hasBackdrop: false,
          },
        );
        return sheetRef.onClick.pipe(
          switchMap((result) => {
            this._mapService.removeMarker();
            sheetRef.dismiss();
            if (result === PoiActionsEnum.CONFIRM || result === PoiActionsEnum.CANCEL) {
              return this.confirmEditLocationVote(true).pipe(
                tap(() => {
                  this._sharedUtilsService.openSnackbar(
                    'Gotowe!\nOddano głos za zmianą pozycji parkingu.',
                    'SUCCESS',
                  );
                  this._selectedParking.set(null);
                }),
                catchError(() => {
                  this._sharedUtilsService.openSnackbar(
                    'Wystąpił błąd podczas oddania głosu za zmianą pozycji parkingu.',
                    'ERROR',
                  );
                  this._mapService.flyToPoi(this._selectedParking()!.location, 'CLOSE_ZOOM');
                  this.openDefaultPoiMenu();
                  return EMPTY;
                }),
              );
            } else {
              this._mapService.flyToPoi(this._selectedParking()!.location, 'CLOSE_ZOOM');
              this.openDefaultPoiMenu();
              return EMPTY;
            }
          }),

          takeUntilDestroyed(this._destroyRef),
        );
      }),
    );
  }

  confirmEditLocationVote(isLike: boolean) {
    const selectedPoi: ParkingPoint | null = this._selectedParking();
    return this._parkingEditLocationApiService.addEditLocationVote(selectedPoi!.id, {
      isLike,
    });
  }

  startAddingPoi() {
    this._mapService.renderMoveableMarkerWithRadiusAndLineToFixedPoint();

    const sheetRef = this._sharedUtilsService.openSheet(
      addingPoiConfirmSheetConfig(this._mapService.isMarkerInsideDisabledZone),
      {
        hasBackdrop: false,
      },
    );

    return sheetRef.onClick.pipe(
      switchMap((result) => {
        if (result === PoiActionsEnum.CONFIRM) {
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
