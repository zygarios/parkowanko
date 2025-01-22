import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { Parking } from '../../_types/parking.mode';
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
  private _mapService = inject(MapService);

  poiListCoords = input<Parking[]>([
    { location: { lng: 18.537065928683887, lat: 54.499918975205986 } },
    { location: { lng: 14.552295, lat: 53.428542 } },
    { location: { lng: 15.2656, lat: 54.0333 } },
    { location: { lng: 14.3167, lat: 53.43 } },
    { location: { lng: 16.172, lat: 53.763 } },
    { location: { lng: 15.574, lat: 53.661 } },
    { location: { lng: 15.28, lat: 53.348 } },
    { location: { lng: 15.935, lat: 53.092 } },
    { location: { lng: 15.75, lat: 53.915 } },
    { location: { lng: 14.883, lat: 53.865 } },
    { location: { lng: 14.771, lat: 53.15 } },
    { location: { lng: 15.551, lat: 54.175 } },
    { location: { lng: 14.425, lat: 53.55 } },
    { location: { lng: 15.867, lat: 53.78 } },
    { location: { lng: 15.025, lat: 54.078 } },
    { location: { lng: 15.9, lat: 53.6 } },
  ]);

  constructor() {
    afterNextRender(() => this._mapService.initialRenderMap());
    afterRenderEffect(() => {
      if (this._mapService.isMapLoaded()) {
        this.poiListCoords();
        untracked(() => this._mapService.renderPoiList(this.poiListCoords()));
      }
    });
  }
}
