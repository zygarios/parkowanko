import { ApiBaseType } from './api-base-type.model';
import { LocationCoords } from './location-coords.model';

export class Parking extends ApiBaseType {
  location!: LocationCoords;
  name?: string;
  description?: string;

  constructor(parking: any) {
    super();
    Object.entries(parking).forEach(([key, value]: [string, any]) => {
      if (['created_at', 'updated_at'].includes(key)) {
        (this as any)[key] = new Date(value);
      } else {
        (this as any)[key] = value;
      }
    });
  }
}

export interface ParkingSaveData {
  location: LocationCoords;
  name?: string;
  description?: string;
}
