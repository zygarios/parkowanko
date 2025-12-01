import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Parking, ParkingSaveData } from '../_types/parking.model';

@Injectable({
  providedIn: 'root',
})
export class ParkingsService {
  private readonly _httpClient = inject(HttpClient);

  private readonly parkingsList = signal<Parking[]>([]);

  getParkings(force = false): Signal<Parking[]> {
    if (!this.parkingsList.length || force) {
      this._httpClient
        .get<Parking[]>(`${environment.apiUrl}/parkings/`)
        .pipe()
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
