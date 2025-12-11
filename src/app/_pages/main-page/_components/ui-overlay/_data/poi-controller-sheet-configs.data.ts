import { MenuSheetData } from '../../../../../_components/menu-sheet/menu-sheet.model';
import { PoiActionsEnum } from '../_types/poi-actions.model';

export const addingPoiConfirmSheetConfig: MenuSheetData = {
  menuItems: [
    {
      label: 'Anuluj',
      icon: 'close',
      result: PoiActionsEnum.CANCEL,
    },
    {
      label: 'Potwierdź',
      icon: 'edit_location_alt',
      result: PoiActionsEnum.CONFIRM,
      isPrimary: true,
      isSuccess: true,
    },
  ],
  isMenuHorizontal: true,
};

export const selectedPoiOptionsSheetConfig: MenuSheetData = {
  menuItems: [
    {
      label: 'Nawiguj',
      icon: 'navigation',
      result: PoiActionsEnum.NAVIGATE,
      isPrimary: true,
    },
    {
      label: 'Zaproponuj zmianę lokalizacji',
      icon: 'edit_location_alt',
      result: PoiActionsEnum.UPDATE,
    },
    {
      label: 'Zamknij',
      icon: 'keyboard_arrow_down',
      result: PoiActionsEnum.CLOSE,
    },
  ],
};

export const changingPoiPositionOptionsSheetConfig: MenuSheetData = {
  menuItems: [
    {
      label: 'Anuluj',
      icon: 'close',
      result: PoiActionsEnum.CANCEL,
    },
    {
      label: 'Potwierdź',
      icon: 'edit_location_alt',
      result: PoiActionsEnum.CONFIRM,
      isPrimary: true,
      isSuccess: true,
    },
  ],
  isMenuHorizontal: true,
};
