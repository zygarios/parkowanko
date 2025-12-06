import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink } from '@angular/router';
import { ParkingsApiService } from '../../_services/_api/parkings-api.service';
import { MapComponent } from './_components/map/map.component';
import { UiOverlayComponent } from './_components/ui-overlay/ui-overlay.component';

@Component({
  selector: 'app-main-page',
  imports: [
    MapComponent,
    UiOverlayComponent,
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
  private parkingsApiService = inject(ParkingsApiService);

  parkingsList = this.parkingsApiService.getParkings();
}
