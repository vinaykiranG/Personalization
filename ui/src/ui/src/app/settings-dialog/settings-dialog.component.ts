import { Component, OnInit, Inject } from '@angular/core';
import { AppSettingsService, AppSettings } from '../services/app-settings.service';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SavedSettingsDialogComponent } from './saved-settings-dialog/saved-settings-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent implements OnInit {
  savedSettingsList: any[] = [];
  settings: AppSettings = { brandName: '', logoUrl: '', primaryColor: '', description: '' };
  loading = false;
  error = '';
  logoPreview: string = '';
  brandName: string = '';
  primaryColor: string = '#1976d2';
  description: string = '';

  // Edit mode properties
  editMode = false;
  settingId: string = '';

  constructor(
    private appSettingsService: AppSettingsService, 
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // ADD this
  ) {
    // ADD this edit mode check
    if (this.data?.editMode) {
      this.editMode = true;
      this.settingId = this.data.settingId;
      if (this.data.prefilledData) {
        this.prefillData(this.data.prefilledData);
      }
    }
  }

  ngOnInit() {
    this.loadSettings();
    this.appSettingsService.getSavedSettings().subscribe({
      next: (settings) => {
        this.savedSettingsList = settings;
      }
    });
  }

  loadSettings() {
    this.loading = true;
    this.appSettingsService.getSettings().subscribe({
      next: (settings: AppSettings) => {
        this.settings = settings;
        this.logoPreview = settings.logoUrl;
        this.brandName = settings.brandName;
        this.primaryColor = settings.primaryColor;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load settings';
        this.loading = false;
      }
    });
  }

  selectedLogoFile: File | null = null;

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  prefillData(data: any) {
    this.brandName = data.brandName;
    this.primaryColor = data.primaryColor;
    this.logoPreview = data.logoUrl;
    this.description = data.description || '';
    this.settings = {
      brandName: data.brandName,
      logoUrl: data.logoUrl,
      primaryColor: data.primaryColor,
      description: data.description || ''
    };
  }

  updateSavedSetting(settings: AppSettings) {
    // For edit mode, we need to update the specific saved setting
    this.appSettingsService.updateSavedSetting(this.settingId, settings).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Setting updated successfully!', 'Close', { duration: 2000 });
        this.dialogRef.close({ updated: true });
      },
      error: (error) => {
        console.error('Failed to update setting:', error);
        this.error = 'Failed to update setting';
        this.loading = false;
      }
    });
  }

  saveSettings() {
    this.loading = true;
    this.error = '';
    
    const settingsToSave: AppSettings = {
      brandName: this.brandName,
      primaryColor: this.primaryColor,
      logoUrl: this.settings.logoUrl,
      logoFile: this.selectedLogoFile ?? undefined,
      description: this.description
    };

    if (this.editMode) {
      // Update existing saved setting
      this.updateSavedSetting(settingsToSave);
    } else {
      // Save new setting with description
      this.appSettingsService.saveSetting(settingsToSave).subscribe({
        next: () => {
          this.loading = false;
          this.selectedLogoFile = null;
          this.snackBar.open('Settings saved successfully!', 'Close', { duration: 2000 });
          this.dialogRef.close({ created: true });
        },
        error: (error) => {
          console.error('Failed to save settings:', error);
          this.error = 'Failed to save settings';
          this.loading = false;
        },
      });
    }
  }

  openSavedSettingsDialog() {
    const dialogRef = this.dialog.open(SavedSettingsDialogComponent, {
      width: '500px',
      data: { currentSettings: this.settings }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.applied) {
        this.appSettingsService.settingsChanged$.next(result.settings);
        this.loadSettings();
      }
    });
  }

  resetSettings() {
    this.loadSettings();
  }

  // getUserId() removed, static userId is used in service
}