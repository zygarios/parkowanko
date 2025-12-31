import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ComputedFuncPipe } from '../../../../../_others/_helpers/computed-func.pipe';
import { RelativeTimePipe } from '../../../../../_pipes/relative-time.pipe';
import { Review } from '../../../../../_types/review.type';
import { occupancyOptionsData } from '../../add-review/_data/occupancy-options.data';
import { AttributeLabel } from '../../add-review/_types/attribute.model';
import { Occupancy, OccupancyLabel } from '../../add-review/_types/occupancy.model';

const DESCRIPTION_CHAR_LIMIT = 100;

@Component({
  selector: 'app-review',
  imports: [DatePipe, RelativeTimePipe, MatButtonModule, MatIconModule, ComputedFuncPipe],
  templateUrl: './review.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent {
  review = input.required<Review>();

  occupancy = Occupancy;
  occupancyLabel = OccupancyLabel;
  attributeLabel = AttributeLabel;
  occupancyOptions = occupancyOptionsData;
  areDetailsOpen = signal<boolean>(false);

  showExpandButton = computed(() => {
    return (
      this.review().attributes.length > 1 ||
      (this.review().description?.length ?? 0) > DESCRIPTION_CHAR_LIMIT
    );
  });

  displayedDescription = computed(() => {
    const desc = this.review().description || 'Brak komentarza';
    return !this.areDetailsOpen() && desc.length > DESCRIPTION_CHAR_LIMIT
      ? desc.slice(0, DESCRIPTION_CHAR_LIMIT) + '...'
      : desc;
  });

  getOccupancyIcon = (occupancy: Occupancy): string | undefined => {
    return this.occupancyOptions.find((opt) => opt.value === occupancy)?.icon;
  };
}
