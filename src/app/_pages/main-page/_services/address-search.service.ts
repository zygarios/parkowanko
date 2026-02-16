import { effect, inject, Injectable, signal, Signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounce, distinctUntilChanged, of, switchMap, timer } from 'rxjs';
import { GeocodeApiService } from '../../../_services/_api/geocode-api.service';
import { GeocodeFeature } from '../../../_types/geocode-api.type';
import { MapService } from './map/map.service';

const RECENT_ADDRESSES_KEY = 'par_recent_addresses';

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
          if (!searchTerm) {
            return of(this.getHistoryFromStorage());
          }
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
      const selected = this.selectedAddress();

      untracked(() => {
        if (selected) {
          this.saveAddressToHistory(selected);
          this._mapService.renderTargetLocationPoi(selected.coords);
          this.flyToSelectedAddress();
        } else {
          this._mapService.removeTargetLocationPoi();
          this._mapService.removeLineBetweenPoints();
        }
      });
    });
  }

  saveAddressToHistory(address: GeocodeFeature) {
    const history = this.getHistoryFromStorage();
    const addressName = address.details.name;

    const updatedHistory = [
      address,
      ...history.filter((item) => item.details.name !== addressName),
    ].slice(0, 5);

    localStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(updatedHistory));
  }

  getHistoryFromStorage(): GeocodeFeature[] {
    const history = localStorage.getItem(RECENT_ADDRESSES_KEY);
    return history ? JSON.parse(history) : [];
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
