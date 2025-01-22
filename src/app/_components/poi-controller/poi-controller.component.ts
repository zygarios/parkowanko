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
import { Parking } from '../../_types/parking.mode';
import { GuideDialogComponent } from '../guide-dialog/guide-dialog.component';
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
})
export class PoiControllerComponent {
  private _mapService = inject(MapService);
  private _matDialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  private _sheet = inject(MatBottomSheet);

  ACTIVE_MODE_ENUM = ActiveModeEnum;
  activeMode: WritableSignal<ActiveModeEnum> = signal(ActiveModeEnum.DEFAULT);
  isMapLoaded = this._mapService.isMapLoaded;

  constructor() {
    effect(() => this._listenForSelectedPoiToStartEdit());
    effect(() => this._listenForActiveModeToSetMapState());
  }

  private _listenForSelectedPoiToStartEdit() {
    this._mapService.selectedPoi();
    untracked(() => this.startEditingPoi());
  }
  private _listenForActiveModeToSetMapState() {
    this.activeMode();
    untracked(() => {
      if (this.activeMode() === ActiveModeEnum.DEFAULT) {
        this._mapService.selectedPoi.set(null);
        this._mapService.setSelectingMode('enabled');
      } else {
        this._mapService.setSelectingMode('disabled');
      }
    });
  }

  openHelpDialog() {
    this._matDialog.open(GuideDialogComponent);
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
    const coords = this._mapService.getMarkerLatLng();
    console.log(coords);
    // TODO spiąć z backendem
    this._snackBar.open(
      'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
      undefined,
      { verticalPosition: 'top' },
    );
    this.stopAddingPoi();
  }

  startEditingPoi() {
    if (!this._mapService.selectedPoi()) return;
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
    const selectedPoi: Parking | null = this._mapService.selectedPoi();
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
    const coords = this._mapService.getMarkerLatLng();
    console.log(coords);
    // TODO spiąć z backendem
    this._snackBar.open(
      'Gotowe!\nPozycja bezpłatnego parkingu została poprawiona',
      undefined,
      { verticalPosition: 'top' },
    );
    this._mapService.removeMoveableMarker();
    this.activeMode.set(ActiveModeEnum.DEFAULT);
  }

  removePoi() {
    const selectedPoi: Parking | null = this._mapService.selectedPoi();
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
      .subscribe((result) => {
        if (result) {
          // TODO spiac z backendem
          this._snackBar.open(
            'Gotowe!\nUsunięto znacznik bezpłatnego parkingu',
            undefined,
            { verticalPosition: 'top' },
          );
          this._mapService.removeMarkerForFocusPoi();
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        } else {
          this._mapService.removeMarkerForFocusPoi();
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        }
      });
  }
}
