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
 * user-specific UI personalization settings using Google Sheets as a database.
 */

import { UserSettings, AppSettings } from './ui/src/app/api-calls/api-calls.service.interface';

// Define a type for the stored settings to use internally.
// Using logo_file to match user's requested JSON structure.
type StoredSettings = {
  brand_name: string;
  color: string;
  logo_file: string | null; // This will store the Google Drive File ID
};

/**
 * Manages user-specific UI personalization settings using a Google Sheet as a database.
 */
export class SettingsManager {
  private FOLDER_NAME = 'ViGenAiR_UserData';
  private SPREADSHEET_NAME = 'Vigenair_User_Settings';
  private SHEET_NAME = 'Settings';
  private HEADER = ['user_email', 'settings_json'];

  /**
   * Retrieves the user's UI settings from a Google Sheet.
   *
   * @returns {AppSettings} The user's settings.
   */
  getUserSettings(): AppSettings {
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) {
      throw new Error('Could not identify user.');
    }

    const sheet = this.getOrCreateSettingsSheet();
    const data = sheet.getDataRange().getValues();
    const userRow = data.find(row => row[0] === userEmail);

    if (!userRow || !userRow[1]) {
      return { brandName: '', primaryColor: '#000000', logoUrl: '' };
    }

    const storedSettings: StoredSettings = JSON.parse(userRow[1]);
    let logoUrl = '';

    if (storedSettings.logo_file) {
      try {
        const file = DriveApp.getFileById(storedSettings.logo_file);
        logoUrl = `data:${file.getMimeType()};base64,${Utilities.base64Encode(file.getBlob().getBytes())}`;
      } catch (e) {
        console.error(`Could not retrieve logo file with id ${storedSettings.logo_file}: ${e}`);
      }
    }

    return {
      brandName: storedSettings.brand_name,
      primaryColor: storedSettings.color,
      logoUrl: logoUrl,
    };
  }

  /**
   * Saves the user's UI settings to a Google Sheet.
   *
   * @param {UserSettings} settings The settings to save.
   * @returns {AppSettings} The saved settings.
   */
  saveUserSettings(settings: UserSettings): AppSettings {
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) {
      throw new Error('Could not identify user.');
    }

    // Server-side validation
    if (typeof settings.brandName !== 'string' || settings.brandName.trim().length === 0) {
      throw new Error('Invalid brand name provided.');
    }
    if (typeof settings.primaryColor !== 'string' || !/^#([0-9A-F]{3}){1,2}$/i.test(settings.primaryColor)) {
      throw new Error('Invalid primary color provided.');
    }

    const sheet = this.getOrCreateSettingsSheet();
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(row => row[0] === userEmail);

    let storedSettings: StoredSettings;
    if (rowIndex > -1 && data[rowIndex][1]) {
        storedSettings = JSON.parse(data[rowIndex][1] as string);
    } else {
        storedSettings = { brand_name: '', color: '', logo_file: null };
    }

    // Update settings
    storedSettings.brand_name = settings.brandName.trim();
    storedSettings.color = settings.primaryColor;

    if (settings.logoData) {
      if (storedSettings.logo_file) {
        try {
          DriveApp.getFileById(storedSettings.logo_file).setTrashed(true);
        } catch (e) {
          console.error(`Could not trash old logo file with id ${storedSettings.logo_file}: ${e}`);
        }
      }

      const [contentType, Ldata] = settings.logoData.split(',');
      const blob = Utilities.newBlob(
        Utilities.base64Decode(Ldata),
        contentType.replace('data:', '').replace(';base64', ''),
        'logo'
      );
      const folder = this.getOrCreateFolder();
      const file = folder.createFile(blob);
      storedSettings.logo_file = file.getId();
    }

    const settingsString = JSON.stringify(storedSettings);

    if (rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 2).setValue(settingsString);
    } else {
      sheet.appendRow([userEmail, settingsString]);
    }

    return this.getUserSettings();
  }

  /**
   * Deletes all UI settings for the user from the Google Sheet.
   */
  deleteUserSettings() {
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) {
      throw new Error('Could not identify user.');
    }

    const sheet = this.getOrCreateSettingsSheet();
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(row => row[0] === userEmail);

    if (rowIndex > -1) {
      if (data[rowIndex][1]) {
        const storedSettings: StoredSettings = JSON.parse(data[rowIndex][1] as string);
        if (storedSettings.logo_file) {
          try {
            DriveApp.getFileById(storedSettings.logo_file).setTrashed(true);
          } catch (e) {
            console.error(`Could not trash logo file with id ${storedSettings.logo_file}: ${e}`);
          }
        }
      }
      sheet.deleteRow(rowIndex + 1);
    }
  }

  /**
   * Retrieves or creates the settings spreadsheet and sheet.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} The settings sheet.
   */
  private getOrCreateSettingsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const files = DriveApp.getFilesByName(this.SPREADSHEET_NAME);
    let spreadsheet;
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.openById(files.next().getId());
    } else {
      spreadsheet = SpreadsheetApp.create(this.SPREADSHEET_NAME);
    }

    let sheet = spreadsheet.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(this.SHEET_NAME);
      sheet.appendRow(this.HEADER);
    }

    return sheet;
  }

  /**
   * Retrieves or creates the dedicated folder in Google Drive for storing user data.
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
