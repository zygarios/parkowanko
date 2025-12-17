import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  GeocodeFeature,
  GeocodeFeatureResponse,
  GeocodeResponse,
} from '../../_types/geocode-api.type';

@Injectable({
  providedIn: 'root',
})
export class GeocodeApiService {
  private httpClient = inject(HttpClient);

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
      map((res: GeocodeFeatureResponse[]): GeocodeFeature[] => {
        return res.map((feature) => {
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
          // Case 1: jest ulica
          if (ul_nazwa_glowna) {
            const streetAndNumber = [ul_nazwa_glowna, pkt_numer].filter(Boolean).join(' ');
            constructedName = [streetAndNumber, miejsc_nazwa].filter(Boolean).join(', ');

            // dodajemy nawias z woj. i gm.
            if (woj_nazwa && gm_nazwa) {
              constructedName += `\n (woj. ${woj_nazwa.toLowerCase()}, gm. ${gm_nazwa.toLowerCase()})`;
            }

            // Case 2: brak ulicy, ale jest numer
          } else if (pkt_numer && miejsc_nazwa) {
            constructedName = `${miejsc_nazwa} ${pkt_numer}`;
            if (woj_nazwa && gm_nazwa) {
              constructedName += `\n (woj. ${woj_nazwa.toLowerCase()}, gm. ${gm_nazwa.toLowerCase()})`;
            }

            // Case 3: brak ulicy i numeru
          } else if (woj_nazwa && miejsc_nazwa) {
            constructedName = `${miejsc_nazwa}`;
            if (woj_nazwa && gm_nazwa) {
              constructedName += `\n (woj. ${woj_nazwa.toLowerCase()}, gm. ${gm_nazwa.toLowerCase()})`;
            }
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
              woj_nazwa: woj_nazwa?.toLowerCase(),
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
      catchError(() => of([])),
    );
  }
}
