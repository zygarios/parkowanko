import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, switchMap, tap } from 'rxjs';
import { enterFadeAnimation } from '../../_others/animations/enter-fade-animation';
import { ParkingsService } from '../../_services/parkings-api.service';
import { Parking } from '../../_types/parking.mode';
import {
  InfoDialogComponent,
  InfoDialogData,
} from '../info-dialog/info-dialog.component';
import { MapService } from '../map/map.service';
import {
  MenuSheetComponent,
  MenuSheetData,
} from '../menu-sheet/menu-sheet.component';

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
  ],
  templateUrl: './poi-controller.component.html',
  styleUrl: './poi-controller.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [enterFadeAnimation],
})
export class PoiControllerComponent {
  private _mapService = inject(MapService);
  private _matDialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  private _sheet = inject(MatBottomSheet);
  private _parkingsService = inject(ParkingsService);

  ACTIVE_MODE_ENUM = ActiveModeEnum;
  activeMode: WritableSignal<ActiveModeEnum> = signal(ActiveModeEnum.DEFAULT);
  isMapLoaded = this._mapService.isMapLoaded;

  constructor() {
    effect(() => this._listenForSelectedPoiToStartEdit());
    effect(() => this._listenForActiveModeToSetMapState());
  }

  private _listenForSelectedPoiToStartEdit() {
    this._mapService.selectedParking();
    untracked(() => this.startEditingPoi());
  }
  private _listenForActiveModeToSetMapState() {
    this.activeMode();
    untracked(() => {
      if (this.activeMode() === ActiveModeEnum.DEFAULT) {
        this._mapService.selectedParking.set(null);
        this._mapService.setSelectingMode('enabled');
      } else {
        this._mapService.setSelectingMode('disabled');
      }
    });
  }

  startAddingPoi() {
    this.activeMode.set(ActiveModeEnum.ADDING_POI);
    this._mapService.renderMoveableMarker();
  }

  stopAddingPoi() {
    this._mapService.removeMoveableMarker();
    this.activeMode.set(ActiveModeEnum.DEFAULT);
  }

  confirmAddedPoi() {
    const location = this._mapService.getMarkerLatLng();
    this._parkingsService.postParking({ location }).subscribe({
      next: () => {
        this._snackBar.open(
          'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
          undefined,
          { verticalPosition: 'top' },
        );
      },
      complete: () => {
        this.stopAddingPoi();
      },
    });
  }

  startEditingPoi() {
    if (!this._mapService.selectedParking()) return;
    this.activeMode.set(ActiveModeEnum.EDITING_POI);
    this._sheet
      .open<MenuSheetComponent, MenuSheetData>(MenuSheetComponent, {
        data: {
          menuItems: [
            {
              label: 'Popraw pozycję na mapie',
              icon: 'edit_location_alt',
              result: 'UPDATE',
            },
            {
              label: 'Usuń znacznik',
              icon: 'wrong_location',
              result: 'REMOVE',
            },
            {
              label: 'Anuluj',
              icon: 'close',
              result: 'CANCEL',
            },
          ],
        },
      })
      .afterDismissed()
      .subscribe((result: string | undefined) => {
        if (result === 'CANCEL' || !result) {
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        }
        if (result === 'UPDATE') this.startUpdatingPoiPosition();
        if (result === 'REMOVE') this.removePoi();
      });
  }

  startUpdatingPoiPosition() {
    const selectedPoi: Parking | null = this._mapService.selectedParking();
    if (!selectedPoi) return;
    this.activeMode.set(ActiveModeEnum.UPDATING_POI_POSITION);
    this._mapService.renderMoveableMarker();
    this._mapService.jumpToPoi(selectedPoi?.location);
  }

  stopUpdatingPoiPosition() {
    this._mapService.removeMoveableMarker();
    this.startEditingPoi();
  }

  confirmUpdatedPoiPosition() {
    const selectedPoi: Parking | null = this._mapService.selectedParking();
    if (!selectedPoi) return;
    const location = this._mapService.getMarkerLatLng();
    this._parkingsService.patchParking(selectedPoi.id, { location }).subscribe({
      next: () => {
        this._snackBar.open(
          'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona',
          undefined,
          { verticalPosition: 'top' },
        );
      },
      complete: () => {
        this._mapService.removeMoveableMarker();
        this.activeMode.set(ActiveModeEnum.DEFAULT);
      },
    });
  }

  removePoi() {
    const selectedPoi: Parking | null = this._mapService.selectedParking();
    if (!selectedPoi) return;
    this._mapService.jumpToPoi(selectedPoi.location);
    this._mapService.getMap().panBy([0, 200]);

    this._mapService.renderMarkerForFocusPoi(selectedPoi.location);
    this._matDialog
      .open<InfoDialogComponent, InfoDialogData>(InfoDialogComponent, {
        data: {
          title: 'Usuwanie punktu',
          content: 'Czy na pewno chcesz usunąć obszar płatnego parkingu?',
        },
      })
      .afterClosed()
      .pipe(
        switchMap((result: boolean) => {
          if (result) {
            return this._parkingsService.deleteParking(selectedPoi.id).pipe(
              tap(() => {
                this._snackBar.open(
                  'Gotowe!\nUsunięto znacznik bezpłatnego parkingu',
                  undefined,
                  { verticalPosition: 'top' },
                );
              }),
            );
          } else {
            return of(null);
          }
        }),
      )
      .subscribe({
        next: () => {
          this._mapService.removeMarkerForFocusPoi();
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        },
      });
  }
}
