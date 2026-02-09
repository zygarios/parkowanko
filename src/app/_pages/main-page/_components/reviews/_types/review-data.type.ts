import { ParkingPoint } from '../../../../../_types/parking-point.type';
import { Review } from '../../../../../_types/review.type';

export interface ReviewData {
  parkingPoint: ParkingPoint;
  reviews: Review[];
}
