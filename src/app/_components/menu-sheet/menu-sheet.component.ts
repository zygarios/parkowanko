import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Subject } from 'rxjs';

export interface MenuSheetItem<T = any> {
  label: string;
  icon: string;
  result: T;
  isPrimary?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
}
export interface MenuSheetData {
  menuItems: MenuSheetItem[];
  title?: string;
  description?: string;
  isMenuHorizontal?: boolean;
}

export interface MenuSheetRef {
  dismiss: () => void;
  onClick: Subject<MenuSheetItem>;
}

@Component({
  selector: 'app-menu-sheet',
  imports: [MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './menu-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSheetComponent {
  private sheetRef: MatBottomSheetRef = inject(MatBottomSheetRef);

  menuSheetRef = {
    dismiss: () => this.sheetRef.dismiss(),
    onClick: new Subject<MenuSheetItem>(),
  };

  data: MenuSheetData = inject(MAT_BOTTOM_SHEET_DATA);

  choose(menu: MenuSheetItem): void {
    this.menuSheetRef.onClick.next(menu);
  }

  ngOnDestroy(): void {
    this.menuSheetRef.onClick.complete();
  }
}
