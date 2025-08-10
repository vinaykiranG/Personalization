import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppSettings, AppSettingsService } from '../services/app-settings.service';
import { finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit {
  // UI Personalization properties
  brandName = '';
  logoPreview = '';
  primaryColor = '#3f51b5';
  currentBrandName = '';
  currentLogoUrl = '';
  currentPrimaryColor = '#3f51b5';
  selectedLogoFile: File | null = null;

  showSavedSettingsModal = false;
  savedSettingsList: AppSettings[] = [];

  isLoading = false;

  @ViewChild('settingsSidenav') settingsSidenav!: MatSidenav;
  @ViewChild('logoInput') logoInput!: ElementRef;

  constructor(
    private snackBar: MatSnackBar,
    private appSettingsService: AppSettingsService,
  ) {}

  ngOnInit() {
    this.loadPersonalizationSettings();
    this.loadSavedSettingsList();
  }

  toggleSettingsSidenav() {
    this.settingsSidenav.toggle();
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
            this.settingsSidenav.close();
          },
          error: this.handleError('Failed to save settings.')
        });
    };

    if (this.selectedLogoFile) {
      this.appSettingsService.uploadLogo(this.selectedLogoFile).subscribe({
        next: (response) => saveAppSettings(response.logoUrl),
        error: this.handleError('Failed to upload logo.')
      });
    } else {
      saveAppSettings(this.currentLogoUrl);
    }
  }

  saveToList() {
    const settings: AppSettings = {
      brandName: this.brandName || this.currentBrandName,
      logoUrl: this.logoPreview || this.currentLogoUrl,
      primaryColor: this.primaryColor || this.currentPrimaryColor,
    };

    if (!settings.brandName) {
      this.snackBar.open('Brand name cannot be empty.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.appSettingsService.saveToSavedList(settings)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedList) => {
          this.savedSettingsList = updatedList;
          this.snackBar.open('Added to saved settings!', 'Close', { duration: 2000 });
        },
        error: this.handleError('Failed to save to list.')
      });
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
          this.settingsSidenav.close();
        },
        error: this.handleError('Failed to reset settings.')
      });
  }

  loadSavedSettingsList() {
    this.isLoading = true;
    this.appSettingsService.getSavedSettings()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (settings) => this.savedSettingsList = settings,
        error: this.handleError('Failed to load saved settings.')
      });
  }

  deleteSavedSetting(index: number) {
    this.isLoading = true;
    this.appSettingsService.deleteSavedSetting(index)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedList) => this.savedSettingsList = updatedList,
        error: this.handleError('Failed to delete setting.')
      });
  }

  applySavedSetting(index: number) {
    const setting = this.savedSettingsList[index];
    this.isLoading = true;
    this.appSettingsService.saveCurrentSettings(setting)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedSettings) => {
          this.updateCurrentSettings(updatedSettings);
          this.snackBar.open('Applied saved setting!', 'Close', { duration: 2000 });
          this.applyDynamicTheme();
        },
        error: this.handleError('Failed to apply setting.')
      });
  }

  loadPersonalizationSettings() {
    this.isLoading = true;
    this.appSettingsService.getSettings()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (settings) => {
          this.updateCurrentSettings(settings);
          this.brandName = settings.brandName;
          this.logoPreview = settings.logoUrl;
          this.primaryColor = settings.primaryColor;
          this.applyDynamicTheme();
        },
        error: this.handleError('Failed to load initial settings.')
      });
  }

  private updateCurrentSettings(settings: AppSettings) {
    this.currentBrandName = settings.brandName || 'Default Brand';
    this.currentLogoUrl = settings.logoUrl || '';
    this.currentPrimaryColor = settings.primaryColor || '#3f51b5';
  }

  private handleError(message: string) {
    return (error: any) => {
      this.isLoading = false;
      this.snackBar.open(message, 'Close', { duration: 3000 });
      console.error(error);
    };
  }

  applyDynamicTheme() {
    // This is the method responsible for changing the UI colors
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