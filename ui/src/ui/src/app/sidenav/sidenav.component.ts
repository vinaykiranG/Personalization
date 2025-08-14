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
import { AppSettingsService } from '../services/app-settings.service';
import { SettingsListComponent } from '../settings-list/settings-list.component';

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
    SettingsListComponent,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit {
  currentBrandName = '';
  currentLogo = '';
  currentPrimaryColor = '#3f51b5';

  @ViewChild('settingsSidenav') settingsSidenav!: MatSidenav;

  constructor(private appSettingsService: AppSettingsService) {}

  ngOnInit() {
    this.loadPersonalizationSettings();
    this.appSettingsService.appliedSetting$.subscribe(setting => {
      if (setting) {
        this.currentBrandName = setting.name;
        this.currentLogo = setting.logo;
        this.currentPrimaryColor = setting.color;
        this.applyDynamicTheme();
      }
    });
  }

  toggleSettingsSidenav() {
    this.settingsSidenav.toggle();
  }

  loadPersonalizationSettings() {
    this.appSettingsService.getSettings();
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