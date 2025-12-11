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
import { MapService } from './_services/map.service';

@Component({
  styles: `
    @import 'maplibre-gl/dist/maplibre-gl.css';
    #map {
      height: 100vh;
      width: 100%;
      display: flex;
      .maplibregl-ctrl-attrib {
        display: none;
      }
      .maplibregl-ctrl-group {
        border-radius: var(--mat-sys-corner-medium);
        button {
          width: 40px;
          height: 40px;
        }
      }
    }

    .marker {
      background-image: url('/icons/parking-marker.svg');
      background-size: cover;
      width: 60px;
      aspect-ratio: 1/1.2;
      translate: 0px -50%;
      position: relative;
      animation: fadeIn 0.2s;
    }

    .marker.disabled {
      opacity: 0.5 !important;
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

  parkingsList = this._parkingsApiService.getParkings();

  constructor() {
    afterNextRender(() => {
      this._mapService.initRenderMap().catch((error) => {
        console.error('Failed to initialize map in component:', error);
      });
    });

    afterRenderEffect(() => {
      if (this._mapService.getIsMapLoaded()) {
        const parkings = this.parkingsList();
        untracked(() => this._mapService.renderParkingsPois(parkings));
      }
    });

    this._destroyRef.onDestroy(() => {
      this._mapService.cleanUp();
    });
  }
}
