import { inject, Injectable, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounce, distinctUntilChanged, interval, of, switchMap } from 'rxjs';
import { GeocodeApiService } from '../../../../../../_services/geocode-api.service';
import { GeocodeAddress } from '../../../../../../_types/geocode-api.model';

@Injectable({
  providedIn: 'root',
})
export class AddressSearchBoxService {
  private geocodeApiService = inject(GeocodeApiService);

  getAddressesBySearchTerm(searchTerm: Signal<string>) {
    return toSignal<GeocodeAddress[]>(
      toObservable(searchTerm).pipe(
        distinctUntilChanged(),
        debounce((searchTerm) =>
          !searchTerm || !searchTerm.includes(',') ? interval() : interval(300),
        ),
        switchMap((searchTerm) => {
          if (!searchTerm || !searchTerm.includes(',')) return of([]);
          return of(searchTerm).pipe(
            switchMap((searchTerm) => this.geocodeApiService.getAddresses(searchTerm)),
          );
        }),
      ),
    );
  }
}
