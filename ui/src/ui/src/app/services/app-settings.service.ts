import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AppSettings {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  description?: string;
  logoFile?: File;
}
 

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private apiBase = 'http://localhost:8000';
  private staticUserId = 'Google'; // Use as user ID, not brand name
  public settingsChanged$ = new Subject<AppSettings>();

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    return { 
      headers: new HttpHeaders({
        'X-User-Id': this.staticUserId  // Fix: Use X-User-Id instead
      })
    };
  }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(
      `${this.apiBase}/ui_settings/get_settings/${this.staticUserId}`, // Use staticUserId
      this.getAuthHeaders()
    );
  }

  getSavedSettings(): Observable<(AppSettings & { id: string; description?: string })[]> {
    return this.http.get<(AppSettings & { id: string; description?: string })[]>(
      `${this.apiBase}/ui_settings/get_all_settings/${this.staticUserId}`,
      this.getAuthHeaders()
    );
  }

  saveSetting(settings: AppSettings, logoUrl?: string): Observable<any> {
    const payload = {
      brandName: settings.brandName,
      primaryColor: settings.primaryColor,
      logoUrl: logoUrl || settings.logoUrl,
      description: settings.description || ''
    };
    return this.http.post(
      `${this.apiBase}/ui_settings/save_setting/${this.staticUserId}`,
      payload,
      this.getAuthHeaders()
    );
  }

  deleteSavedSetting(settingId: string): Observable<any> {
    return this.http.delete(
      `${this.apiBase}/ui_settings/delete_setting/${this.staticUserId}/${settingId}`, // Use staticUserId
      this.getAuthHeaders()
    );
  }

  updateSettings(settings: AppSettings): Observable<any> {
    const formData = new FormData();
    formData.append('brand_name', settings.brandName);
    formData.append('color', settings.primaryColor);
    if (settings.logoFile) {
      formData.append('logo_file', settings.logoFile, settings.logoFile.name);
    }

    return this.http.post(`${this.apiBase}`, formData, this.getAuthHeaders()).pipe(
      tap((updatedSettings: any) => {
        const newSettings: AppSettings = {
          brandName: updatedSettings.brandName,
          logoUrl: updatedSettings.logoUrl,
          primaryColor: updatedSettings.primaryColor,
        };
        this.settingsChanged$.next(newSettings);
      })
    );
  }

  updateSavedSetting(settingId: string, settings: AppSettings): Observable<any> {
    const updateData = {
      brandName: settings.brandName,
      primaryColor: settings.primaryColor,
      logoUrl: settings.logoUrl,
      description: settings.description || ''
    };
    return this.http.put(
      `${this.apiBase}/ui_settings/update_saved_setting/${this.staticUserId}/${settingId}`,
      updateData,
      this.getAuthHeaders()
    );
  }

  // Get specific saved setting
  getSavedSetting(settingId: string): Observable<AppSettings & { id: string }> {
    return this.http.get<AppSettings & { id: string }>(
      `${this.apiBase}/ui_settings/get_saved_setting/${this.staticUserId}/${settingId}`, 
      this.getAuthHeaders()
    );
  }
}
