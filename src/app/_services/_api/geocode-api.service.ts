import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  private _httpClient = inject(HttpClient);

  getAddressByCoordinates(location: LocationCoords): Observable<string> {
    return this._httpClient
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
      this._httpClient.get<GeocodeResponse>(environment.geoStatApi, {
        params: { cnt: 5, idx: 'prngjo', tag: 'miejscowość', q: searchTerm, useExtSvc: true },
      }),
      this._httpClient.get<GeocodeResponse>(environment.geoStatApi, {
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

    const formattedWoj = woj_nazwa ? this._capitalizeFirstLetter(woj_nazwa) : null;
    const formattedGm = gm_nazwa ? this._capitalizeFirstLetter(gm_nazwa) : null;
    const formattedRodzaj = RODZAJ ? this._capitalizeFirstLetter(RODZAJ) : null;

    let subname = null;
    if (formattedWoj && formattedGm) {
      subname = `${formattedWoj}, gm. ${formattedGm}`;
    }

    if (KLASA === 'miejscowość' && formattedRodzaj) {
      subname = subname ? `${formattedRodzaj}, ${subname}` : formattedRodzaj;
    }

    if (ul_nazwa_glowna) {
      const streetAndNumber = [ul_nazwa_glowna, pkt_numer].filter(Boolean).join(' ');
      constructedName = [streetAndNumber, miejsc_nazwa].filter(Boolean).join(', ');
    } else if (pkt_numer && miejsc_nazwa) {
      constructedName = `${miejsc_nazwa} ${pkt_numer}`;
    } else if (woj_nazwa && miejsc_nazwa) {
      constructedName = `${miejsc_nazwa}`;
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
        subname: subname,
        woj_nazwa: formattedWoj || undefined,
        pow_nazwa,
        gm_nazwa: formattedGm || undefined,
        miejsc_nazwa,
        ul_nazwa_glowna,
        pkt_numer,
        pkt_kodPocztowy,
      },
    };
  }

  private _capitalizeFirstLetter(text: string): string {
    if (!text) return text;
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
}
