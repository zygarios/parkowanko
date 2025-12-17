import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RelativeTimePipe } from '../../../../_pipes/relative-time.pipe';
import { Review } from '../../../../_types/review.type';

@Component({
  selector: 'app-reviews',
  imports: [MatChipsModule, MatDialogModule, MatButtonModule, DatePipe, RelativeTimePipe],
  templateUrl: './reviews.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent {
  data = inject<{ reviews: Review[] }>(MAT_DIALOG_DATA, { optional: true }) || {
    reviews: [
      {
        id: 1,
        username: 'Janusz_Parkowania',
        createdAt: new Date(),
        updatedAt: new Date(),
        parkingId: 101,
        description: 'Dużo miejsca, ale wyjazd ciasny.',
        attributes: ['Duże miejsca', 'Ciasny wjazd'],
        occupancy: 'Średnie',
        isLiked: true,
      },
      {
        id: 2,
        username: 'Marta_Kierowca',
        createdAt: new Date('2025-05-15T12:30:00'),
        updatedAt: new Date('2025-05-15T12:30:00'),
        parkingId: 101,
        description: 'Bardzo bezpiecznie, polecam na noc.',
        attributes: ['Oświetlony', 'Monitoring', 'Płatny'],
        occupancy: 'Niskie',
        isLiked: true,
      },
      {
        id: 3,
        username: 'Szybki_Wiesiek',
        createdAt: new Date('2025-10-01T18:45:00'),
        updatedAt: new Date('2025-10-01T18:45:00'),
        parkingId: 101,
        description: 'Dramat, w weekend nie ma szans zaparkować. Wszędzie błoto.',
        attributes: ['Błoto', 'Tłok', 'Brak oświetlenia'],
        occupancy: 'Wysokie',
        isLiked: false,
      },
    ] as Review[],
  };
}
