import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { MapService } from '../map/map.service';

@Component({
  selector: 'app-navbar',
  imports: [MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private _mapService = inject(MapService);
  private _matDialog = inject(MatDialog);

  addNewParking() {
    this._mapService.renderDraggableMarker();
  }

  openHelpDialog() {
    this._matDialog.open(HelpDialogComponent);
  }
}
