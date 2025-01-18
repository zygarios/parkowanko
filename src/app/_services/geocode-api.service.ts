import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {
  GeocodeAddress,
  GeocodeCity,
  GeocodeResponse,
  GeocodeStreet,
} from '../_types/geocode-api.model';

@Injectable({
  providedIn: 'root',
})
export class GeocodeApiService {
  private readonly _GEOCODE_API = `${environment.geocodeApi}/?request=GetAddress&srid=4326&address=`;
  private _GEOCODE_REVERSE_API = `${environment.geocodeApi}/?request=GetAddressReverse&srid=4326&location=`;

  private _httpClient = inject(HttpClient);

  getCities(city: string): Observable<GeocodeCity[]> {
    const url = this._GEOCODE_API + city.trim();
    return this._httpClient.get<GeocodeResponse<GeocodeCity>>(url).pipe(
      map((res): GeocodeCity[] => {
        const results = res.results ? Object.values(res.results) : [];
        return this._filterDuplicatedCities(results);
      }),
      catchError(() => of([])),
    );
  }

  private _filterDuplicatedCities(results: GeocodeCity[]) {
    const uniqueSet = new Set();
    return results.filter((item) => {
      if (!uniqueSet.has(item.teryt)) {
        uniqueSet.add(item.teryt);
        return true;
      }
      return false;
    });
  }

  getStreets(city: string, street: string): Observable<GeocodeStreet[]> {
    const address = `${city.trim()}, ${street}`;
    const url = this._GEOCODE_API + address;
    return this._httpClient.get<GeocodeResponse<GeocodeStreet>>(url).pipe(
      map((res): GeocodeStreet[] =>
        res.results ? Object.values(res.results) : [],
      ),
      catchError(() => of([])),
    );
  }

  getAddresses(
    city: string,
    street: string,
    buildingNumber: string,
  ): Observable<GeocodeAddress[]> {
    const address = `${city.trim()}, ${street} ${buildingNumber}`;
    const url = this._GEOCODE_API + address;
    return this._httpClient.get<GeocodeResponse<GeocodeAddress>>(url).pipe(
      map((res): GeocodeAddress[] =>
        res.results ? Object.values(res.results) : [],
      ),
      catchError(() => of([])),
    );
  }

  getAddressReverse(lat: string, lng: string): Observable<GeocodeAddress[]> {
    const url = `${this._GEOCODE_REVERSE_API}POINT(${lng} ${lat})`;
    return this._httpClient.get<GeocodeResponse<GeocodeAddress>>(url).pipe(
      map((res) => (res.results ? Object.values(res.results) : [])),
      catchError(() => of([])),
    );
  }
}
