import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  untracked,
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

  poiListCoords = input<ParkingPoi[]>([
    { coords: { lng: 18.537065928683887, lat: 54.499918975205986 } },
  ]);

  constructor() {
    afterNextRender(() => this._initMap());
  }

  private async _initMap() {
    (await this._mapService.initialRenderMap()).on('load', () => {
      effect(
        () => {
          this.poiListCoords();
          untracked(() => this._mapService.renderPoiList(this.poiListCoords()));
        },
        {
          injector: this._injector,
        },
      );
    });
  }
}
