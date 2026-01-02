import { effect, inject, Injectable, signal, Signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounce, distinctUntilChanged, of, switchMap, timer } from 'rxjs';
import { GeocodeApiService } from '../../../_services/_api/geocode-api.service';
import { GeocodeFeature } from '../../../_types/geocode-api.type';
import { MapService } from './map/map.service';

@Injectable()
export class AddressSearchService {
  private _geocodeApiService = inject(GeocodeApiService);
  private _mapService = inject(MapService);

  selectedAddress = signal<GeocodeFeature | null>(null);

  getAddressesBySearchTerm(searchTerm: Signal<string>) {
    return toSignal<GeocodeFeature[]>(
      toObservable(searchTerm).pipe(
        distinctUntilChanged(),
        debounce((searchTerm) => timer(searchTerm ? 300 : 0)),
        switchMap((searchTerm) => {
          if (!searchTerm) return of([]);
          return this._geocodeApiService.getAddresses(searchTerm);
        }),
      ),
    );
  }

  constructor() {
    this.listenForAddressChange();
  }

  listenForAddressChange() {
    effect(() => {
      if (!this._mapService.isMapLoaded()) return;
      this.selectedAddress();

      untracked(() => {
        if (this.selectedAddress()) {
          this._mapService.renderTargetLocationPoi(this.selectedAddress()!.coords);
          this.flyToSelectedAddress();
        } else {
          this._mapService.removeTargetLocationPoi();
          this._mapService.removeLineBetweenPoints();
        }
      });
    });
  }

  flyToSelectedAddress() {
    this._mapService.flyToPoi(
      {
        lng: Number(this.selectedAddress()!.coords.lng),
        lat: Number(this.selectedAddress()!.coords.lat),
      },
      this.selectedAddress()?.details.ul_nazwa_glowna ? 'CLOSE_ZOOM' : 'FAR_ZOOM',
    );
  }
}
