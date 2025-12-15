import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  GeocodeFeature,
  GeocodeFeatureResponse,
  geocodeUselessClasses,
} from '../../_types/geocode-api.type';

@Injectable({
  providedIn: 'root',
})
export class GeocodeApiService {
  private httpClient = inject(HttpClient);

  getAddresses(searchTerm: string): Observable<GeocodeFeature[]> {
    return this.httpClient
      .get<GeocodeFeatureResponse>(environment.geoStatApi, {
        params: { f: 'json', cnt: 10, idx: 'all', q: searchTerm, useExtSvc: true },
      })
      .pipe(
        map((res: GeocodeFeatureResponse): GeocodeFeature[] => {
          return res.features
            .filter((feature) => !geocodeUselessClasses.includes(feature.properties.KLASA))
            .map((feature) => {
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
                },
              } = feature;

              let constructedName = name;

              if (ul_nazwa_glowna) {
                const streetAndNumber = [ul_nazwa_glowna, pkt_numer].filter(Boolean).join(' ');
                constructedName = [streetAndNumber, miejsc_nazwa].filter(Boolean).join(', ');
              } else if (woj_nazwa && miejsc_nazwa) {
                constructedName = `${miejsc_nazwa} (${woj_nazwa.toLowerCase()})`;
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
                coords: {
                  lat,
                  lng,
                },
                details: {
                  desc,
                  name: constructedName,
                  woj_nazwa,
                  pow_nazwa,
                  gm_nazwa,
                  miejsc_nazwa,
                  ul_nazwa_glowna,
                  pkt_numer,
                  pkt_kodPocztowy,
                },
              };
            });
        }),
        tap((res) => {
          console.log(res);
        }),
        catchError(() => of([])),
      );
  }
}
