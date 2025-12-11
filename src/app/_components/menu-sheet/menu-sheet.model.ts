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
