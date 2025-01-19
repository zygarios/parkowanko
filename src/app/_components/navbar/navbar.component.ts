import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ParkingPoi } from '../../_types/parking-poi.mode';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { MapService } from '../map/map.service';

@Component({
  selector: 'app-navbar',
  imports: [MatMenuModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private _mapService = inject(MapService);
  private _matDialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);

  activeMode: WritableSignal<
    | 'default'
    | 'adding-poi'
    | 'editing-poi'
    | 'editing-poi__update'
    | 'editing-poi__remove'
  > = signal('default');

  constructor() {
    this._mapService.selectedPoi
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.startEditingPoi());
  }

  openHelpDialog() {
    this._matDialog.open(HelpDialogComponent);
  }

  startAddingPoi() {
    this._mapService.renderMarker();
    this.activeMode.set('adding-poi');
  }

  stopAddingPoi() {
    this._mapService.removeMarker();
    this.activeMode.set('default');
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
    if (this.activeMode() === 'adding-poi') return;
    const selectedPoi = this._mapService.selectedPoi.value;
    if (!selectedPoi) return;
    this.activeMode.set('editing-poi');
  }

  stopEditingPoi() {
    this.activeMode.set('default');
  }

  startUpdatingPoiPosition() {
    const selectedPoi: ParkingPoi | null = this._mapService.selectedPoi.value;
    if (!selectedPoi) return;
    this._mapService.moveToPoi(selectedPoi?.coords);
    this._mapService.renderMarker();
    this.activeMode.set('editing-poi__update');
  }

  confirmUpdatedPoi() {
    const coords = this._mapService.getMarkerLatLng();
    console.log(coords);
    // TODO spiąć z backendem
    this._snackBar.open(
      'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
      undefined,
      { verticalPosition: 'top' },
    );
    this._mapService.removeMarker();
    this.activeMode.set('default');
  }

  startRemovingPoi() {
    this.activeMode.set('editing-poi__remove');
  }

  confirmRemovedPoi() {
    this.activeMode.set('default');
    // TODO dodac dialog i spiąć z backendem
    this._snackBar.open(
      'Gotowe!\nOznaczenie bezpłatnego parkingu zostało dodane',
      undefined,
      { verticalPosition: 'top' },
    );
    this.activeMode.set('default');
  }
}
