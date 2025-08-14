import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Setting } from '../models/setting.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent implements OnInit {
  public form: FormGroup;
  public isEditMode: boolean;
  public title: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Setting | undefined
  ) {
    this.isEditMode = !!data;
    this.title = this.isEditMode ? 'Edit Setting' : 'Create New Setting';

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      logo: ['', [Validators.required]], // Add URL validator if needed
      color: ['#000000', [Validators.required, Validators.pattern(/^#[0-9A-F]{6}$/i)]]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data) {
      this.form.patchValue(this.data);
    }
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}