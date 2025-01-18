import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { ParkingPoi } from '../../_types/parking-poi.mode';
import { MapService } from './map.service';

@Component({
  selector: 'app-map',
  imports: [],
  host: {
    id: 'map',
  },
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent {
  private _injector = inject(Injector);
  private _mapService = inject(MapService);

  poiListCoords = input<ParkingPoi[]>([]);

  constructor() {
    afterNextRender(() => this._initMap());
  }

  private async _initMap() {
    (await this._mapService.initialRenderMap()).on('load', () => {
      effect(() => this._mapService.renderPoiList(this.poiListCoords()), {
        injector: this._injector,
      });

      this._mapService.listenForPoiClick((poiData: ParkingPoi) => {
        console.log(poiData);
      });
    });
  }
}
