import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reviews-votes-summary',
  imports: [MatIconModule],
  templateUrl: './reviews-votes-summary.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsVotesSummaryComponent {
  positiveCount = input.required<number>();
  negativeCount = input.required<number>();
}
