import { CommonModule } from '@angular/common';
import { AppSettingsService, AppSettings } from '../../services/app-settings.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsDialogComponent } from '../settings-dialog.component';
import { MatDividerModule } from '@angular/material/divider';

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
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './saved-settings-dialog.component.html',
  styleUrls: ['./saved-settings-dialog.component.css']
})
export class SavedSettingsDialogComponent implements OnInit {
  savedSettingsList: (AppSettings & { id: string })[] = [];
  dataSource = new MatTableDataSource(this.savedSettingsList);
  loading = false;
  displayedColumns: string[] = ['settings', 'actions'];

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SavedSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentSettings: any },
    private appSettingsService: AppSettingsService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadSavedSettingsList();
  }

  loadSavedSettingsList() {
    this.loading = true;
    this.appSettingsService.getSavedSettings().subscribe({
      next: (list) => {
        this.savedSettingsList = list;
        this.dataSource.data = this.savedSettingsList;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load saved settings', 'Close', { duration: 2000 });
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  createNewSetting() {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      width: '500px',
      data: { editMode: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.saved) {
        this.loadSavedSettingsList();
      }
    });
  }

  editSetting(setting: AppSettings & { id: string }) {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      width: '500px',
      data: {
        editMode: true,
        settingId: setting.id,
        prefilledData: setting
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.saved) {
        this.loadSavedSettingsList();
      }
    });
  }

  deleteSavedSetting(settingId: string) {
    if (confirm('Do you want to delete this setting?')) {
      this.appSettingsService.deleteSavedSetting(settingId).subscribe({
        next: () => {
          this.snackBar.open('Deleted saved setting!', 'Close', { duration: 2000 });
          this.loadSavedSettingsList();
        },
        error: () => {
          this.snackBar.open('Failed to delete setting', 'Close', { duration: 2000 });
        }
      });
    }
  }

  applySavedSetting(setting: AppSettings) {
    this.appSettingsService.updateSettings(setting).subscribe({
      next: () => {
        this.snackBar.open('Applied saved setting!', 'Close', {
          duration: 2000,
        });
        this.dialogRef.close({ applied: true, settings: setting });
      },
      error: () => {
        this.snackBar.open('Failed to apply setting', 'Close', {
          duration: 2000,
        });
      },
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
