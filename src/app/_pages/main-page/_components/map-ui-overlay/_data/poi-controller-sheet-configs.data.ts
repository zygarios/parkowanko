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
    hasHorizontalScroll: false,
    title: 'Dodanie nowego parkingu',
    description: 'Poruszaj mapą lub markerem, aby ustawić pozycję nowego parkingu.',
  };
};

export const selectedPoiOptionsSheetConfig = (
  likeCount: number,
  dislikeCount: number,
): MenuSheetData => {
  return {
    menuItems: [
      {
        label: 'Nawiguj',
        icon: 'navigation',
        result: PoiActionsEnum.NAVIGATE,
        isPrimary: true,
      },
      {
        label: 'Dodaj opinię',
        icon: 'rate_review',
        result: PoiActionsEnum.ADD_REVIEW,
      },
      {
        label: 'Zobacz opinie',
        icon: 'forum',
        result: PoiActionsEnum.VIEW_REVIEWS,
      },
      {
        label: 'Popraw lokalizację',
        icon: 'edit_location_alt',
        result: PoiActionsEnum.UPDATE_LOCATION,
      },
    ],
    title: 'Parking',
    description: `Oceny pozytywne: ${likeCount}\nOceny negatywne: ${dislikeCount}`,
    hasHorizontalScroll: true,
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
    hasHorizontalScroll: false,
    title: 'Poprawa lokalizacji',
    description: 'Poruszaj mapą lub markerem, aby poprawić lokalizację istniejącego parkingu.',
  };
};
