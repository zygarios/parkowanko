import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GlobalSpinnerService } from '../../_services/_core/global-spinner.service';
import { ParkingPoint, ParkingPointSaveData } from '../../_types/parking-point.type';

@Injectable({
  providedIn: 'root',
})
export class ParkingsApiService {
  private _httpClient = inject(HttpClient);
  private _globalSpinnerService = inject(GlobalSpinnerService);

  private parkingsList = signal<ParkingPoint[]>([]);

  getParkings(force = false): Signal<ParkingPoint[]> {
    if (!this.parkingsList().length || force) {
      this._httpClient.get<ParkingPoint[]>(`${environment.apiUrl}/parkings/`).subscribe((res) => {
        const parkings = res.map((parking) => new ParkingPoint(parking));
        this.parkingsList.set(parkings);
      });
    }

    return this.parkingsList.asReadonly();
  }

  getParking(parkingPointId: number): Observable<ParkingPoint> {
    return this._httpClient
      .get<ParkingPoint>(`${environment.apiUrl}/parkings/${parkingPointId}/`)
      .pipe(
        tap((res) => {
          const parking = new ParkingPoint(res);
          const parkingIndex = this.parkingsList().findIndex((item) => item.id === parking.id);
          if (parkingIndex !== -1) {
            this.parkingsList.update((parkings: ParkingPoint[]) =>
              parkings.toSpliced(parkingIndex, 1, parking),
            );
          }
        }),
      );
  }

  postParking(body: ParkingPointSaveData): Observable<ParkingPoint> {
    this._globalSpinnerService.isSpinnerActive.set(true);
    return this._httpClient.post<ParkingPoint>(`${environment.apiUrl}/parkings/`, body).pipe(
      tap((newParking: ParkingPoint) =>
        this.parkingsList.update((parkings: ParkingPoint[]) => [
          ...parkings,
          new ParkingPoint(newParking),
        ]),
      ),
      finalize(() => this._globalSpinnerService.isSpinnerActive.set(false)),
    );
  }

  patchParking(id: number, body: ParkingPointSaveData): Observable<ParkingPoint> {
    this._globalSpinnerService.isSpinnerActive.set(true);
    return this._httpClient.patch<ParkingPoint>(`${environment.apiUrl}/parkings/${id}/`, body).pipe(
      tap((updatedParking: ParkingPoint) =>
        this.parkingsList.update((parkings: ParkingPoint[]) =>
          parkings.map((parking) =>
            parking.id !== id ? parking : new ParkingPoint(updatedParking),
          ),
        ),
      ),
      finalize(() => this._globalSpinnerService.isSpinnerActive.set(false)),
    );
  }
}
