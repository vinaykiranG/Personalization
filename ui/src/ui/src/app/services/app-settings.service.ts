// src/app/services/app-settings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppSettings {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
}

// Interface for the standard GAS response wrapper
export interface GasResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private gasApiUrl = 'YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<AppSettings> {
    return this.http.get<GasResponse<AppSettings>>(this.gasApiUrl).pipe(
      map(response => response.data)
    );
  }

  getSavedSettings(): Observable<AppSettings[]> {
    return this.http.get<GasResponse<AppSettings[]>>(`${this.gasApiUrl}?action=getSaved`).pipe(
      map(response => response.data)
    );
  }

  saveCurrentSettings(settings: AppSettings): Observable<AppSettings> {
    return this.http.post<GasResponse<AppSettings>>(`${this.gasApiUrl}?action=updateSettings`, { settings }).pipe(
      map(response => response.data)
    );
  }

  saveToSavedList(setting: AppSettings): Observable<AppSettings[]> {
    return this.http.post<GasResponse<AppSettings[]>>(`${this.gasApiUrl}?action=save`, { setting }).pipe(
      map(response => response.data)
    );
  }

  deleteSavedSetting(index: number): Observable<AppSettings[]> {
    return this.http.post<GasResponse<AppSettings[]>>(`${this.gasApiUrl}?action=delete`, { index }).pipe(
      map(response => response.data)
    );
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    // The GAS backend expects the raw file blob, not FormData.
    // The response is wrapped, so we need to map it.
    return this.http.post<GasResponse<{ logoUrl: string }>>(`${this.gasApiUrl}?action=uploadLogo`, file).pipe(
      map(response => response.data)
    );
  }
}
