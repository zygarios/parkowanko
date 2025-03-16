import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { GuideDialogComponent } from '../../_components/guide-dialog/guide-dialog.component';
import { ParkingsService } from '../../_services/parkings-api.service';
import { EnvironmentType } from '../../_types/environment-type.model';
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
    RouterLink,
  ],
  templateUrl: './main-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private _matDialog = inject(MatDialog);
  private _parkingsService = inject(ParkingsService);
  readonly environmentType: EnvironmentType = environment.environmentType;

  parkingsList = this._parkingsService.parkingsList;

  openHelpDialog() {
    this._matDialog.open(GuideDialogComponent);
  }
}
