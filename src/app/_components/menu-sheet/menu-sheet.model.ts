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
}

export enum MenuSheetResult {
  DISMISS = 'DISMISS',
  CANCEL = 'CANCEL',
  CONFIRM = 'CONFIRM',
}
