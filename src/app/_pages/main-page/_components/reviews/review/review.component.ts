import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RelativeTimePipe } from '../../../../../_pipes/relative-time.pipe';
import { Review } from '../../../../../_types/review.type';
import { AttributeLabel } from '../../add-review/_types/attribute.model';
import { Occupancy, OccupancyLabel } from '../../add-review/_types/occupancy.model';

@Component({
  selector: 'app-review',
  imports: [DatePipe, RelativeTimePipe, MatButtonModule],
  templateUrl: './review.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent {
  review = input.required<Review>();

  occupancy = Occupancy;
  occupancyLabel = OccupancyLabel;
  attributeLabel = AttributeLabel;

  areDetailsOpen = signal<boolean>(false);
}
