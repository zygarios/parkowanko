import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ParkingEditLocationProposalSaveData } from '../../_types/parking-edit-location-proposal.type';

@Injectable({
  providedIn: 'root',
})
export class ParkingEditLocationApiService {
  private _httpClient = inject(HttpClient);

  addEditLocationProposal(id: number, body: ParkingEditLocationProposalSaveData) {
    return this._httpClient.post(`${environment.apiUrl}/parking-points/${id}/edit-location/`, body);
  }
}
