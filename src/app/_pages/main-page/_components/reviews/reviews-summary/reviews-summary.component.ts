import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ParkingPoint } from '../../../../../_types/parking-point.type';

@Component({
  selector: 'app-reviews-summary',
  imports: [MatIconModule],
  templateUrl: './reviews-summary.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsSummaryComponent {
  parkingPoint = input.required<ParkingPoint>();
}
