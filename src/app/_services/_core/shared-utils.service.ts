import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../../_components/custom-snackbar/custom-snackbar.component';
import {
  InfoDialogComponent,
  InfoDialogData,
} from '../../_components/info-dialog/info-dialog.component';
import { MenuSheetComponent } from '../../_components/menu-sheet/menu-sheet.component';
import { MenuSheetData } from '../../_components/menu-sheet/menu-sheet.model';
import { SheetRef } from '../../_types/sheet-ref.type';

@Injectable({
  providedIn: 'root',
})
export class SharedUtilsService {
  private _matDialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  private _sheet = inject(MatBottomSheet);

  openSheet<T extends { sheetComponentRef: SheetRef<any> }, D>(
    component: ComponentType<T>,
    data: D,
    config?: { disableClose?: boolean; hasBackdrop?: boolean },
  ) {
    const sheetRef = this._sheet.open<T, D>(component, {
      data,
      autoFocus: false,
      backdropClass: 'backdrop-invisible',
      disableClose: config?.disableClose ?? false,
      hasBackdrop: config?.hasBackdrop ?? true,
    });

    return sheetRef.instance.sheetComponentRef as T['sheetComponentRef'];
  }

  openMenuSheet(data: MenuSheetData, config?: { disableClose?: boolean; hasBackdrop?: boolean }) {
    return this.openSheet(MenuSheetComponent, data, config);
  }

  openSnackbar(title: string, type: 'ERROR' | 'SUCCESS' | 'DEFAULT' = 'DEFAULT') {
    // SetTimeout jest potrzebny aby wymusić renderowanie snackbara po aktualizacji DOM
    setTimeout(() => {
      this._snackBar.openFromComponent(CustomSnackbarComponent, {
        data: { title, type },
        panelClass: 'custom-snackbar-container',
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }, 0);
  }

  openInfoDialog(data: InfoDialogData, config?: { disableClose?: boolean }) {
    return this._matDialog.open<InfoDialogComponent, InfoDialogData>(InfoDialogComponent, {
      data,
      autoFocus: false,
      disableClose: config?.disableClose ?? false,
    });
  }

  cleanUp() {
    this._sheet.dismiss();
    this._snackBar.dismiss();
    this._matDialog.closeAll();
  }
}
