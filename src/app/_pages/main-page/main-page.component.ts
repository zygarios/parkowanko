import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { SharedUtilsService } from '../../_services/_core/shared-utils.service';
import { MapUiOverlayComponent } from './_components/map-ui-overlay/map-ui-overlay.component';
import { MapComponent } from './_components/map/map.component';

@Component({
  selector: 'app-main-page',
  imports: [MapComponent, MapUiOverlayComponent],
  templateUrl: './main-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {
  private _sharedUtilsService = inject(SharedUtilsService);

  constructor() {
    inject(DestroyRef).onDestroy(() => this._sharedUtilsService.cleanUp());
  }
}
