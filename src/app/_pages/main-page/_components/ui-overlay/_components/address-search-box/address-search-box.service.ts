import { inject, Injectable, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounce, distinctUntilChanged, interval, of, switchMap } from 'rxjs';
import { GeocodeApiService } from '../../../../../../_services/_api/geocode-api.service';
import { GeocodeFeature } from '../../../../../../_types/geocode-api.type';

@Injectable({
  providedIn: 'root',
})
export class AddressSearchBoxService {
  private geocodeApiService = inject(GeocodeApiService);

  getAddressesBySearchTerm(searchTerm: Signal<string>) {
    return toSignal<GeocodeFeature[]>(
      toObservable(searchTerm).pipe(
        distinctUntilChanged(),
        debounce((searchTerm) => (!searchTerm ? interval() : interval(300))),
        switchMap((searchTerm) => {
          if (!searchTerm) return of([]);
          return of(searchTerm).pipe(
            switchMap((searchTerm) => this.geocodeApiService.getAddresses(searchTerm)),
          );
        }),
      ),
    );
  }
}
