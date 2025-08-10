import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AppSettings {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  logoFile?: File;
}

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private apiBase = 'http://localhost:8080'; // Adjust if needed
  private staticUserId = 'user123'; // Static user ID for now
  public settingsChanged$ = new Subject<AppSettings>();

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    // In a real app, you'd get a token from an auth service
    return { headers: { 'X-User-Id': this.staticUserId } };
  }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.apiBase}/ui_settings/get_settings/${this.staticUserId}`, this.getAuthHeaders());
  }

  getSavedSettings(): Observable<(AppSettings & { id: string })[]> {
    return this.http.get<(AppSettings & { id: string })[]>(`${this.apiBase}/ui_settings/get_all_settings/${this.staticUserId}`, this.getAuthHeaders());
  }

  deleteSavedSetting(settingId: string): Observable<any> {
    return this.http.delete(`${this.apiBase}/ui_settings/delete_setting/${this.staticUserId}/${settingId}`, this.getAuthHeaders());
  }

  updateSettings(settings: AppSettings): Observable<any> {
    const formData = new FormData();
    formData.append('brand_name', settings.brandName);
    formData.append('color', settings.primaryColor);
    formData.append('user_id', this.staticUserId);
    if (settings.logoFile) {
      formData.append('logo_file', settings.logoFile, settings.logoFile.name);
    }

    return this.http.post(`${this.apiBase}/ui_settings/update_settings`, formData, this.getAuthHeaders()).pipe(
      tap((updatedSettings: any) => {
        const newSettings: AppSettings = {
          brandName: updatedSettings.brand_name,
          logoUrl: updatedSettings.logo_url,
          primaryColor: updatedSettings.color,
        };
        this.settingsChanged$.next(newSettings);
      })
    );
  }
}
