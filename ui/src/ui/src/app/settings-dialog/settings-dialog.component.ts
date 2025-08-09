import { Component, OnInit } from '@angular/core';
import { AppSettingsService, AppSettings } from '../services/app-settings.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SavedSettingsDialogComponent } from './saved-settings-dialog/saved-settings-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

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
  settings: AppSettings = { brandName: '', logoUrl: '', primaryColor: '' };
  loading = false;
  error = '';
  logoPreview: string = '';
  brandName: string = '';
  primaryColor: string = '#1976d2';

  constructor(private appSettingsService: AppSettingsService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadSettings();
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

  saveSettings() {
    this.loading = true;
    const settingsToSave: AppSettings = {
      brandName: this.brandName,
      primaryColor: this.primaryColor,
      logoUrl: this.settings.logoUrl,
      logoFile: this.selectedLogoFile ?? undefined,
    };

    this.appSettingsService.updateSettings(settingsToSave).subscribe({
      next: () => {
        this.loading = false;
        this.selectedLogoFile = null; // Reset after save
      },
      error: () => {
        this.error = 'Failed to save settings';
        this.loading = false;
      },
    });
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