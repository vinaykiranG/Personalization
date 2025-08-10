/**
 * @OnlyCurrentDoc
 * This comment directs Apps Script to limit the scope of file access for this script.
 */

// Global constant for the root folder in Google Drive for logos
const LOGO_FOLDER_NAME = 'App Personalization Logos';

/**
 * Handles all POST requests for the web app.
 * Acts as a router to delegate tasks to specific helper functions based on an 'action' parameter.
 *
 * @param {object} e The event parameter from the POST request.
 * @return {ContentService.TextOutput} A JSON object representing the result of the operation.
 */
/**
 * Handles GET requests for read-only operations.
 * @param {object} e The event parameter from the GET request.
 * @return {ContentService.TextOutput} A JSON object with the requested data.
 */
function doGet(e) {
  try {
    const userId = Session.getActiveUser().getEmail();
    if (!userId) {
      throw new Error('Authentication failed. Please log in to continue.');
    }

    const action = e.parameter.action;
    let result;

    // Route GET requests based on the 'action' parameter.
    switch (action) {
      case 'getSaved':
        result = getSavedSettingsList();
        break;
      default:
        // Per requirements, no action specified should get the current settings.
        result = loadSettings();
        break;
    }

    return sendResponse(result);

  } catch (error) {
    console.error('Error in doGet: ' + error.toString());
    return sendError('An unexpected error occurred: ' + error.message);
  }
}

/**
 * Handles all POST requests for the web app.
 * Acts as a router to delegate tasks to specific helper functions based on an 'action' parameter.
 *
 * @param {object} e The event parameter from the POST request.
 * @return {ContentService.TextOutput} A JSON object representing the result of the operation.
 */
function doPost(e) {
  try {
    // All actions require an authenticated user.
    const userId = Session.getActiveUser().getEmail();
    if (!userId) {
      throw new Error('Authentication failed. Please log in to continue.');
    }

    const action = e.parameter.action;

    // The 'uploadLogo' action sends file data, not JSON, so it's handled separately.
    if (action === 'uploadLogo') {
      const result = uploadLogo(e.postData);
      return sendResponse(result);
    }

    // All other actions are expected to send a JSON payload.
    const postData = JSON.parse(e.postData.contents);
    let result;

    switch (action) {
      case 'updateSettings':
        result = saveSettings(postData.settings);
        break;
      case 'save':
        result = saveNewSetting(postData.setting);
        break;
      case 'delete':
        result = deleteSavedSetting(postData.index);
        break;
      default:
        // If the action is not recognized, return an error.
        return sendError('Invalid POST action specified.');
    }

    return sendResponse(result);

  } catch (error) {
    // Log any errors for debugging purposes and return a generic error message.
    console.error('Error in doPost: ' + error.toString());
    return sendError('An unexpected error occurred: ' + error.message);
  }
}

/**
 * Helper function to create a standardized JSON success response.
 * @param {object} data The data payload to be included in the response.
 * @return {ContentService.TextOutput} The JSON response object.
 */
function sendResponse(data) {
  const response = { status: 'success', data: data };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper function to create a standardized JSON error response.
 * @param {string} message The error message to be included in the response.
 * @return {ContentService.TextOutput} The JSON response object.
 */
function sendError(message) {
  const response = { status: 'error', message: message };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Helper Functions ---

/**
 * Retrieves the user's brandName, primaryColor, and logoUrl from PropertiesService.
 * Returns default values if properties do not exist.
 * @return {object} An object containing the user's settings.
 */
function loadSettings() {
  const userProperties = PropertiesService.getUserProperties();
  const settings = userProperties.getProperties(['brandName', 'primaryColor', 'logoUrl']);

  // Provide default values for a better user experience
  settings.brandName = settings.brandName || 'My Brand';
  settings.primaryColor = settings.primaryColor || '#3F51B5'; // Indigo color
  settings.logoUrl = settings.logoUrl || '';

  return settings;
}

/**
 * Takes a settings object and saves it to the user's PropertiesService.
 * @param {object} settings An object containing brandName and primaryColor.
 * @return {object} The newly saved settings.
 */
function saveSettings(settings) {
  if (!settings || !settings.brandName || !settings.primaryColor) {
    throw new Error('Invalid settings object provided.');
  }
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperties({
    'brandName': settings.brandName,
    'primaryColor': settings.primaryColor
  });
  // Return the full, current settings to confirm the save
  return loadSettings();
}

/**
 * Retrieves the list of saved settings from PropertiesService.
 * @return {Array} An array of saved setting objects.
 */
function getSavedSettingsList() {
  const userProperties = PropertiesService.getUserProperties();
  const json = userProperties.getProperty('savedSettingsList');
  return json ? JSON.parse(json) : [];
}

/**
 * (Private) Saves an array of settings to PropertiesService as a JSON string.
 * This is a helper function to avoid code duplication.
 * @param {Array} list The array of saved settings to store.
 */
function _saveSavedSettingsList(list) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('savedSettingsList', JSON.stringify(list));
}

/**
 * Adds a new setting object to the saved settings list in PropertiesService.
 * @param {object} setting The new setting object to add to the list.
 * @return {Array} The updated list of saved settings.
 */
function saveNewSetting(setting) {
  if (!setting || typeof setting !== 'object') {
    throw new Error('A valid setting object must be provided.');
  }
  const savedList = getSavedSettingsList();
  savedList.push(setting);
  _saveSavedSettingsList(savedList);
  return savedList;
}

/**
 * Deletes a setting from the saved list at a given index.
 * @param {number} index The index of the setting to delete.
 * @return {Array} The updated list of saved settings.
 */
function deleteSavedSetting(index) {
  const savedList = getSavedSettingsList();
  if (index === undefined || index < 0 || index >= savedList.length) {
    throw new Error('Invalid index provided for deletion.');
  }
  savedList.splice(index, 1);
  // Save the modified list back to properties
  _saveSavedSettingsList(savedList);
  return savedList;
}

/**
 * Handles logo uploads to Google Drive.
 * @param {object} fileData The file blob from the POST request.
 * @return {object} An object containing the public URL of the new logo.
 */
function uploadLogo(fileData) {
  const userId = Session.getActiveUser().getEmail();

  // 1. Get or create the root folder
  let rootFolder;
  const rootFolders = DriveApp.getFoldersByName(LOGO_FOLDER_NAME);
  rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(LOGO_FOLDER_NAME);

  // 2. Get or create the user-specific subfolder
  let userFolder;
  const userFolders = rootFolder.getFoldersByName(userId);
  userFolder = userFolders.hasNext() ? userFolders.next() : rootFolder.createFolder(userId);

  // 3. Save the file and make it public
  const logoFile = userFolder.createFile(fileData);
  logoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 4. Construct the public URL and save it to properties
  const logoUrl = `https://drive.google.com/uc?export=view&id=${logoFile.getId()}`;
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('logoUrl', logoUrl);

  return { logoUrl: logoUrl };
}
