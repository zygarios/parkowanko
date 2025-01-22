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
import { ParkingPoi } from '../../_types/parking-poi.mode';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
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

  activeMode: WritableSignal<ActiveModeEnum> = signal(ActiveModeEnum.DEFAULT);

  ACTIVE_MODE_ENUM = ActiveModeEnum;

  selectedPoi = signal<null | ParkingPoi>(null);

  constructor() {
    effect(() => {
      this._mapService.selectedPoi();
      untracked(() => this.startEditingPoi());
    });
  }

  openHelpDialog() {
    this._matDialog.open(HelpDialogComponent);
  }

  startAddingPoi() {
    this._mapService.renderMoveableMarker();
    this._mapService.setSelectingMode('disabled');
    this.activeMode.set(ActiveModeEnum.ADDING_POI);
  }

  stopAddingPoi() {
    this._mapService.removeMoveableMarker();
    this._mapService.setSelectingMode('enabled');
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
    this._mapService.setSelectingMode('disabled');
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
      .subscribe((result: string) => {
        if (result === 'CANCEL') {
          this._mapService.setSelectingMode('enabled');
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        }
        if (result === 'UPDATE') this.startUpdatingPoiPosition();
        if (result === 'REMOVE') this.removePoi();
      });
  }

  startUpdatingPoiPosition() {
    const selectedPoi: ParkingPoi | null = this._mapService.selectedPoi();
    if (!selectedPoi) return;
    this._mapService.renderMoveableMarker();
    this._mapService.jumpToPoi(selectedPoi?.coords);
    this.activeMode.set(ActiveModeEnum.UPDATING_POI_POSITION);
  }

  stopUpdatingPoiPosition() {
    this._mapService.removeMoveableMarker();
    this.activeMode.set(ActiveModeEnum.DEFAULT);
    this.startEditingPoi();
  }

  confirmUpdatedPoiPosition() {
    const coords = this._mapService.getMarkerLatLng();
    console.log(coords);
    // TODO spiąć z backendem
    this._snackBar.open(
      'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
      undefined,
      { verticalPosition: 'top' },
    );
    this._mapService.removeMoveableMarker();
    this._mapService.setSelectingMode('enabled');
    this.activeMode.set(ActiveModeEnum.DEFAULT);
  }

  removePoi() {
    const selectedPoi: ParkingPoi | null = this._mapService.selectedPoi();
    if (!selectedPoi) return;
    this._mapService.jumpToPoi(selectedPoi.coords);
    this._mapService.getMap().panBy([0, 200]);

    this._mapService.renderMarkerForFocusPoi(selectedPoi.coords);
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
            'Gotowe!\nUsunięto nieprawidłowy znacznik bezpłatnego parkingu',
            undefined,
            { verticalPosition: 'top' },
          );
          this._mapService.removeMarkerForFocusPoi();
          this._mapService.setSelectingMode('enabled');
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        } else {
          this._mapService.removeMarkerForFocusPoi();
          this._mapService.setSelectingMode('enabled');
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        }
      });
  }
}
