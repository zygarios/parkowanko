import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SharedUtilsService } from '../../_services/_core/shared-utils.service';
import { MapService } from './_components/map/_services/map.service';
import { MapComponent } from './_components/map/map.component';
import { UiOverlayComponent } from './_components/ui-overlay/ui-overlay.component';

@Component({
  selector: 'app-main-page',
  imports: [MapComponent, UiOverlayComponent],
  templateUrl: './main-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private _sharedUtilsService = inject(SharedUtilsService);
  private _mapService = inject(MapService);
  private _dialog = inject(MatDialog);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this._sharedUtilsService.cleanUp();
      this._mapService.cleanUp();
    });
  }
}
