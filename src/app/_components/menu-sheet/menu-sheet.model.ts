import { Subject } from 'rxjs';

export type MenuSheetResult = string | 'DISMISS';

export interface MenuSheetItem {
  result: MenuSheetResult;
  label: string;
  icon?: string;
  isPrimary?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
}
export interface MenuSheetData {
  menuItems: MenuSheetItem[];
  title?: string;
  description?: string;
  hasHorizontalScroll?: boolean;
}

export interface MenuSheetRef {
  dismiss: () => void;
  onClick: Subject<MenuSheetResult>;
}
