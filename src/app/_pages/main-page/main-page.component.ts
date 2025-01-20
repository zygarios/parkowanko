import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapComponent } from '../../_components/map/map.component';
import { PoiControllerComponent } from '../../_components/poi-controller/poi-controller.component';

@Component({
  selector: 'app-main-page',
  imports: [MapComponent, PoiControllerComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {}
