import {
  MenuSheetData,
  MenuSheetResult,
} from '../../../../../_components/menu-sheet/menu-sheet.model';

export const addingPoiConfirmSheetConfig = (): MenuSheetData => {
  return {
    menuItems: [
      {
        label: 'Anuluj',
        icon: 'close',
        result: MenuSheetResult.CANCEL,
      },
      {
        label: 'Zatwierdź',
        icon: 'add_location_alt',
        result: MenuSheetResult.CONFIRM,
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
        result: MenuSheetResult.CANCEL,
      },
      {
        label: 'Zatwierdź',
        icon: 'edit_location_alt',
        result: MenuSheetResult.CONFIRM,
        isPrimary: true,
        isSuccess: true,
      },
    ],
    title: 'Poprawa lokalizacji',
    description: 'Poruszaj mapą lub markerem, aby ustawić proponowaną nową lokalizację.',
  };
};
