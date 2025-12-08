import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { EMPTY, switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment.development';
import { GuideDialogComponent } from '../../../../_components/guide-dialog/guide-dialog.component';
import { ParkingsApiService } from '../../../../_services/_api/parkings-api.service';
import { SharedUtilsService } from '../../../../_services/_core/shared-utils.service';
import { Parking } from '../../../../_types/parking.model';
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

    this._sharedUtilsService
      .openSheet(addingPoiConfirmSheetConfig, {
        disableClose: true,
      })
      .afterDismissed()
      .pipe(
        switchMap((result: string | undefined) => {
          if (result === PoiActionsEnum.CONFIRM) {
            const location = this._mapService.getMarkerLatLng();
            return this._parkingsApiService.postParking({ location });
          } else {
            this.stopAddingPoi();
            return EMPTY;
          }
        }),
      )
      .subscribe({
        next: () => {
          this._sharedUtilsService.openSnackbar(
            'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
            'SUCCESS',
          );
          this.stopAddingPoi();
        },
        error: () => {
          this.stopAddingPoi();
        },
      });
  }

  startEditingPoi() {
    if (!this.selectedParking()) return;
    this.activeMode.set(ActiveModeEnum.EDITING_POI);

    this._sharedUtilsService
      .openSheet(selectedPoiOptionsSheetConfig)
      .afterDismissed()
      .subscribe((result: string | undefined) => {
        if (result === PoiActionsEnum.CLOSE || !result) {
          this._mapService.removeMoveableMarker();
          this.setDefaultState();
        }
        if (result === PoiActionsEnum.UPDATE) {
          this.startUpdatingPoiPosition();
        }
      });
  }

  startUpdatingPoiPosition() {
    const selectedPoi: Parking | null = this.selectedParking();
    if (!selectedPoi) return;
    this.activeMode.set(ActiveModeEnum.UPDATING_POI_POSITION);
    this._mapService.renderMoveableMarker(this.selectedParking()?.location);
    this._mapService.jumpToPoi(selectedPoi?.location);
    this.handleUpdateUserChoice();
  }

  handleUpdateUserChoice() {
    const sheetRef = this._sharedUtilsService.openSheet(changingPoiPositionOptionsSheetConfig, {
      disableClose: true,
    });
    sheetRef
      .afterDismissed()
      .pipe(
        switchMap((result: string | undefined) => {
          if (result === PoiActionsEnum.CONFIRM) {
            return this.confirmUpdatedPoiPosition();
          } else {
            this.stopUpdatingPoiPosition();
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
          this._mapService.removeMoveableMarker();
          this.setDefaultState();
        },
        error: () => {
          this._mapService.removeMoveableMarker();
          this.setDefaultState();
        },
      });
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
