import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ParkingPoi } from '../../_types/parking-poi.mode';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { MapService } from '../map/map.service';
enum ActiveModeEnum {
  DEFAULT = 'DEFAULT',
  ADDING_POI = 'ADDING_POI',
  EDITING_POI = 'EDITING_POI',
  UPDATING_POI_POSITION = 'UPDATE_POI_POSITION',
}
@Component({
  selector: 'app-poi-controller',
  imports: [MatMenuModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './poi-controller.component.html',
  styleUrl: './poi-controller.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoiControllerComponent {
  private _mapService = inject(MapService);
  private _matDialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);

  activeMode: WritableSignal<ActiveModeEnum> = signal(ActiveModeEnum.DEFAULT);

  ACTIVE_MODE_ENUM = ActiveModeEnum;

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
    this._mapService.renderMarker();

    this.activeMode.set(ActiveModeEnum.ADDING_POI);
  }

  stopAddingPoi() {
    this._mapService.removeMarker();
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
    if (this.activeMode() === ActiveModeEnum.ADDING_POI) return;
    const selectedPoi = this._mapService.selectedPoi();
    if (!selectedPoi) return;
    this.activeMode.set(ActiveModeEnum.EDITING_POI);
  }

  stopEditingPoi() {
    this.activeMode.set(ActiveModeEnum.DEFAULT);
  }

  startUpdatingPoiPosition() {
    const selectedPoi: ParkingPoi | null = this._mapService.selectedPoi();
    if (!selectedPoi) return;
    this._mapService.moveToPoi(selectedPoi?.coords);
    this._mapService.renderMarker();
    this.activeMode.set(ActiveModeEnum.UPDATING_POI_POSITION);
  }

  stopUpdatingPoiPosition() {
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
    this._mapService.removeMarker();
    this.activeMode.set(ActiveModeEnum.DEFAULT);
  }

  startRemovingPoi() {
    this._matDialog
      .open(InfoDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // TODO spiac z backendem
          this._snackBar.open(
            'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
            undefined,
            { verticalPosition: 'top' },
          );
          this.activeMode.set(ActiveModeEnum.DEFAULT);
        }
      });
  }
}
