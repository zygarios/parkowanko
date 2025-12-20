import { Signal } from '@angular/core';
import { Subject } from 'rxjs';

export type MenuSheetResult = string | 'DISMISS';

export interface MenuSheetItem {
  result: MenuSheetResult;
  label: string;
  icon?: string;
  isPrimary?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  isButtonDisabled?: Signal<boolean>;
}
export interface MenuSheetData {
  menuItems: MenuSheetItem[];
  title?: string;
  description?: string;
  isMenuHorizontal?: boolean;
}

export interface MenuSheetRef {
  dismiss: () => void;
  onClick: Subject<MenuSheetResult>;
}
