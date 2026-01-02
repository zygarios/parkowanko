import { MenuSheetData } from '../../../../../_components/menu-sheet/menu-sheet.model';
import { PoiActionsEnum } from '../_types/poi-actions.model';

export const addingPoiConfirmSheetConfig = (): MenuSheetData => {
  return {
    menuItems: [
      {
        label: 'Anuluj',
        icon: 'close',
        result: PoiActionsEnum.CANCEL,
      },
      {
        label: 'Zatwierdź',
        icon: 'edit_location_alt',
        result: PoiActionsEnum.CONFIRM,
        isPrimary: true,
        isSuccess: true,
      },
    ],
    title: 'Dodanie nowego parkingu',
    description: 'Poruszaj mapą lub markerem, aby ustawić pozycję nowego parkingu.',
  };
};

export const changingPoiPositionOptionsSheetConfig = (): MenuSheetData => {
  return {
    menuItems: [
      {
        label: 'Anuluj',
        icon: 'close',
        result: PoiActionsEnum.CANCEL,
      },
      {
        label: 'Zatwierdź',
        icon: 'edit_location_alt',
        result: PoiActionsEnum.CONFIRM,
        isPrimary: true,
        isSuccess: true,
      },
    ],
    title: 'Poprawa lokalizacji',
    description: 'Poruszaj mapą lub markerem, aby poprawić lokalizację istniejącego parkingu.',
  };
};
