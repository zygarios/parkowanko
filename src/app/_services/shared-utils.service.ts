import { inject, Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  InfoDialogComponent,
  InfoDialogData,
} from '../_components/info-dialog/info-dialog.component';
import {
  MenuSheetComponent,
  MenuSheetItem,
} from '../_components/menu-sheet/menu-sheet.component';

@Injectable({
  providedIn: 'root',
})
export class SharedUtilsService {
  private _matDialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);
  private _sheet = inject(MatBottomSheet);

  openSheet(data: MenuSheetItem[]) {
    return this._sheet.open<MenuSheetComponent, MenuSheetItem[]>(
      MenuSheetComponent,
      {
        data,
        backdropClass: 'backdrop-invisible',
      },
    );
  }

  openSnackbar(title: string, type?: 'ERROR' | 'SUCCESS') {
    let snackbarClass = '';
    if (type === 'ERROR') snackbarClass = 'snackbar-error';
    else if (type === 'SUCCESS') snackbarClass = 'snackbar-success';

    this._snackBar.open(title, '', {
      panelClass: snackbarClass,
      verticalPosition: 'top',
    });
  }

  openDialog(data: InfoDialogData) {
    return this._matDialog.open<InfoDialogComponent, InfoDialogData>(
      InfoDialogComponent,
      {
        data,
      },
    );
  }
}
