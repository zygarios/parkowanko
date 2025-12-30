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
        label: 'Zatwierdź',
        icon: 'edit_location_alt',
        result: PoiActionsEnum.CONFIRM,
        isPrimary: true,
        isSuccess: true,
        isButtonDisabled: isPrimaryButtonDisabled,
      },
    ],
    isMenuHorizontal: true,
    title: 'Dodanie nowego parkingu',
    description: 'Poruszaj mapą lub markerem, aby ustawić pozycję nowego parkingu.',
  };
};

export const selectedPoiOptionsSheetConfig = ({
  hasEditLocationProposal,
}: {
  hasEditLocationProposal: boolean;
}): MenuSheetData => {
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
      hasEditLocationProposal
        ? {
            label: 'Zagłosuj za poprawą lokalizacji',
            icon: 'edit_location_alt',
            result: PoiActionsEnum.VIEW_UPDATE_LOCATION_PROPOSAL,
          }
        : {
            label: 'Popraw lokalizację',
            icon: 'edit_location_alt',
            result: PoiActionsEnum.UPDATE_LOCATION,
          },
    ],
    isMenuHorizontalWithScroll: true,
  };
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
        label: 'Zatwierdź',
        icon: 'edit_location_alt',
        result: PoiActionsEnum.CONFIRM,
        isPrimary: true,
        isSuccess: true,
        isButtonDisabled: isPrimaryButtonDisabled,
      },
    ],
    isMenuHorizontal: true,
    title: 'Poprawa lokalizacji',
    description: 'Poruszaj mapą lub markerem, aby poprawić lokalizację istniejącego parkingu.',
  };
};

export const voteForUpdatedPoiPositionProposalSheetConfig = (): MenuSheetData => {
  return {
    menuItems: [
      {
        label: 'Nie popieram',
        icon: 'close',
        result: PoiActionsEnum.CANCEL,
        isPrimary: true,
        isError: true,
      },
      {
        label: 'Popieram',
        icon: 'edit_location_alt',
        result: PoiActionsEnum.CONFIRM,
        isPrimary: true,
        isSuccess: true,
      },
    ],
    isMenuHorizontal: true,
    title: 'Zmiana lokalizacji parkingu',
    description: 'Zagłosuj za proponowaną zmianą lokalizacji parkingu.',
    showTitleCloseButton: true,
  };
};
