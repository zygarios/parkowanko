import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { catchError, EMPTY, finalize, fromEvent, map, of, switchMap, take, tap } from 'rxjs';
import { MenuSheetResult } from '../../../_components/menu-sheet/menu-sheet.model';
import { ParkingPointActionsSheetComponent } from '../../../_components/parking-point-actions-sheet/parking-point-actions-sheet.component';
import { ParkingPointActionsSheetResult } from '../../../_components/parking-point-actions-sheet/parking-point-actions-sheet.type';
import { GeocodeApiService } from '../../../_services/_api/geocode-api.service';
import { ParkingEditLocationApiService } from '../../../_services/_api/parking-edit-location-api.service';
import { ParkingsApiService } from '../../../_services/_api/parkings-api.service';
import { ReviewsApiService } from '../../../_services/_api/reviews-api.service';
import { AuthService } from '../../../_services/_core/auth.service';
import { GlobalSpinnerService } from '../../../_services/_core/global-spinner.service';
import { SharedUtilsService } from '../../../_services/_core/shared-utils.service';
import { ParkingPoint } from '../../../_types/parking-point.type';
import { Review } from '../../../_types/review.type';
import { AddReviewComponent } from '../_components/add-review/add-review.component';
import {
  addingPoiConfirmSheetConfig,
  changingPoiPositionOptionsSheetConfig,
} from '../_components/map-ui-overlay/_data/poi-controller-sheet-configs.data';
import { ReviewsComponent } from '../_components/reviews/reviews.component';
import { MapService } from './map/map.service';

const LAST_NAVIGATED_PARKING_ID = 'par_last_navigated_parking_id';

@Injectable()
export class MapPoisControllerService {
  private readonly _mapService = inject(MapService);
  private readonly _parkingEditLocationApiService = inject(ParkingEditLocationApiService);
  private readonly _sharedUtilsService = inject(SharedUtilsService);
  private readonly _matDialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _parkingsApiService = inject(ParkingsApiService);
  private readonly _geocodeApiService = inject(GeocodeApiService);
  private readonly _reviewsApiService = inject(ReviewsApiService);
  private readonly _authService = inject(AuthService);
  private readonly _document = inject(DOCUMENT);
  private readonly _globalSpinnerService = inject(GlobalSpinnerService);

  constructor() {
    this._initNavigationTracker();
  }

  private readonly _isMapLoaded = this._mapService.isMapLoaded;

  // Ma pozostać computed. Do zmiany jest osobna metoda
  private readonly _selectedParking = computed(() => {
    const selectedParkingId = this._mapService.selectedParkingId();
    const parkings = this._parkingsApiService.getParkings()();
    if (selectedParkingId === null) return null;
    return parkings.find((p) => p.id === selectedParkingId) ?? null;
  });

  private readonly _selectedParkingId = this._mapService.selectedParkingId;

  listenForSelectedPoiToStartEdit() {
    if (this._isMapLoaded() && this._selectedParkingId()) {
      untracked(() => this.openDefaultPoiMenu());
    }
  }

  openDefaultPoiMenu() {
    this._mapService.removeMoveableMarker();
    this._mapService.flyToPoi(this._selectedParking()!.location, 'CLOSE_ZOOM');

    const parking = this._selectedParking()!;

    this._reviewsApiService
      .getReviews(parking.id)
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((reviews) => {
        const sheetRef = this._sharedUtilsService.openSheet(
          ParkingPointActionsSheetComponent,
          {
            parkingPoint: parking,
            reviews,
          },
          {
            hasBackdrop: true,
          },
        );

        sheetRef.onDismiss
          .pipe(
            switchMap((result) => {
              switch (result) {
                case ParkingPointActionsSheetResult.NAVIGATE:
                  this._handleNavigate();
                  break;
                case ParkingPointActionsSheetResult.ADD_REVIEW:
                  sheetRef.dismiss();
                  return this._handleAddReview(reviews).pipe(tap(() => this.openDefaultPoiMenu()));
                case ParkingPointActionsSheetResult.VIEW_REVIEWS:
                  sheetRef.dismiss();
                  return this._handleViewReviews(reviews).pipe(
                    tap(() => this.openDefaultPoiMenu()),
                  );
                case ParkingPointActionsSheetResult.UPDATE_LOCATION:
                  sheetRef.dismiss();
                  return this.handleUpdateUserChoice().pipe(tap(() => this.openDefaultPoiMenu()));
              }

              sheetRef.dismiss();
              this._selectedParkingId.set(null);
              return of(null);
            }),
            takeUntilDestroyed(this._destroyRef),
          )
          .subscribe();
      });
  }

