import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { GlobalSpinnerService } from '../../_services/_core/global-spinner.service';
import { Parking, ParkingSaveData } from '../../_types/parking.type';

@Injectable({
  providedIn: 'root',
})
export class ParkingsApiService {
  private _httpClient = inject(HttpClient);
  private _globalSpinnerService = inject(GlobalSpinnerService);

  private parkingsList = signal<Parking[]>([]);

  getParkings(force = false): Signal<Parking[]> {
    if (!this.parkingsList().length || force) {
      this._httpClient.get<Parking[]>(`${environment.apiUrl}/parkings/`).subscribe((res) => {
        const parkings = res.map((parking) => new Parking(parking));
        this.parkingsList.set(parkings);
      });
    }

    return this.parkingsList.asReadonly();
  }

  postParking(body: ParkingSaveData): Observable<Parking> {
    this._globalSpinnerService.isSpinnerActive.set(true);
    return this._httpClient
      .post<Parking>(`${environment.apiUrl}/parkings/`, body)
      .pipe(
        tap((newParking: Parking) =>
          this.parkingsList.update((parkings: Parking[]) => [...parkings, new Parking(newParking)]),
        ),
      );
  }

  patchParking(id: number, body: ParkingSaveData): Observable<Parking> {
    this._globalSpinnerService.isSpinnerActive.set(true);
    return this._httpClient.patch<Parking>(`${environment.apiUrl}/parkings/${id}/`, body).pipe(
      tap((updatedParking: Parking) =>
        this.parkingsList.update((parkings: Parking[]) =>
          parkings.map((parking) => (parking.id !== id ? parking : new Parking(updatedParking))),
        ),
      ),
      finalize(() => this._globalSpinnerService.isSpinnerActive.set(false)),
    );
  }
}
