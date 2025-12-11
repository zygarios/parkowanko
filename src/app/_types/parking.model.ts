import { ApiBaseType } from './api-base-type.model';
import { LocationCoords } from './location-coords.model';
export interface ParkingSaveData {
  location: LocationCoords;
}

export class Parking extends ApiBaseType {
  location!: LocationCoords;
  likesCount!: number;
  dislikesCount!: number;
  hasEditLocationProposal!: boolean;
  isVerified!: boolean;

  constructor(props: Partial<Parking>) {
    super(props);
  }
}
