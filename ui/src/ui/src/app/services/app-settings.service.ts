import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Setting } from '../models/setting.model';

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  // Base URL for the backend API. Adjust as needed.
  private readonly apiUrl = '/api/settings';

  // Private BehaviorSubject to hold the state.
  private readonly _settings = new BehaviorSubject<Setting[]>([]);

  // Public observable that components can subscribe to.
  public readonly settings$ = this._settings.asObservable();

  public readonly appliedSetting$ = this.settings$.pipe(
    map(settings => settings.find(s => s.isApplied))
  );

  constructor(private http: HttpClient) {}

  /**
   * Fetches all non-deleted settings from the backend and updates the state.
   */
  getSettings(): void {
    this.http.get<Setting[]>(this.apiUrl).pipe(
      tap(settings => this._settings.next(settings)),
      catchError(this.handleError)
    ).subscribe();
  }

  /**
   * Creates a new setting.
   * @param settingData The data for the new setting.
   * @returns An observable of the newly created setting.
   */
  createSetting(settingData: Omit<Setting, 'id' | 'isApplied' | 'isDeleted'>): Observable<Setting> {
    return this.http.post<Setting>(this.apiUrl, settingData).pipe(
      tap(newSetting => {
        const currentState = this._settings.getValue();
        this._settings.next([...currentState, newSetting]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Updates an existing setting.
   * @param setting The setting object with updated values.
   * @returns An observable of the updated setting.
   */
  updateSetting(setting: Setting): Observable<Setting> {
    return this.http.put<Setting>(`${this.apiUrl}/${setting.id}`, setting).pipe(
      tap(updatedSetting => {
        const currentState = this._settings.getValue();
        const updatedSettings = currentState.map(s => s.id === updatedSetting.id ? updatedSetting : s);
        this._settings.next(updatedSettings);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Applies a specific setting, making it the active one.
   * @param settingId The ID of the setting to apply.
   * @returns An observable of the updated state of all settings.
   */
  applySetting(settingId: string): Observable<Setting[]> {
    return this.http.put<Setting[]>(`${this.apiUrl}/${settingId}`, { isApplied: true }).pipe(
      tap(allSettings => {
        // The backend should return the full updated list after applying.
        this._settings.next(allSettings);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Performs a soft delete on a setting.
   * @param settingId The ID of the setting to delete.
   * @returns An observable that completes on success.
   */
  deleteSetting(settingId: string): Observable<void> {
    // Optimistic UI update
    const currentState = this._settings.getValue();
    const updatedSettings = currentState.filter(s => s.id !== settingId);
    this._settings.next(updatedSettings);

    return this.http.put<void>(`${this.apiUrl}/${settingId}`, { isDeleted: true }).pipe(
      catchError(err => {
        // Revert state on error
        this._settings.next(currentState);
        return this.handleError(err);
      })
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred in AppSettingsService:', error);
    // In a real app, you might use a more sophisticated error handling strategy
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
