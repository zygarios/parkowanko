import { LocationCoords } from './location-coords.type';

export interface ParkingEditLocationProposalSaveData {
  location: LocationCoords;
}

export class ParkingEditLocationProposal {
  id!: number;
  createdAt!: Date;
  updatedAt!: Date;

  location!: LocationCoords;
  likeCount!: number;
  dislikeCount!: number;
  parkingPointId!: number;

  constructor(props: ParkingEditLocationProposal) {
    if (props) {
      Object.assign(this, props);

      if (props.createdAt) this.createdAt = new Date(props.createdAt);
      if (props.updatedAt) this.updatedAt = new Date(props.updatedAt);
    }
  }
}
