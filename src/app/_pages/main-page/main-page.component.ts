import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { environment } from '../../../environments/environment.development';
import { GuideDialogComponent } from '../../_components/guide-dialog/guide-dialog.component';
import { ParkingsService } from '../../_services/parkings-api.service';
import { MapComponent } from './_components/map/map.component';
import { PoiControllerComponent } from './_components/poi-controller/poi-controller.component';

@Component({
  selector: 'app-main-page',
  imports: [
    MapComponent,
    PoiControllerComponent,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private _matDialog = inject(MatDialog);
  private _parkingsService = inject(ParkingsService);
  readonly ENVIRONMENT_TYPE = environment.environmentType;

  parkingsList = this._parkingsService.parkingsList;

  openHelpDialog() {
    this._matDialog.open(GuideDialogComponent);
  }
}
