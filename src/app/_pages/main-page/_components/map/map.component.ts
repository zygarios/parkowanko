import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { ParkingsApiService } from '../../../../_services/_api/parkings-api.service';
import { MapPoisControllerService } from '../../_services/map-pois-controller.service';
import { MapService } from '../../_services/map/map.service';

@Component({
  styles: `
    @import 'maplibre-gl/dist/maplibre-gl.css';
    #map {
      height: 100dvh;
      width: 100%;
      display: flex;
      .maplibregl-ctrl-attrib {
        display: none;
      }
      .maplibregl-ctrl-group {
        border-radius: var(--mat-sys-corner-medium);
        position: fixed;
        bottom: 80px;
        right: 5px;
        button {
          width: 40px;
          height: 40px;
        }
      }
    }

    .marker {
      background-size: cover;
      width: 60px;
      aspect-ratio: 1/1.2;
      translate: 0px -50%;
      position: relative;
      animation: fadeIn 0.2s;
    }

    .marker.disabled {
      opacity: 0.4 !important;
    }
  `,
  selector: 'app-map',
  host: {
    id: 'map',
  },
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent {
  private _mapService = inject(MapService);
  private _parkingsApiService = inject(ParkingsApiService);
  private _destroyRef = inject(DestroyRef);
  private _mapPoisControllerService = inject(MapPoisControllerService);

  parkingsList = this._parkingsApiService.getParkings();

  constructor() {
    afterNextRender(() => this._mapService.initRenderMap());
    afterRenderEffect(() => this.setParkingsPois());
    afterRenderEffect(() => this._mapPoisControllerService.listenForSelectedPoiToStartEdit());

    this._destroyRef.onDestroy(() => this._mapService.cleanUp());
  }

  setParkingsPois() {
    if (this._mapService.isMapLoaded()) {
      const parkings = this.parkingsList();

      untracked(() => this._mapService.renderParkingsPois(parkings));
    }
  }
}
