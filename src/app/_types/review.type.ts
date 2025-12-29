import { Attribute } from '../_pages/main-page/_components/add-review/_types/attribute.model';
import { Occupancy } from '../_pages/main-page/_components/add-review/_types/occupancy.model';
import { User } from './auth/user.type';

export interface ReviewSaveData {
  parkingPointId: number;
  description: string;
  attributes: Attribute[];
  occupancy: Occupancy;
  isLike: boolean;
}

export class Review {
  id!: number;
  createdAt!: Date;
  updatedAt!: Date;

  parkingPointId!: number;
  description!: string;
  attributes!: Attribute[];
  occupancy!: Occupancy;
  isLike!: boolean;
  user!: User;

  constructor(props: Review) {
    if (props) {
      Object.assign(this, props);

      if (props.createdAt) this.createdAt = new Date(props.createdAt);
      if (props.updatedAt) this.updatedAt = new Date(props.updatedAt);
    }
  }
}
