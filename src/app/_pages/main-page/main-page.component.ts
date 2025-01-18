import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapComponent } from '../../_components/map/map.component';
import { NavbarComponent } from '../../_components/navbar/navbar.component';

@Component({
  selector: 'app-main-page',
  imports: [MapComponent, NavbarComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent {}
