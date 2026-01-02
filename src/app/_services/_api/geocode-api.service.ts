import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  GeocodeFeature,
  GeocodeFeatureResponse,
  GeocodeResponse,
} from '../../_types/geocode-api.type';
import { LocationCoords } from '../../_types/location-coords.type';

@Injectable({
  providedIn: 'root',
})
export class GeocodeApiService {
  private httpClient = inject(HttpClient);

  getAddressByCoordinates(location: LocationCoords): Observable<string> {
    return this.httpClient
      .get<any>(
        `${environment.geocodeApi}/?request=GetAddressReverse&location=POINT(${location.lng} ${location.lat})&srid=4326`,
      )
      .pipe(
        map((res: any): string => {
          const location = res.results?.[1];
          if (!location) {
            return '';
          }

          const city = location.city;
          const street = location.street;
          const number = location.number;
          const code = location.code;

          const streetAndNumber = street ? `ul. ${street} ${number}` : number;
          return [city, streetAndNumber, code].filter(Boolean).join(', ');
        }),
      );
  }

  getAddresses(searchTerm: string): Observable<GeocodeFeature[]> {
    return forkJoin([
      this.httpClient.get<GeocodeResponse>(environment.geoStatApi, {
        params: { cnt: 5, idx: 'prngjo', tag: 'miejscowość', q: searchTerm, useExtSvc: true },
      }),
      this.httpClient.get<GeocodeResponse>(environment.geoStatApi, {
        params: { cnt: 20, idx: 'pkt', q: searchTerm, useExtSvc: true },
      }),
    ]).pipe(
      map(([res1, res2]: [GeocodeResponse, GeocodeResponse]): GeocodeFeatureResponse[] => [
        ...res1.features,
        ...res2.features,
      ]),
      map((res: GeocodeFeatureResponse[]): GeocodeFeature[] =>
        res.map((feature) => this._mapGusFeatureToGeocodeFeature(feature)),
      ),
      catchError(() => of([])),
    );
  }

  private _mapGusFeatureToGeocodeFeature(feature: GeocodeFeatureResponse): GeocodeFeature {
    const {
      geometry: { coordinates },
      _search: { desc, name },
      properties: {
        woj_nazwa,
        pow_nazwa,
        gm_nazwa,
        miejsc_nazwa,
        ul_nazwa_glowna,
        pkt_numer,
        pkt_kodPocztowy,
        KLASA,
        RODZAJ,
      },
    } = feature;

    let constructedName = name;

    if (KLASA === 'miejscowość') {
      constructedName += `\n(${RODZAJ})`;
    }

    if (ul_nazwa_glowna) {
      const streetAndNumber = [ul_nazwa_glowna, pkt_numer].filter(Boolean).join(' ');
      constructedName = [streetAndNumber, miejsc_nazwa].filter(Boolean).join(', ');
    } else if (pkt_numer && miejsc_nazwa) {
      constructedName = `${miejsc_nazwa} ${pkt_numer}`;
    } else if (woj_nazwa && miejsc_nazwa) {
      constructedName = `${miejsc_nazwa}`;
    }

    if (woj_nazwa && gm_nazwa) {
      constructedName += `\n (woj. ${woj_nazwa.toLowerCase()}, gm. ${gm_nazwa.toLowerCase()})`;
    }

    let lat: number;
    let lng: number;

    if (Array.isArray(coordinates[0])) {
      lat = coordinates[0][1];
      lng = coordinates[0][0];
    } else {
      lat = coordinates[1] as number;
      lng = coordinates[0] as number;
    }

    return {
      coords: { lat, lng },
      details: {
        desc,
        name: constructedName,
        woj_nazwa: woj_nazwa?.toLowerCase(),
        pow_nazwa,
        gm_nazwa,
        miejsc_nazwa,
        ul_nazwa_glowna,
        pkt_numer,
        pkt_kodPocztowy,
      },
    };
  }
}
