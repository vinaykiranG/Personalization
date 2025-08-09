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
  private apiBase = '/api/ui_settings'; // Adjusted to new prefix
  private staticUserId = 'user123'; // Static user ID for now
  public settingsChanged$ = new Subject<AppSettings>();

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    // In a real app, you'd get a token from an auth service
    return { headers: { 'X-User-Id': this.staticUserId } };
  }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.apiBase}/get_settings/${this.staticUserId}`, this.getAuthHeaders());
  }

  updateSettings(settings: AppSettings): Observable<any> {
    const formData = new FormData();
    formData.append('brand_name', settings.brandName);
    formData.append('color', settings.primaryColor);
    formData.append('user_id', this.staticUserId);
    if (settings.logoFile) {
      formData.append('logo_file', settings.logoFile, settings.logoFile.name);
    }

    return this.http.post(`${this.apiBase}/update_settings`, formData, this.getAuthHeaders()).pipe(
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

  // The following methods are not part of the new requirements, but I will leave them for now.
  // I will remove them in a future step if they are not needed.

  getSavedSettings(): Observable<any[]> {
    // This endpoint is not defined in the new requirements, so I will leave it as is for now.
    return this.http.get<any[]>(`/api/saved-settings/${this.staticUserId}`, this.getAuthHeaders());
  }

  saveSetting(settings: AppSettings): Observable<any> {
    // This endpoint is not defined in the new requirements, so I will leave it as is for now.
    return this.http.post(`/api/saved-settings/${this.staticUserId}`, settings, this.getAuthHeaders());
  }

  deleteSavedSetting(settingId: string): Observable<any> {
    // This endpoint is not defined in the new requirements, so I will leave it as is for now.
    return this.http.delete(`/api/saved-settings/${this.staticUserId}/${settingId}`, this.getAuthHeaders());
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    // This endpoint is not defined in the new requirements, so I will leave it as is for now.
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(`/api/upload-logo/${this.staticUserId}`, formData, this.getAuthHeaders());
  }
}
