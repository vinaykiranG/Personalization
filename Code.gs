/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this script to only the current document containing the script.
 * This is a good security practice.
 */

// Global constant for the root folder in Google Drive
const LOGO_FOLDER_NAME = 'App Logos';

/**
 * Handles GET requests.
 * Routes requests based on the 'action' parameter.
 *
 * @param {object} e The event parameter for a web app script.
 * @return {ContentService.TextOutput} The JSON response.
 */
function doGet(e) {
  try {
    // Ensure user is authenticated for all GET requests
    getUserId();
    const action = e.parameter.action;

    if (!action) {
      // Default action: get the current user's settings
      return sendResponse(getSettings());
    }

    switch (action) {
      case 'getSaved':
        return sendResponse(getSavedSettings());
      default:
        return sendError('Invalid GET action.');
    }
  } catch (error) {
    return sendError('An error occurred: ' + error.message, 401);
  }
}

/**
 * Handles POST requests.
 * Routes requests based on the 'action' parameter.
 *
 * @param {object} e The event parameter for a web app script.
 * @return {ContentService.TextOutput} The JSON response.
 */
function doPost(e) {
  try {
     // Ensure user is authenticated for all POST requests
    getUserId();
    const action = e.parameter.action;

    // Handle file upload separately as its postData is not JSON
    if (action === 'uploadLogo') {
      return sendResponse(uploadLogo(e));
    }

    // For all other actions, parse the JSON payload
    const postData = JSON.parse(e.postData.contents);

    switch (action) {
      case 'updateSettings':
        return sendResponse(updateSettings(postData));
      case 'save':
        return sendResponse(saveSetting(postData));
      case 'delete':
        return sendResponse(deleteSetting(postData));
      default:
        return sendError('Invalid POST action.');
    }
  } catch (error) {
    return sendError('An error occurred: ' + error.message, 500);
  }
}

/**
 * Retrieves the current user's email.
 * Throws an error if the user is not logged in or doesn't have an email.
 * @return {string} The user's email.
 */
function getUserId() {
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    // This will be caught by the try-catch blocks in doGet/doPost
    throw new Error('User authentication failed. Please ensure you are logged in.');
  }
  return email;
}

/**
 * Creates and returns a standard JSON response.
 * @param {object} data The data payload to send.
 * @return {ContentService.TextOutput}
 */
function sendResponse(data) {
  const response = { status: 'success', data: data };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates and returns a standard JSON error response.
 * @param {string} message The error message.
 * @param {number} [statusCode=400] The HTTP status code to simulate.
 * @return {ContentService.TextOutput}
 */
function sendError(message, statusCode = 400) {
   // While Apps Script doesn't truly support status codes, this can be useful for the client.
  const response = { status: 'error', message: message, statusCode: statusCode };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Settings Functions ---

/**
 * Gets the current user's personalized settings from UserProperties.
 * @return {object} An object with brandName, primaryColor, and logoUrl.
 */
function getSettings() {
  const userProperties = PropertiesService.getUserProperties();
  const settings = userProperties.getProperties(['brandName', 'primaryColor', 'logoUrl']);

  // Provide default values if properties are not set
  settings.brandName = settings.brandName || 'Default Brand';
  settings.primaryColor = settings.primaryColor || '#2196F3'; // A default blue color
  settings.logoUrl = settings.logoUrl || '';

  return settings;
}

/**
 * Updates the user's brandName and primaryColor in UserProperties.
 * @param {object} data The data from the POST request, containing brandName and primaryColor.
 * @return {object} The updated settings.
 */
function updateSettings(data) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperties({
    'brandName': data.brandName,
    'primaryColor': data.primaryColor
  });
  return getSettings();
}

// --- Saved Settings List Functions ---

/**
 * Gets the list of saved settings for the user from UserProperties.
 * @return {Array} The array of saved settings.
 */
function getSavedSettings() {
  const userProperties = PropertiesService.getUserProperties();
  const savedSettingsJson = userProperties.getProperty('savedSettings');
  // If no settings are saved, return an empty array
  return savedSettingsJson ? JSON.parse(savedSettingsJson) : [];
}

/**
 * Adds a new setting to the user's list of saved settings.
 * @param {object} settingToSave The setting object to add to the list.
 * @return {Array} The updated list of saved settings.
 */
function saveSetting(settingToSave) {
  const savedSettings = getSavedSettings();
  savedSettings.push(settingToSave);

  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('savedSettings', JSON.stringify(savedSettings));

  return savedSettings;
}

/**
 * Deletes a saved setting from the list by its index.
 * @param {object} data The data from the POST request, containing the index to delete.
 * @return {Array} The updated list of saved settings.
 */
function deleteSetting(data) {
  const index = data.index;
  const savedSettings = getSavedSettings();

  if (index !== undefined && index >= 0 && index < savedSettings.length) {
    savedSettings.splice(index, 1);
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('savedSettings', JSON.stringify(savedSettings));
  } else {
    throw new Error('Invalid index provided for deletion.');
  }

  return savedSettings;
}

// --- Logo Upload Function ---

/**
 * Handles the logo file upload.
 * Saves the file to a structured folder in Google Drive and returns the public URL.
 * @param {object} e The POST request event object containing the file blob.
 * @return {object} An object containing the new logoUrl.
 */
function uploadLogo(e) {
  const userId = getUserId();
  const fileBlob = e.postData; // The entire postData is the blob for file uploads

  // 1. Get or create the root folder
  let rootFolder;
  const rootFolders = DriveApp.getFoldersByName(LOGO_FOLDER_NAME);
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(LOGO_FOLDER_NAME);
  }

  // 2. Get or create the user-specific subfolder
  let userFolder;
  const userFolders = rootFolder.getFoldersByName(userId);
  if (userFolders.hasNext()) {
    userFolder = userFolders.next();
     // Optional: Clean up old logos if necessary
  } else {
    userFolder = rootFolder.createFolder(userId);
  }

  // 3. Create the file from the blob
  const logoFile = userFolder.createFile(fileBlob);

  // 4. Set the file to be publicly accessible (anyone with the link can view)
  logoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 5. Construct a reliable, direct public URL
  const logoUrl = `https://drive.google.com/uc?export=view&id=${logoFile.getId()}`;

  // 6. Save the new URL to user properties
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('logoUrl', logoUrl);

  return { logoUrl: logoUrl };
}
