import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Review, ReviewSaveData } from '../../_types/review.type';

@Injectable({
  providedIn: 'root',
})
export class ReviewsApiService {
  private _httpClient = inject(HttpClient);

  getReviews(parkingId: number): Observable<Review[]> {
    return this._httpClient
      .get<Review[]>(`${environment.apiUrl}/parkings/${parkingId}/reviews/`)
      .pipe(map((reviews: Review[]) => reviews.map((review: Review) => new Review(review))));
  }

  postReview(parkingId: number, body: ReviewSaveData): Observable<Review> {
    return this._httpClient.post<Review>(
      `${environment.apiUrl}/parkings/${parkingId}/reviews/`,
      body,
    );
  }
}
