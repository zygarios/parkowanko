import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParkingPoint, ParkingPointSaveData } from '../../_types/parking-point.type';
import { ParkingsFilter } from '../../_types/parkings-filter.type';

@Injectable({
  providedIn: 'root',
})
export class ParkingsApiService {
  private _httpClient = inject(HttpClient);

  private _parkingsList = signal<ParkingPoint[]>([]);

  parkingFilter = signal<ParkingsFilter>(ParkingsFilter.ALL);

  private _filteredParkingsList = computed(() => {
    const list = this._parkingsList();
    const filter = this.parkingFilter();

    if (filter === ParkingsFilter.WELL_RATED) {
      return list.filter((p) => p.likeCount > p.dislikeCount);
    }

    return list;
  });

  getParkings(force = false): Signal<ParkingPoint[]> {
    if (!this._parkingsList().length || force) {
      this._httpClient
        .get<ParkingPoint[]>(`${environment.apiUrl}/parking-points/`)
        .subscribe((res) => {
          const parkings = res.map((parking) => new ParkingPoint(parking));
          this._parkingsList.set(parkings);
        });
    }

    return this._filteredParkingsList;
  }

  getParking(parkingPointId: number): Observable<ParkingPoint> {
    return this._httpClient
      .get<ParkingPoint>(`${environment.apiUrl}/parking-points/${parkingPointId}/`)
      .pipe(
        tap((res) => {
          const parking = new ParkingPoint(res);
          const parkingIndex = this._parkingsList().findIndex((item) => item.id === parking.id);
          if (parkingIndex !== -1) {
            this._parkingsList.update((parkings: ParkingPoint[]) =>
              parkings.toSpliced(parkingIndex, 1, parking),
            );
          }
        }),
      );
  }

  postParking(body: ParkingPointSaveData): Observable<ParkingPoint> {
    return this._httpClient
      .post<ParkingPoint>(`${environment.apiUrl}/parking-points/`, body)
      .pipe(
        tap((newParking: ParkingPoint) =>
          this._parkingsList.update((parkings: ParkingPoint[]) => [
            ...parkings,
            new ParkingPoint(newParking),
          ]),
        ),
      );
  }
}
