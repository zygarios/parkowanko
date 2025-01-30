import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Parking, ParkingSaveData } from '../_types/parking.mode';

@Injectable({
  providedIn: 'root',
})
export class ParkingsService {
  private _httpClient = inject(HttpClient);

  parkingsList = rxResource({
    loader: () => this.getParkings(),
    defaultValue: [],
  });

  getParkings(): Observable<Parking[]> {
    return this._httpClient
      .get(`${environment.apiUrl}/parkings/?format=json`)
      .pipe(map((res: any) => res.map((item: any) => new Parking(item))));
  }

  postParking(body: ParkingSaveData): Observable<Parking> {
    return this._httpClient
      .post<Parking>(`${environment.apiUrl}/parkings`, body)
      .pipe(tap(() => this.parkingsList.reload()));
  }

  patchParking(id: number, body: ParkingSaveData): Observable<Parking> {
    return this._httpClient
      .patch<Parking>(`${environment.apiUrl}/parkings/${id}`, body)
      .pipe(tap(() => this.parkingsList.reload()));
  }

  deleteParking(id: number): Observable<void> {
    return this._httpClient
      .delete<void>(`${environment.apiUrl}/parkings/${id}`)
      .pipe(tap(() => this.parkingsList.reload()));
  }
}
