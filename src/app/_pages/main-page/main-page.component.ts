import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapComponent } from './_components/map/map.component';
import { UiOverlayComponent } from './_components/ui-overlay/ui-overlay.component';

@Component({
  selector: 'app-main-page',
  imports: [MapComponent, UiOverlayComponent],
  templateUrl: './main-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {}
