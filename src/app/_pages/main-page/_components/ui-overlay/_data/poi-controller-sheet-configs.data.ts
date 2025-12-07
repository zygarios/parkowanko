import { PoiActionsEnum } from '../_types/poi-actions.model';

export const addingPoiConfirmSheetConfig = {
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

export const selectedPoiOptionsSheetConfig = {
  menuItems: [
    {
      label: 'Zasugeruj zmianę położenia parkingu',
      icon: 'edit_location_alt',
      result: PoiActionsEnum.UPDATE,
      isPrimary: true,
    },
    {
      label: 'Zamknij',
      icon: 'keyboard_arrow_down',
      result: PoiActionsEnum.CLOSE,
    },
  ],
};

export const changingPoiPositionOptionsSheetConfig = {
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
