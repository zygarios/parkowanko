import { ApiBaseType } from './api-base-type.model';
import { LocationCoords } from './location-coords.model';

export class Parking extends ApiBaseType {
  location!: LocationCoords;
  name?: string;
  description?: string;

  constructor(parking: Partial<Parking>) {
    super();

    Object.assign(this, parking);

    Object.entries(parking).forEach(([key, value]: [string, any]) => {
      switch (key) {
        case 'created_at':
          return (this.created_at = new Date(value));
        case 'updated_at':
          return (this.updated_at = new Date(value));
        default:
          return;
      }
    });
  }
}

export interface ParkingSaveData {
  location: LocationCoords;
  name?: string;
  description?: string;
}
