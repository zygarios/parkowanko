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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';
import { GuideDialogComponent } from '../../../../_components/guide-dialog/guide-dialog.component';
import { ParkingsApiService } from '../../../../_services/_api/parkings-api.service';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { Parking } from '../../../../_types/parking.type';
import { AddReviewComponent } from '../add-review/add-review.component';
import { MapService, PARKING_POI_RADIUS_BOUND } from '../map/_services/map.service';
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
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    MatInputModule,
    MatAutocompleteModule,
    AddressSearchBoxComponent,
    RouterLink,
  ],
  styles: `
    :host {
      --mat-form-field-outlined-outline-color: var(--par-color-primary);
      --mat-form-field-outlined-outline-width: 2px;
      --mat-form-field-outlined-container-shape: 20px;
      --mat-fab-container-elevation-shadow: none;

      ::ng-deep {
        .mat-mdc-text-field-wrapper {
          border-radius: var(--mat-form-field-outlined-container-shape) !important;
        }
        mat-form-field {
          margin-bottom: 0 !important;
        }
      }
    }
  `,
  templateUrl: './ui-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

    const sheetRef = this._sharedUtilsService.openSheet(addingPoiConfirmSheetConfig, {
      disableClose: true,
    });

    sheetRef.onClick
      .pipe(
        switchMap((menu) => {
          if (menu.result === PoiActionsEnum.CONFIRM) {
            if (this._mapService.isMarkerInsideDisabledZone()) {
              this._sharedUtilsService.openSnackbar(
                `Znacznik musi być oddalony co najmniej o ${PARKING_POI_RADIUS_BOUND} metrów od innych znaczników.`,
                'ERROR',
              );
              return EMPTY;
            } else {
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
            }
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
    this._mapService.jumpToPoi(this.selectedParking()!.location);

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
              const userAgent = navigator.userAgent;
              const isIOS =
                /iPad|iPhone|iPod/.test(userAgent) ||
                (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 0);

              if (isIOS) {
                window.location.href = `maps:?daddr=${location.lat},${location.lng}&dirflg=d`;
              } else {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
                  '_blank',
                );
              }
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
    const sheetRef = this._sharedUtilsService.openSheet(changingPoiPositionOptionsSheetConfig, {
      disableClose: true,
    });

    return sheetRef.onClick.pipe(
      switchMap((menu) => {
        if (menu.result === PoiActionsEnum.CONFIRM) {
          if (this._mapService.isMarkerInsideDisabledZone()) {
            this._sharedUtilsService.openSnackbar(
              `Znacznik musi być oddalony co najmniej o ${PARKING_POI_RADIUS_BOUND} metrów od innych znaczników.`,
              'ERROR',
            );
            return EMPTY;
          } else {
            return this.confirmUpdatedPoiPosition().pipe(
              catchError(() => {
                this._sharedUtilsService.openSnackbar(
                  'Wystąpił błąd podczas aktualizacji pozycji parkingu',
                  'ERROR',
                );
                return EMPTY;
              }),
            );
          }
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
