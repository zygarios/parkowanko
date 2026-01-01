import { MenuSheetData } from '../../../../../_components/menu-sheet/menu-sheet.model';
import { ParkingPoint } from '../../../../../_types/parking-point.type';
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

export const selectedPoiOptionsSheetConfig = (parkingPoint: ParkingPoint): MenuSheetData => {
  const options = {
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
    description: `Oceny pozytywne: ${parkingPoint.likeCount}\nOceny negatywne: ${parkingPoint.dislikeCount}`,
    hasHorizontalScroll: true,
  };

  if (!parkingPoint.isVerified) {
    options.title = options.title + ' (niezweryfikowany)';
  }

  return options;
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
