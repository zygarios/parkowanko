import { ParkingPoint } from '../../_types/parking-point.type';

export interface ParkingPointActionsSheetData {
  parkingPoint: ParkingPoint;
  addressLabel?: string;
}

export type ParkingPointActionsSheetResult = string | 'DISMISS';
