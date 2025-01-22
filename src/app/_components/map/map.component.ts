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
    { coords: { lng: 14.552295, lat: 53.428542 } },
    { coords: { lng: 15.2656, lat: 54.0333 } },
    { coords: { lng: 14.3167, lat: 53.43 } },
    { coords: { lng: 16.172, lat: 53.763 } },
    { coords: { lng: 15.574, lat: 53.661 } },
    { coords: { lng: 15.28, lat: 53.348 } },
    { coords: { lng: 15.935, lat: 53.092 } },
    { coords: { lng: 15.75, lat: 53.915 } },
    { coords: { lng: 14.883, lat: 53.865 } },
    { coords: { lng: 14.771, lat: 53.15 } },
    { coords: { lng: 15.551, lat: 54.175 } },
    { coords: { lng: 14.425, lat: 53.55 } },
    { coords: { lng: 15.867, lat: 53.78 } },
    { coords: { lng: 15.025, lat: 54.078 } },
    { coords: { lng: 15.9, lat: 53.6 } },
  ]);

  constructor() {
    afterNextRender(() => this._initMap());
  }

  private async _initMap() {
    await this._mapService.initialRenderMap();
    effect(
      () => {
        this.poiListCoords();
        untracked(() => this._mapService.renderPoiList(this.poiListCoords()));
      },
      {
        injector: this._injector,
      },
    );
  }
}
