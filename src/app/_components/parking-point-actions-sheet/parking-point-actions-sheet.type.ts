import { ParkingPoint } from '../../_types/parking-point.type';
import { Review } from '../../_types/review.type';

export interface ParkingPointActionsSheetData {
  parkingPoint: ParkingPoint;
  reviews: Review[];
}

export enum ParkingPointActionsSheetResult {
  UPDATE_LOCATION = 'UPDATE_LOCATION',
  NAVIGATE = 'NAVIGATE',
  VIEW_REVIEWS = 'VIEW_REVIEWS',
  ADD_REVIEW = 'ADD_REVIEW',
  DISMISS = 'DISMISS',
}
