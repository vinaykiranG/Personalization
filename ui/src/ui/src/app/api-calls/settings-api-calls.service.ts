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

import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AppSettings,
  SettingsApi,
  UserSettings,
} from './api-calls.service.interface';

/**
 * Service to manage API calls related to user settings.
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsApiCallService implements SettingsApi {
  constructor(private ngZone: NgZone) {}

  /**
   * Fetches user settings from the backend.
   * @returns An observable of the user's application settings.
   */
  getUserSettings(): Observable<AppSettings> {
    return new Observable<AppSettings>(subscriber => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      google.script.run
        .withSuccessHandler((appSettings: AppSettings) => {
          this.ngZone.run(() => {
            subscriber.next(appSettings);
            subscriber.complete();
          });
        })
        .withFailureHandler((error: Error) => {
          console.error('Could not retrieve user settings! Error: ', error);
          subscriber.error(error);
        })
        .getUserSettings();
    });
  }

  /**
   * Saves user settings to the backend.
   * @param settings - The user settings to save.
   * @returns An observable of the saved application settings.
   */
  saveUserSettings(settings: UserSettings): Observable<AppSettings> {
    return new Observable<AppSettings>(subscriber => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      google.script.run
        .withSuccessHandler((appSettings: AppSettings) => {
          this.ngZone.run(() => {
            subscriber.next(appSettings);
            subscriber.complete();
          });
        })
        .withFailureHandler((error: Error) => {
          console.error('Could not save user settings! Error: ', error);
          subscriber.error(error);
        })
        .saveUserSettings(settings);
    });
  }

  /**
   * Deletes user settings from the backend.
   * @returns An observable that completes when the operation is finished.
   */
  deleteUserSettings(): Observable<void> {
    return new Observable<void>(subscriber => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      google.script.run
        .withSuccessHandler(() => {
          this.ngZone.run(() => {
            subscriber.next();
            subscriber.complete();
          });
        })
        .withFailureHandler((error: Error) => {
          console.error('Could not delete user settings! Error: ', error);
          subscriber.error(error);
        })
        .deleteUserSettings();
    });
  }
}
