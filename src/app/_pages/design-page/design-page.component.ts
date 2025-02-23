import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-design-page',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
  ],
  templateUrl: './design-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col p-3 gap-6',
  },
})
export class DesignPageComponent {}
