import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Review, ReviewSaveData } from '../../_types/review.type';
import { ParkingsApiService } from './parkings-api.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewsApiService {
  private _httpClient = inject(HttpClient);
  private _parkingsApiService = inject(ParkingsApiService);

  getReviews(parkingPointId: number): Observable<Review[]> {
    return this._httpClient
      .get<Review[]>(`${environment.apiUrl}/parking-points/${parkingPointId}/reviews/`)
      .pipe(map((reviews: Review[]) => reviews.map((review: Review) => new Review(review))));
  }

  postReview(parkingPointId: number, body: ReviewSaveData) {
    return this._httpClient
      .post(`${environment.apiUrl}/parking-points/${parkingPointId}/reviews/`, body)
      .pipe(switchMap(() => this._parkingsApiService.getParking(parkingPointId)));
  }
}
