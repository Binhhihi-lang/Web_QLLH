import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastMuc = 'success' | 'info' | 'warning' | 'danger';

@Injectable({ providedIn: 'root' })
export class AppToastService {
  private readonly snackBar = inject(MatSnackBar);

  hien(message: string, muc: ToastMuc = 'info'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: muc === 'danger' ? 7000 : 4500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`app-toast`, `app-toast-${muc}`],
    });
  }
}
