import { Signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface MenuSheetItem<T = any> {
  result: T;
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
  onClick: Subject<MenuSheetItem>;
}
