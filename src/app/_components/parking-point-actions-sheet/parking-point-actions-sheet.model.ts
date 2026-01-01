import { ParkingPoint } from '../../_types/parking-point.type';

export interface ParkingPointActionsSheetData {
  parkingPoint: ParkingPoint;
}

export type ParkingPointActionsSheetResult = string | 'DISMISS';
