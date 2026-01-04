import { ParkingPoint } from '../../_types/parking-point.type';
import { Review } from '../../_types/review.type';

export interface ParkingPointActionsSheetData {
  parkingPoint: ParkingPoint;
  reviews: Review[];
}

export type ParkingPointActionsSheetResult = string | 'DISMISS';
