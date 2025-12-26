import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import {
  ParkingEditLocationProposal,
  ParkingEditLocationProposalSaveData,
} from '../../_types/parking-edit-location-proposal.type';
import { ParkingEditLocationVoteSaveData } from '../../_types/parking-edit-location-vote.type';

@Injectable({
  providedIn: 'root',
})
export class ParkingEditLocationApiService {
  private _httpClient = inject(HttpClient);

  getEditLocationProposal(id: number): Observable<ParkingEditLocationProposal> {
    return this._httpClient
      .get<ParkingEditLocationProposal>(`${environment.apiUrl}/parkings/${id}/edit-location/`)
      .pipe(map((res) => new ParkingEditLocationProposal(res)));
  }

  addEditLocationProposal(
    id: number,
    body: ParkingEditLocationProposalSaveData,
  ): Observable<ParkingEditLocationProposal> {
    return this._httpClient.post<ParkingEditLocationProposal>(
      `${environment.apiUrl}/parkings/${id}/edit-location/`,
      body,
    );
  }

  addEditLocationVote(id: number, body: ParkingEditLocationVoteSaveData): Observable<void> {
    return this._httpClient.post<void>(
      `${environment.apiUrl}/parkings/${id}/edit-location/vote/`,
      body,
    );
  }
}
