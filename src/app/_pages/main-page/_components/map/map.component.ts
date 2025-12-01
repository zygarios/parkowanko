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
import { Parking } from '../../../../_types/parking.model';
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
      animation: fadeIn 0.3s;
    }
  `,
  selector: 'app-map',
  imports: [],
  host: {
    id: 'map',
  },
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent {
  private mapService = inject(MapService);

  parkingsList = input<Parking[]>([]);

  constructor() {
    afterNextRender(() => this.mapService.initRenderMap());
    afterRenderEffect(() => {
      if (this.mapService.getIsMapLoaded()) {
        this.parkingsList();
        untracked(() => this.mapService.renderParkingsPois(this.parkingsList()));
      }
    });
  }
}
