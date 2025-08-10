import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SavedSettingsDialogComponent } from './saved-settings-dialog/saved-settings-dialog.component';
import { AppSettings, AppSettingsService } from '../services/app-settings.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCardModule,
    MatDialogModule,
    SavedSettingsDialogComponent,
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.css',
})
export class SettingsDialogComponent implements OnInit {
  brandName = '';
  logoPreview = '';
  primaryColor = '#3f51b5';
  currentBrandName = '';
  currentLogoUrl = '';
  currentPrimaryColor = '#3f51b5';
  selectedLogoFile: File | null = null;
  isLoading = false;

  @ViewChild('logoInput') logoInput!: ElementRef;

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SettingsDialogComponent>,
    private dialog: MatDialog,
    private appSettingsService: AppSettingsService
  ) {}

  ngOnInit() {
    this.loadPersonalizationSettings();
  }

  openSavedSettingsDialog() {
    this.dialog.open(SavedSettingsDialogComponent, {
      width: '600px',
    }).afterClosed().subscribe(result => {
      if (result?.applied && result.settings) {
        this.brandName = result.settings.brandName;
        this.logoPreview = result.settings.logoUrl;
        this.primaryColor = result.settings.primaryColor;
        // After applying a saved setting, we immediately save it as the current setting
        this.saveSettings();
      }
    });
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveSettings() {
    this.isLoading = true;
    const saveAppSettings = (logoUrl: string) => {
      const settings: AppSettings = {
        brandName: this.brandName,
        logoUrl: logoUrl,
        primaryColor: this.primaryColor,
      };

      this.appSettingsService.saveCurrentSettings(settings)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (updatedSettings) => {
            this.updateCurrentSettings(updatedSettings);
            this.snackBar.open('Settings saved successfully!', 'Close', { duration: 3000 });
            this.applyDynamicTheme();
            this.dialogRef.close({ updated: true });
          },
          error: (err) => {
            this.snackBar.open('Failed to save settings.', 'Close', { duration: 3000 });
            console.error(err);
          }
        });
    };

    if (this.selectedLogoFile) {
      this.appSettingsService.uploadLogo(this.selectedLogoFile).subscribe({
        next: (response) => {
          saveAppSettings(response.logoUrl);
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open('Failed to upload logo.', 'Close', { duration: 3000 });
          console.error(err);
        }
      });
    } else {
      saveAppSettings(this.currentLogoUrl);
    }
  }

  resetSettings() {
    this.isLoading = true;
    const defaultSettings: AppSettings = {
      brandName: 'Default Brand',
      logoUrl: '',
      primaryColor: '#3f51b5',
    };
    this.appSettingsService.saveCurrentSettings(defaultSettings)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedSettings) => {
          this.updateCurrentSettings(updatedSettings);
          this.snackBar.open('Settings reset to default!', 'Close', { duration: 3000 });
          this.applyDynamicTheme();
          this.dialogRef.close({ updated: true });
        },
        error: (err) => {
          this.snackBar.open('Failed to reset settings.', 'Close', { duration: 3000 });
        }
      });
  }

  loadPersonalizationSettings() {
    this.isLoading = true;
    this.appSettingsService.getSettings()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(settings => {
        this.updateCurrentSettings(settings);
        // Also populate the form fields
        this.brandName = settings.brandName;
        this.logoPreview = settings.logoUrl;
        this.primaryColor = settings.primaryColor;
        this.applyDynamicTheme();
      });
  }

  private updateCurrentSettings(settings: AppSettings) {
    this.currentBrandName = settings.brandName || 'Default Brand';
    this.currentLogoUrl = settings.logoUrl || '';
    this.currentPrimaryColor = settings.primaryColor || '#3f51b5';
  }

  applyDynamicTheme() {
    // This function remains the same as it manipulates the DOM directly.
    let styleElement = document.getElementById('dynamic-theme-styles') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'dynamic-theme-styles';
      document.head.appendChild(styleElement);
    }
    const color = this.currentPrimaryColor || '#3f51b5';
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    const rgb = hexToRgb(color);
    if (rgb) {
      styleElement.innerHTML = `
        :root {
          --primary-color: ${color};
          --primary-color-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
        }
        .mat-toolbar.mat-primary {
          background-color: ${color} !important;
        }
        .mat-button.mat-primary,
        .mat-icon-button.mat-primary,
        .mat-stroked-button.mat-primary {
          color: ${color} !important;
        }
        .mat-flat-button.mat-primary,
        .mat-raised-button.mat-primary,
        .mat-fab.mat-primary,
        .mat-mini-fab.mat-primary {
          background-color: ${color} !important;
        }
        .mat-stroked-button.mat-primary {
          border-color: ${color} !important;
        }
        .mat-form-field.mat-focused .mat-form-field-label {
          color: ${color} !important;
        }
        .mat-form-field.mat-focused .mat-form-field-ripple {
          background-color: ${color} !important;
        }
        .mat-checkbox-checked .mat-checkbox-background {
          background-color: ${color} !important;
        }
        .mat-button-toggle-checked {
          background-color: ${color} !important;
          color: #fff !important;
        }
      `;
    }
  }
}
