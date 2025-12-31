import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reviews-summary',
  imports: [MatIconModule],
  templateUrl: './reviews-summary.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsSummaryComponent {
  positiveCount = input.required<number>();
  negativeCount = input.required<number>();
}
