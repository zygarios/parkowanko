import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Parking } from '../_types/parking.mode';

@Injectable({
  providedIn: 'root',
})
export class ParkingsService {
  private _httpClient = inject(HttpClient);
  getParkings(): Observable<Parking[]> {
    return this._httpClient.get<Parking[]>(`${environment.apiUrl}/parking`);
  }
  postParking(body: Parking): Observable<Parking> {
    return this._httpClient.post<Parking>(
      `${environment.apiUrl}/parking`,
      body,
    );
  }

  patchParking(body: Parking): Observable<Parking> {
    return this._httpClient.patch<Parking>(
      `${environment.apiUrl}/parking`,
      body,
    );
  }

  deleteParking(): Observable<void> {
    return this._httpClient.delete<void>(`${environment.apiUrl}/parking`);
  }
}
