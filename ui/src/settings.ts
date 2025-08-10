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

/**
 * @fileoverview This file contains the SettingsManager class for handling
 * user-specific UI personalization settings.
 */

import { UserSettings, AppSettings } from './ui/src/app/api-calls/api-calls.service.interface';

// Define a type for the stored settings to use internally.
type StoredSettings = {
  brandName: string;
  primaryColor: string;
  logoFileId: string | null;
};

/**
 * Manages user-specific UI personalization settings.
 */
export class SettingsManager {
  private properties: GoogleAppsScript.Properties.UserProperties;
  private FOLDER_NAME = 'ViGenAiR_UserData';
  private SETTINGS_KEY = 'personalizationSettings';

  constructor() {
    this.properties = PropertiesService.getUserProperties();
  }

  /**
   * Retrieves the user's UI settings.
   *
   * @returns {AppSettings} The user's settings.
   */
  getUserSettings(): AppSettings {
    const settingsString = this.properties.getProperty(this.SETTINGS_KEY);
    if (!settingsString) {
      return { brandName: '', primaryColor: '#000000', logoUrl: '' };
    }

    const storedSettings: StoredSettings = JSON.parse(settingsString);
    let logoUrl = '';

    if (storedSettings.logoFileId) {
      try {
        const file = DriveApp.getFileById(storedSettings.logoFileId);
        const blob = file.getBlob();
        logoUrl =
          `data:${blob.getContentType()};base64,` +
          Utilities.base64Encode(blob.getBytes());
      } catch (e) {
        console.error(`Could not retrieve logo file with id ${storedSettings.logoFileId}: ${e}`);
        // If file is not found, update the stored settings to remove the invalid ID
        storedSettings.logoFileId = null;
        this.properties.setProperty(this.SETTINGS_KEY, JSON.stringify(storedSettings));
      }
    }

    return {
        brandName: storedSettings.brandName,
        primaryColor: storedSettings.primaryColor,
        logoUrl: logoUrl
    };
  }

  /**
   * Saves the user's UI settings.
   *
   * @param {UserSettings} settings The settings to save.
   * @returns {AppSettings} The saved settings.
   */
  saveUserSettings(settings: UserSettings): AppSettings {
    // 1. Server-side validation
    if (typeof settings.brandName !== 'string' || settings.brandName.trim().length === 0) {
      throw new Error('Invalid brand name provided.');
    }
    if (typeof settings.primaryColor !== 'string' || !/^#([0-9A-F]{3}){1,2}$/i.test(settings.primaryColor)) {
      throw new Error('Invalid primary color provided.');
    }

    const settingsString = this.properties.getProperty(this.SETTINGS_KEY);
    const storedSettings: StoredSettings = settingsString
      ? JSON.parse(settingsString)
      : { brandName: '', primaryColor: '', logoFileId: null };

    // Update settings
    storedSettings.brandName = settings.brandName.trim();
    storedSettings.primaryColor = settings.primaryColor;

    if (settings.logoData) {
      // If there's new logo data, trash the old logo if it exists
      if (storedSettings.logoFileId) {
        try {
          DriveApp.getFileById(storedSettings.logoFileId).setTrashed(true);
        } catch (e) {
          console.error(`Could not trash old logo file with id ${storedSettings.logoFileId}: ${e}`);
        }
      }

      const [contentType, data] = settings.logoData.split(',');
      const blob = Utilities.newBlob(
        Utilities.base64Decode(data),
        contentType.replace('data:', '').replace(';base64', ''),
        'logo'
      );

      const folder = this.getOrCreateFolder();
      const file = folder.createFile(blob);
      storedSettings.logoFileId = file.getId();
    }

    this.properties.setProperty(this.SETTINGS_KEY, JSON.stringify(storedSettings));

    return this.getUserSettings();
  }

  /**
   * Deletes all UI settings for the user.
   */
  deleteUserSettings() {
    const settingsString = this.properties.getProperty(this.SETTINGS_KEY);
    if (settingsString) {
        const storedSettings: StoredSettings = JSON.parse(settingsString);
        if (storedSettings.logoFileId) {
            try {
                DriveApp.getFileById(storedSettings.logoFileId).setTrashed(true);
            } catch (e) {
                console.error(`Could not trash logo file with id ${storedSettings.logoFileId}: ${e}`);
            }
        }
    }
    this.properties.deleteProperty(this.SETTINGS_KEY);
  }

  /**
   * Retrieves or creates the dedicated folder in Google Drive for storing user data.
   *
   * @returns {GoogleAppsScript.Drive.Folder} The folder.
   */
  private getOrCreateFolder(): GoogleAppsScript.Drive.Folder {
    const folders = DriveApp.getFoldersByName(this.FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(this.FOLDER_NAME);
    }
  }
}
