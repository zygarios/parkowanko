export interface ReviewSaveData {
  parkingId: number;
  description: string;
  attributes: string[];
  occupancy: string;
  isLiked: boolean;
}

export class Review {
  id!: number;
  createdAt!: Date;
  updatedAt!: Date;

  parkingId!: number;
  description!: string;
  attributes!: string[];
  occupancy!: string;
  isLiked!: boolean;

  constructor(props: Review) {
    if (props) {
      Object.assign(this, props);

      if (props.createdAt) this.createdAt = new Date(props.createdAt);
      if (props.updatedAt) this.updatedAt = new Date(props.updatedAt);
    }
  }
}
