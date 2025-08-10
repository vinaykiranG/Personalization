/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import {
  AppSettings,
  SettingsApi,
  UserSettings,
} from './api-calls.service.interface';
import { ScriptRunService } from './script-run.service';

/**
 * Service to manage API calls related to user settings.
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsApiCallService implements SettingsApi {
  constructor(private scriptRunService: ScriptRunService) {}

  /**
   * Fetches user settings from the backend.
   * @returns An observable of the user's application settings.
   */
  getUserSettings(): Observable<AppSettings> {
    return from(
      new Promise<AppSettings>(resolve => {
        this.scriptRunService
          .run<AppSettings>('getUserSettings')
          .then(result => resolve(result));
      })
    );
  }

  /**
   * Saves user settings to the backend.
   * @param settings - The user settings to save.
   * @returns An observable of the saved application settings.
   */
  saveUserSettings(settings: UserSettings): Observable<AppSettings> {
    return from(
      new Promise<AppSettings>(resolve => {
        this.scriptRunService
          .run<AppSettings>('saveUserSettings', settings)
          .then(result => resolve(result));
      })
    );
  }

  /**
   * Deletes user settings from the backend.
   * @returns An observable that completes when the operation is finished.
   */
  deleteUserSettings(): Observable<void> {
    return from(
      new Promise<void>(resolve => {
        this.scriptRunService
          .run<void>('deleteUserSettings')
          .then(() => resolve());
      })
    );
  }
}
