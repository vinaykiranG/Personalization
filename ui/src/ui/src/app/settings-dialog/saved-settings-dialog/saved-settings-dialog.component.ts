import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppSettings, AppSettingsService } from '../services/app-settings.service';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-saved-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './saved-settings-dialog.component.html',
})
export class SavedSettingsDialogComponent implements OnInit {
  savedSettingsList: AppSettings[] = [];
  isLoading = false;

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SavedSettingsDialogComponent>,
    private appSettingsService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadSavedSettingsList();
  }

  loadSavedSettingsList() {
    this.isLoading = true;
    this.appSettingsService.getSavedSettings()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (settings) => {
          this.savedSettingsList = settings;
        },
        error: (err) => {
          this.snackBar.open('Failed to load saved settings.', 'Close', { duration: 3000 });
          console.error(err);
        }
      });
  }

  deleteSavedSetting(index: number) {
    this.isLoading = true;
    this.appSettingsService.deleteSavedSetting(index)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedList) => {
          this.savedSettingsList = updatedList;
          this.snackBar.open('Setting deleted.', 'Close', { duration: 2000 });
        },
        error: (err) => {
          this.snackBar.open('Failed to delete setting.', 'Close', { duration: 3000 });
          console.error(err);
        }
      });
  }

  applySavedSetting(index: number) {
    this.isLoading = true;
    const settingToApply = this.savedSettingsList[index];
    this.appSettingsService.saveCurrentSettings(settingToApply)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.snackBar.open('Applied saved setting!', 'Close', { duration: 2000 });
          this.dialogRef.close({ applied: true, settings: settingToApply });
        },
        error: (err) => {
          this.snackBar.open('Failed to apply setting.', 'Close', { duration: 3000 });
          console.error(err);
        }
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
