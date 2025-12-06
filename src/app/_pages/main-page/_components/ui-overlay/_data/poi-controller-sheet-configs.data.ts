export const addingPoiConfirmSheetConfig = {
  menuItems: [
    {
      label: 'Anuluj',
      icon: 'close',
      result: 'CANCEL',
    },
    {
      label: 'Potwierdź',
      icon: 'edit_location_alt',
      result: 'CONFIRM',
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
      result: 'UPDATE',
      isPrimary: true,
    },
    {
      label: 'Zamknij',
      icon: 'keyboard_arrow_down',
      result: 'CLOSE',
    },
  ],
};

export const changingPoiPositionOptionsSheetConfig = {
  menuItems: [
    {
      label: 'Zasugeruj zmianę położenia parkingu',
      icon: 'edit_location_alt',
      result: 'UPDATE',
      isPrimary: true,
    },
    {
      label: 'Zamknij',
      icon: 'keyboard_arrow_down',
      result: 'CLOSE',
    },
  ],
};
