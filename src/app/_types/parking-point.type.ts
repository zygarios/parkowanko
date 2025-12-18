import { LocationCoords } from './location-coords.type';
export interface ParkingPointSaveData {
  location: LocationCoords;
}

export class ParkingPoint {
  id!: number;
  createdAt!: Date;
  updatedAt!: Date;

  location!: LocationCoords;
  likeCount!: number;
  dislikeCount!: number;
  hasEditLocationProposal!: boolean;
  isVerified!: boolean;

  constructor(props: ParkingPoint) {
    if (props) {
      Object.assign(this, props);

      if (props.createdAt) this.createdAt = new Date(props.createdAt);
      if (props.updatedAt) this.updatedAt = new Date(props.updatedAt);
    }
  }
}
