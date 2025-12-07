import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Parking, ParkingSaveData } from '../../_types/parking.model';

@Injectable({
  providedIn: 'root',
})
export class ParkingsApiService {
  private _httpClient = inject(HttpClient);

  private parkingsList = signal<Parking[]>([]);

  getParkings(force = false): Signal<Parking[]> {
    if (!this.parkingsList.length || force) {
      this._httpClient
        .get<Parking[]>(`${environment.apiUrl}/parkings/`)
        .pipe(
          map(() => {
            const mockParkings = [
              {
                id: 1001,
                location: { lng: 18.643809, lat: 54.360146 },
                likesCount: 5,
                dislikesCount: 0,
                isVerified: true,
                isEditPositionPendingRequest: false,
              },
              {
                id: 1002,
                location: { lng: 18.646399, lat: 54.349692 },
                likesCount: 12,
                dislikesCount: 1,
                isVerified: true,
                isEditPositionPendingRequest: false,
              },
              {
                id: 1003,
                location: { lng: 18.625695, lat: 54.37326 },
                likesCount: 2,
                dislikesCount: 5,
                isVerified: false,
                isEditPositionPendingRequest: true,
              },
            ];
            return mockParkings;
          }),
        )
        .subscribe((res) => {
          const parkings = res.map((parking) => new Parking(parking));
          this.parkingsList.set(parkings);
        });
    }

    return this.parkingsList.asReadonly();
  }

  postParking(body: ParkingSaveData): Observable<Parking> {
    return this._httpClient
      .post<Parking>(`${environment.apiUrl}/parkings/`, body)
      .pipe(
        tap((newParking: Parking) =>
          this.parkingsList.update((parkings: Parking[]) => [...parkings, new Parking(newParking)]),
        ),
      );
  }

  patchParking(id: number, body: ParkingSaveData): Observable<Parking> {
    return this._httpClient
      .patch<Parking>(`${environment.apiUrl}/parkings/${id}/`, body)
      .pipe(
        tap((updatedParking: Parking) =>
          this.parkingsList.update((parkings: Parking[]) =>
            parkings.map((parking) => (parking.id !== id ? parking : new Parking(updatedParking))),
          ),
        ),
      );
  }

  deleteParking(id: number): Observable<void> {
    return this._httpClient
      .delete<void>(`${environment.apiUrl}/parkings/${id}/`)
      .pipe(
        tap(() =>
          this.parkingsList.update((parkings: Parking[]) =>
            parkings.filter((parking) => parking.id !== id),
          ),
        ),
      );
  }
}
