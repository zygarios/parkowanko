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
  private readonly GEOCODE_API = `${environment.geocodeApi}/?request=GetAddress&srid=4326&address=`;
  private readonly GEOCODE_REVERSE_API = `${environment.geocodeApi}/?request=GetAddressReverse&srid=4326&location=`;

  private readonly httpClient = inject(HttpClient);

  getCities(city: string): Observable<GeocodeCity[]> {
    return this.httpClient.get<GeocodeResponse<GeocodeCity>>(this.GEOCODE_API + city.trim()).pipe(
      map((res) => {
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
    const url = this.GEOCODE_API + address;
    return this.httpClient.get<GeocodeResponse<GeocodeStreet>>(url).pipe(
      map((res): GeocodeStreet[] => (res.results ? Object.values(res.results) : [])),
      catchError(() => of([])),
    );
  }

  getAddresses(city: string, street: string, buildingNumber: string): Observable<GeocodeAddress[]> {
    const address = `${city.trim()}, ${street} ${buildingNumber}`;
    const url = this.GEOCODE_API + address;
    return this.httpClient.get<GeocodeResponse<GeocodeAddress>>(url).pipe(
      map((res): GeocodeAddress[] => (res.results ? Object.values(res.results) : [])),
      catchError(() => of([])),
    );
  }

  getAddressReverse(lat: string, lng: string): Observable<GeocodeAddress[]> {
    const url = `${this.GEOCODE_REVERSE_API}POINT(${lng} ${lat})`;
    return this.httpClient.get<GeocodeResponse<GeocodeAddress>>(url).pipe(
      map((res) => (res.results ? Object.values(res.results) : [])),
      catchError(() => of([])),
    );
  }
}
