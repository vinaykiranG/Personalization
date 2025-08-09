import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface AppSettings {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  logoFile?: File;
}

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private apiBase = '/api'; // Adjust if needed
  private staticUserId = 'user123';
  // Subject to broadcast settings changes
  public settingsChanged$ = new Subject<AppSettings>();

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    return { headers: { 'X-User-Id': this.staticUserId } };
  }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.apiBase}/settings/${this.staticUserId}`, this.getAuthHeaders());
  }

  updateSettings(settings: AppSettings): Observable<any> {
    const { brandName, primaryColor, logoUrl } = settings;
    const payload = { brandName, primaryColor, logoUrl };

    return new Observable(observer => {
      this.http.put(`${this.apiBase}/settings/${this.staticUserId}`, payload, this.getAuthHeaders()).subscribe({
        next: (res: any) => {
          this.settingsChanged$.next(settings);
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  getSavedSettings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/saved-settings/${this.staticUserId}`, this.getAuthHeaders());
  }

  saveSetting(settings: AppSettings): Observable<any> {
    return this.http.post(`${this.apiBase}/saved-settings/${this.staticUserId}`, settings, this.getAuthHeaders());
  }

  deleteSavedSetting(settingId: string): Observable<any> {
    return this.http.delete(`${this.apiBase}/saved-settings/${this.staticUserId}/${settingId}`, this.getAuthHeaders());
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(`${this.apiBase}/upload-logo/${this.staticUserId}`, formData, this.getAuthHeaders());
  }
}
