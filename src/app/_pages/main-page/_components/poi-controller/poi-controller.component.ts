import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { EMPTY, of, switchMap } from 'rxjs';
import { ParkingsService } from '../../../../_services/parkings-api.service';
import { SharedUtilsService } from '../../../../_services/shared-utils.service';
import { Parking } from '../../../../_types/parking.model';
import { MapService } from '../map/_services/map.service';
import { AddressSearchBoxComponent } from './_components/address-search-box/address-search-box.component';
import {
  addingPoiConfirmSheetConfig,
  changingPoiPositionOptionsSheetConfig,
  selectedPoiOptionsSheetConfig,
} from './_data/poi-controller-sheet-configs.data';

enum ActiveModeEnum {
  DEFAULT = 'DEFAULT',
  ADDING_POI = 'ADDING_POI',
  EDITING_POI = 'EDITING_POI',
  UPDATING_POI_POSITION = 'UPDATE_POI_POSITION',
}
@Component({
  selector: 'app-poi-controller',
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    MatInputModule,
    MatAutocompleteModule,
    AddressSearchBoxComponent,
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
  templateUrl: './poi-controller.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoiControllerComponent {
  private readonly mapService = inject(MapService);
  private readonly parkingsService = inject(ParkingsService);
  private readonly sharedUtilsService = inject(SharedUtilsService);

  ACTIVE_MODE_ENUM = ActiveModeEnum;
  activeMode: WritableSignal<ActiveModeEnum> = signal(ActiveModeEnum.DEFAULT);
  isMapLoaded = this.mapService.getIsMapLoaded;

  readonly selectedParking = linkedSignal<Parking | null, Parking | null>({
    source: () => this.mapService.selectedParking(),
    computation: (value, previousValue) => {
      if (this.activeMode() === ActiveModeEnum.DEFAULT) {
        return value;
      } else {
        return previousValue?.value || null;
      }
    },
  });

  constructor() {
    effect(() => this.listenForSelectedPoiToStartEdit());
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
    this.mapService.removeMoveableMarker();
    this.setDefaultState();
  }

  startAddingPoi() {
    this.activeMode.set(ActiveModeEnum.ADDING_POI);
    this.mapService.renderMoveableMarker();

    this.sharedUtilsService
      .openSheet(addingPoiConfirmSheetConfig, {
        disableClose: true,
      })
      .afterDismissed()
      .pipe(
        switchMap((result: string | undefined) => {
          if (result === 'CONFIRM') {
            const location = this.mapService.getMarkerLatLng();
            return this.parkingsService.postParking({ location });
          } else {
            this.stopAddingPoi();
            return of(EMPTY);
          }
        }),
      )
      .subscribe({
        next: () => {
          this.sharedUtilsService.openSnackbar(
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

    this.sharedUtilsService
      .openSheet(selectedPoiOptionsSheetConfig)
      .afterDismissed()
      .subscribe((result: string | undefined) => {
        if (result === 'CLOSE' || !result) {
          this.mapService.removeMoveableMarker();
          this.setDefaultState();
        }
        if (result === 'UPDATE') {
          this.startUpdatingPoiPosition();
          this.handleUpdateUserChoice();
        }
      });
  }

  startUpdatingPoiPosition() {
    const selectedPoi: Parking | null = this.selectedParking();
    if (!selectedPoi) return;
    this.activeMode.set(ActiveModeEnum.UPDATING_POI_POSITION);
    this.mapService.renderMoveableMarker(this.selectedParking()?.location);
    this.mapService.jumpToPoi(selectedPoi?.location);
  }

  handleUpdateUserChoice() {
    const sheetRef = this.sharedUtilsService.openSheet(changingPoiPositionOptionsSheetConfig, {
      disableClose: true,
    });

    sheetRef.afterDismissed().subscribe((result: string | undefined) => {
      if (result === 'CANCEL' || !result) this.stopUpdatingPoiPosition();
      else if (result === 'CONFIRM') this.confirmUpdatedPoiPosition();
    });
  }

  stopUpdatingPoiPosition() {
    this.mapService.removeMoveableMarker();
    this.startEditingPoi();
  }

  confirmUpdatedPoiPosition() {
    const selectedPoi: Parking | null = this.selectedParking();
    if (!selectedPoi) return;
    const location = this.mapService.getMarkerLatLng();
    this.parkingsService.patchParking(selectedPoi.id, { location }).subscribe({
      next: () => {
        this.sharedUtilsService.openSnackbar(
          'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona',
          'SUCCESS',
        );
        this.mapService.removeMoveableMarker();
        this.setDefaultState();
      },
      error: () => {
        this.mapService.removeMoveableMarker();
        this.setDefaultState();
      },
    });
  }
}
