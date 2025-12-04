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
    super();

    Object.assign(this, props);

    // Dodatkowe transformacje
    Object.entries(props).forEach(([key, value]: [string, any]) => {
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