  private _handleNavigate() {
    const { id, location } = this._selectedParking() ?? {};
    if (id) {
      localStorage.setItem(LAST_NAVIGATED_PARKING_ID, id.toString());
    }
    setTimeout(
      () =>
        location &&
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
          '_blank',
        ),

      100,
    );
  }

  private _initNavigationTracker() {
    this._checkAndPromptForReview();

    fromEvent(this._document, 'visibilitychange')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        if (this._document.visibilityState === 'visible') {
          this._checkAndPromptForReview();
        }
      });
  }

  private _checkAndPromptForReview() {
    const lastNavigatedId = localStorage.getItem(LAST_NAVIGATED_PARKING_ID);
    if (!lastNavigatedId) return;

    localStorage.removeItem(LAST_NAVIGATED_PARKING_ID);
    const parkingId = parseInt(lastNavigatedId, 10);

    this._parkingsApiService
      .getParking(parkingId)
      .pipe(
        switchMap((parking) =>
          this._reviewsApiService
            .getReviews(parkingId)
            .pipe(map((reviews) => ({ parking, reviews }))),
        ),
        take(1),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(({ parking, reviews }) => {
        this._handleAddReview(reviews, parking).subscribe();
      });
  }

  private _handleAddReview(reviews: Review[], parking?: ParkingPoint) {
    const p = parking ?? this._selectedParking();
    if (!p) return of(null);

    const userId = this._authService.currentUser()?.id;
    const userReview = reviews.find((review) => review.user.id === userId);

    return this._matDialog
      .open(AddReviewComponent, {
        data: {
          parkingPointId: p.id,
          parkingAddress: p.address,
          userReview,
        },
      })
      .afterClosed();
  }

  private _handleViewReviews(reviews: Review[]) {
    return this._matDialog
      .open(ReviewsComponent, {
        data: { parkingPoint: this._selectedParking(), reviews },
      })
      .afterClosed();
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
        if (result === MenuSheetResult.CONFIRM) {
          if (this._mapService.isMarkerInsideDisabledZone()) {
            this._sharedUtilsService.openSnackbar(
              'Punkt jest zbyt blisko innych parkingów lub zbyt daleko od oryginału (max 100m).',
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
                  'Gotowe!\nWysłano propozycję zmiany lokalizacji parkingu.',
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
    );
  }

  startAddingPoi() {
    this._mapService.renderMoveableMarkerWithRadiusAndLineToFixedPoint();
    const sheetRef = this._sharedUtilsService.openMenuSheet(addingPoiConfirmSheetConfig(), {
      hasBackdrop: false,
    });

    return sheetRef.onDismiss.pipe(
      switchMap((result) => {
        if (result === MenuSheetResult.CONFIRM) {
          if (this._mapService.isMarkerInsideDisabledZone()) {
            this._sharedUtilsService.openSnackbar(
              'Twoje miejsce znajduje się zbyt blisko innych punktów parkingowych.',
              'ERROR',
            );
            return EMPTY;
          }
          const location = this._mapService.getMarkerLatLng();

          let newParking: ParkingPoint;
          this._globalSpinnerService.show('Dodawanie nowego parkingu...');

          return this._geocodeApiService.getAddressByCoordinates(location).pipe(
            switchMap((address) =>
              this._parkingsApiService.postParking({ location, address: address || null }),
            ),
            finalize(() => this._globalSpinnerService.hide()),
            tap((createdParking) => {
              newParking = createdParking;
              this._sharedUtilsService.openSnackbar(
                'Gotowe!\nNowy punkt parkingowy został dodany.',
                'SUCCESS',
              );
              sheetRef.dismiss();
              this._mapService.removeMoveableMarker();
            }),
            switchMap(() =>
              this._matDialog
                .open(AddReviewComponent, {
                  data: { parkingPointId: newParking.id, skipVoteStep: true },
                })
                .afterClosed(),
            ),
            tap(() => this._selectedParkingId.set(newParking.id)),
            catchError(() => {
              this._sharedUtilsService.openSnackbar(
                'Wystąpił błąd podczas dodawania parkingu.',
                'ERROR',
              );
              return of(null);
            }),
          );
        } else {
          sheetRef.dismiss();
          this._mapService.removeMoveableMarker();
          return of(null);
        }
      }),
      takeUntilDestroyed(this._destroyRef),
    );
  }
}
