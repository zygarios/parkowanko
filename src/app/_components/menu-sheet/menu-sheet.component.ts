import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface MenuSheetItem {
  label: string;
  icon: string;
  result: any;
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

@Component({
  selector: 'app-menu-sheet',
  imports: [MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './menu-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSheetComponent {
  data: MenuSheetData = inject(MAT_BOTTOM_SHEET_DATA);
  sheetRef: MatBottomSheetRef = inject(MatBottomSheetRef);

  choose(result: any) {
    this.sheetRef.dismiss(result);
  }
}
