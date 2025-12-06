import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GeocodeAddress, GeocodeResponse } from '../../_types/geocode-api.model';

@Injectable({
  providedIn: 'root',
})
export class GeocodeApiService {
  private GEOCODE_API = `${environment.geocodeApi}/?request=GetAddress&srid=4326&address=`;
  private GEOCODE_REVERSE_API = `${environment.geocodeApi}/?request=GetAddressReverse&srid=4326&location=`;

  private httpClient = inject(HttpClient);

  getAddresses(address: string): Observable<GeocodeAddress[]> {
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
