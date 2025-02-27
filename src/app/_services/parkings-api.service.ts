import {
  HttpClient,
  httpResource,
  HttpResourceRef,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Parking, ParkingSaveData } from '../_types/parking.model';

@Injectable({
  providedIn: 'root',
})
export class ParkingsService {
  private _httpClient = inject(HttpClient);

  parkingsList = this._getParkings();

  private _getParkings(): HttpResourceRef<Parking[]> {
    return httpResource(`${environment.apiUrl}/parkings/`, {
      parse: (res) => (res as []).map((item) => new Parking(item)),
      defaultValue: [],
    });
  }

  postParking(body: ParkingSaveData): Observable<Parking> {
    return this._httpClient
      .post<Parking>(`${environment.apiUrl}/parkings/`, body)
      .pipe(
        tap((newParking: Parking) =>
          this.parkingsList.update((parkings: Parking[]) => [
            ...parkings,
            new Parking(newParking),
          ]),
        ),
      );
  }

  patchParking(id: number, body: ParkingSaveData): Observable<Parking> {
    return this._httpClient
      .patch<Parking>(`${environment.apiUrl}/parkings/${id}/`, body)
      .pipe(
        tap((updatedParking: Parking) =>
          this.parkingsList.update((parkings: Parking[]) =>
            parkings.map((parking) =>
              parking.id !== id ? parking : new Parking(updatedParking),
            ),
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
