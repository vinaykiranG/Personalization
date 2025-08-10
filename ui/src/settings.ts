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

/**
 * Manages user-specific UI personalization settings.
 */
export class SettingsManager {
  private properties: GoogleAppsScript.Properties.UserProperties;
  private FOLDER_NAME = 'ViGenAiR_UserData';

  constructor() {
    this.properties = PropertiesService.getUserProperties();
  }

  /**
   * Retrieves the user's UI settings.
   *
   * @returns {AppSettings} The user's settings.
   */
  getUserSettings(): AppSettings {
    const brandName = this.properties.getProperty('brandName') || '';
    const primaryColor = this.properties.getProperty('primaryColor') || '#000000';
    const logoFileId = this.properties.getProperty('logoFileId');
    let logoUrl = '';

    if (logoFileId) {
      try {
        const file = DriveApp.getFileById(logoFileId);
        const blob = file.getBlob();
        logoUrl =
          `data:${blob.getContentType()};base64,` +
          Utilities.base64Encode(blob.getBytes());
      } catch (e) {
        console.error(`Could not retrieve logo file with id ${logoFileId}: ${e}`);
      }
    }

    return { brandName, primaryColor, logoUrl };
  }

  /**
   * Saves the user's UI settings.
   *
   * @param {UserSettings} settings The settings to save.
   * @returns {AppSettings} The saved settings.
   */
  saveUserSettings(settings: UserSettings): AppSettings {
    this.properties.setProperty('brandName', settings.brandName);
    this.properties.setProperty('primaryColor', settings.primaryColor);

    if (settings.logoData) {
      const oldLogoFileId = this.properties.getProperty('logoFileId');
      if (oldLogoFileId) {
        try {
          DriveApp.getFileById(oldLogoFileId).setTrashed(true);
        } catch (e) {
          console.error(`Could not trash old logo file with id ${oldLogoFileId}: ${e}`);
        }
      }

      const [contentType, data] = settings.logoData.split(',');
      const blob = Utilities.newBlob(
        Utilities.base64Decode(data),
        contentType.replace('data:', '').replace(';base64', ''),
        'logo'
      );

      let folder = this.getOrCreateFolder();
      const file = folder.createFile(blob);
      this.properties.setProperty('logoFileId', file.getId());
    }

    return this.getUserSettings();
  }

  /**
   * Deletes all UI settings for the user.
   */
  deleteUserSettings() {
    const logoFileId = this.properties.getProperty('logoFileId');
    if (logoFileId) {
      try {
        DriveApp.getFileById(logoFileId).setTrashed(true);
      } catch (e) {
        console.error(`Could not trash logo file with id ${logoFileId}: ${e}`);
      }
    }
    this.properties.deleteAllProperties();
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
