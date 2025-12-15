import { Signal } from '@angular/core';
import { MenuSheetData } from '../../../../../_components/menu-sheet/menu-sheet.model';
import { PoiActionsEnum } from '../_types/poi-actions.model';

export const addingPoiConfirmSheetConfig = (
  isPrimaryButtonDisabled: Signal<boolean>,
): MenuSheetData => {
  return {
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
        isButtonDisabled: isPrimaryButtonDisabled,
      },
    ],
    isMenuHorizontal: true,
    title: 'Dodaj nowy parking',
  };
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
      label: 'Anuluj',
      icon: 'close',
      result: PoiActionsEnum.CLOSE,
    },
  ],
};

export const changingPoiPositionOptionsSheetConfig = (
  isPrimaryButtonDisabled: Signal<boolean>,
): MenuSheetData => {
  return {
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
        isButtonDisabled: isPrimaryButtonDisabled,
      },
    ],
    isMenuHorizontal: true,
    title: 'Zmiana lokalizacji',
  };
};
