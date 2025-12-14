import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GeocodeResponse, Localization, LocalizationType } from '../../_types/geocode-api.type';

@Injectable({
  providedIn: 'root',
})
export class GeocodeApiService {
  private GEOCODE_API = `${environment.geocodeApi}/?request=GetAddress&srid=4326&address=`;
  private GEOCODE_REVERSE_API = `${environment.geocodeApi}/?request=GetAddressReverse&srid=4326&location=`;

  private httpClient = inject(HttpClient);

  getAddresses(address: string): Observable<Localization[]> {
    const url = this.GEOCODE_API + address;
    let localizationType = LocalizationType.ADDRESS;

    return this.httpClient.get<GeocodeResponse>(url).pipe(
      tap((res) => {
        if (res.type === 'city') {
          localizationType = LocalizationType.CITY;
        }
      }),
      map((res): Localization[] => (res.results ? Object.values(res.results) : [])),
      map((addresses) => this._filterDuplicatedCities(addresses)),
      catchError(() => of([])),
    );
  }

  getAddressReverse(lat: string, lng: string): Observable<Localization[]> {
    const url = `${this.GEOCODE_REVERSE_API}POINT(${lng} ${lat})`;
    return this.httpClient.get<GeocodeResponse>(url).pipe(
      map((res) => (res.results ? Object.values(res.results) : [])),
      catchError(() => of([])),
    );
  }

  private _filterDuplicatedCities(results: Localization[]) {
    const uniqueSet = new Set();
    return results.filter((item) => {
      if (!uniqueSet.has(item.teryt)) {
        uniqueSet.add(item.teryt);
        return true;
      }
      return false;
    });
  }
}
