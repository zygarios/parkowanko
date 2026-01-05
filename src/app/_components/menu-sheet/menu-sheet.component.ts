import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { filter, merge, Subject } from 'rxjs';
import { SheetRef } from '../../_types/sheet-ref.type';
import { MenuSheetData, MenuSheetResult } from './menu-sheet.model';

@Component({
  selector: 'app-menu-sheet',
  imports: [MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './menu-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSheetComponent {
  private sheetRef: MatBottomSheetRef = inject(MatBottomSheetRef);
  data: MenuSheetData = inject<MenuSheetData>(MAT_BOTTOM_SHEET_DATA);
  menuSheetResult = MenuSheetResult;

  sheetComponentRef: SheetRef<MenuSheetResult> = {
    dismiss: () => this.sheetRef.dismiss(),
    onDismiss: new Subject<MenuSheetResult>(),
  };

  constructor() {
    this.handleCancelSheet();
  }

  handleCancelSheet() {
    // Obsługa zamykania menu po kliknięciu w tło lub wciśnięciu klawisza Escape
    merge(
      this.sheetRef.backdropClick(),
      this.sheetRef.keydownEvents().pipe(filter((event) => event.key === 'Escape')),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.sheetRef.dismiss();
        this.sheetComponentRef.onDismiss.next(MenuSheetResult.CANCEL);
      });
  }

  choose(result: MenuSheetResult): void {
    this.sheetComponentRef.onDismiss.next(result);
  }

  ngOnDestroy() {
    this.sheetComponentRef.onDismiss.complete();
  }
}
