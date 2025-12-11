import { ApiBaseType } from './api-base-type.model';

export interface ReviewSaveData {
  parkingId: number;
  description: string;
  attributes: string[];
  occupancy: string;
  isLiked: boolean;
}

export class Review extends ApiBaseType {
  parkingId!: number;
  description!: string;
  attributes!: string[];
  occupancy!: string;
  isLiked!: boolean;

  constructor(props: Partial<Review>) {
    super(props);
  }
}
