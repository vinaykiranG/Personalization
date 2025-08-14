import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Setting } from '../../models/setting.model';
import { AppSettingsService } from '../../services/app-settings.service';
import { SettingsDialogComponent } from '../settings-dialog.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';


@Component({
  selector: 'app-settings-list',
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
  ],
  templateUrl: './saved-settings-dialog.component.html',
})
export class SavedSettingsDialogComponent implements OnInit {
  public settings$: Observable<Setting[]>;
  public displayedColumns: string[] = ['logo', 'name', 'color', 'status', 'actions'];

  constructor(
    public appSettingsService: AppSettingsService,
    private dialog: MatDialog
  ) {
    this.settings$ = this.appSettingsService.settings$;
  }

  ngOnInit(): void {
    this.appSettingsService.getSettings();
  }

  openSettingsDialog(setting?: Setting): void {
    const isEditMode = !!setting;

    const dialogRef = this.dialog.open<SettingsDialogComponent, Setting | undefined, Partial<Setting>>(
      SettingsDialogComponent,
      {
        width: '450px',
        data: setting,
        disableClose: true
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (isEditMode && setting) {
          const updatedSetting: Setting = { ...setting, ...result, isDeleted: false, isApplied: setting.isApplied, id: setting.id };
          this.appSettingsService.updateSetting(updatedSetting).subscribe();
        } else {
          this.appSettingsService.createSetting(result as Omit<Setting, 'id' | 'isApplied' | 'isDeleted'>).subscribe();
        }
      }
    });
  }

  onApply(settingId: string): void {
    this.appSettingsService.applySetting(settingId).subscribe();
  }

  onDelete(settingId: string): void {
    // Confirmation dialog is a good practice here
    if (confirm('Are you sure you want to delete this setting?')) {
      this.appSettingsService.deleteSetting(settingId).subscribe();
    }
  }
}
