import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { filter, merge, Subject } from 'rxjs';
import { MenuSheetData, MenuSheetItem, MenuSheetResult } from './menu-sheet.model';

@Component({
  selector: 'app-menu-sheet',
  imports: [MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './menu-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSheetComponent {
  private sheetRef: MatBottomSheetRef = inject(MatBottomSheetRef);
  data: MenuSheetData = inject<MenuSheetData>(MAT_BOTTOM_SHEET_DATA);

  menuSheetRef = {
    dismiss: () => this.sheetRef.dismiss(),
    onClick: new Subject<MenuSheetResult>(),
  };

  constructor() {
    this.handleCancelSheet();
  }

  handleCancelSheet() {
    // Obsługa kliknięcia w tło
    merge(
      this.sheetRef.backdropClick(),
      this.sheetRef.keydownEvents().pipe(filter((event) => event.key === 'Escape')),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.sheetRef.dismiss('DISMISS');
        this.menuSheetRef.onClick.next('DISMISS');
      });
  }

  choose(menu: MenuSheetItem): void {
    this.menuSheetRef.onClick.next(menu.result);
  }

  ngOnDestroy() {
    this.menuSheetRef.onClick.complete();
  }
}
