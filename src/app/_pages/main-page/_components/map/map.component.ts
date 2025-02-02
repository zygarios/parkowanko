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
import { Parking } from '../../../../_types/parking.mode';
import { MapService } from './_services/map.service';

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

  parkingsList = input<Parking[]>([]);

  constructor() {
    afterNextRender(() => this._mapService.initRenderMap());
    afterRenderEffect(() => {
      if (this._mapService.isMapLoaded()) {
        this.parkingsList();
        untracked(() =>
          this._mapService.renderParkingsPois(this.parkingsList()),
        );
      }
    });
  }
}
