# Deployment Guide

This guide provides step-by-step instructions for deploying the frontend and backend services.

## Prerequisites

1.  **Google Cloud SDK:** Make sure you have the `gcloud` CLI installed and authenticated. You can find instructions [here](https://cloud.google.com/sdk/docs/install).
2.  **gcloud Authentication:**
    ```bash
    gcloud auth login
    ```
3.  **Set your GCP Project ID:**
    ```bash
    gcloud config set project demos-dev-467317
    ```
4.  **Enable required APIs:**
    ```bash
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    gcloud services enable firestore.googleapis.com
    gcloud services enable storage.googleapis.com
    ```

## Backend Deployment (vigenair-backend)

The backend is a FastAPI application that will be deployed to Google Cloud Functions.

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

2.  **Deploy to Cloud Functions:**
    ```bash
    gcloud functions deploy vigenair-backend \
      --gen2 \
      --runtime python39 \
      --trigger-http \
      --allow-unauthenticated \
      --entry-point app \
      --source . \
      --region us-central1 \
      --set-env-vars PROJECT_ID=demos-dev-467317
    ```
    This command deploys the service to a 2nd Gen Cloud Function in the `us-central1` region and allows public access. The entry point is the `app` object in `main.py`.

    After the deployment is complete, the service will be available at the URL that is configured in the frontend code: `https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend`.

## Frontend Deployment

The frontend is an Angular application hosted on Google Apps Script. The `README.md` provides a simplified deployment process using `npm start`.

1.  **Navigate to the root of the repository:**
    ```bash
    cd ..
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the deployment script:**
    ```bash
    npm start
    ```
    This script will guide you through the deployment process for both the GCP components (the main `vigenair` service) and the UI. You should choose to deploy the UI.

    The script will output the URL of the deployed web app.

## Testing the API

Once the `vigenair-backend` service is deployed, you can test the API endpoints using `curl`.

The backend URL is `https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend`. Replace `[YOUR_USER_ID]` with a test user ID (e.g., `testuser@example.com`).

### Settings

*   **Get settings:**
    ```bash
    curl -H "X-User-Id: [YOUR_USER_ID]" https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings
    ```

*   **Update settings:**
    ```bash
    curl -X PUT -H "Content-Type: application/json" -H "X-User-Id: [YOUR_USER_ID]" -d '{"brandName": "My Brand", "logoUrl": "https://example.com/logo.png", "primaryColor": "#ff0000"}' https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings
    ```

### Saved Settings

*   **Get saved settings:**
    ```bash
    curl -H "X-User-Id: [YOUR_USER_ID]" https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings/saved
    ```

*   **Save a new setting:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "X-User-Id: [YOUR_USER_ID]" -d '{"brandName": "Saved Brand", "logoUrl": "https://example.com/saved.png", "primaryColor": "#00ff00"}' https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings/saved
    ```

*   **Get a specific saved setting (replace `[SETTING_ID]` with an actual ID from the previous command's response):**
    ```bash
    curl -H "X-User-Id: [YOUR_USER_ID]" https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings/saved/[SETTING_ID]
    ```

*   **Update a saved setting (replace `[SETTING_ID]` with an actual ID):**
    ```bash
    curl -X PUT -H "Content-Type: application/json" -H "X-User-Id: [YOUR_USER_ID]" -d '{"brandName": "Updated Brand", "logoUrl": "https://example.com/updated.png", "primaryColor": "#0000ff"}' https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings/saved/[SETTING_ID]
    ```

*   **Delete a saved setting (replace `[SETTING_ID]` with an actual ID):**
    ```bash
    curl -X DELETE -H "X-User-Id: [YOUR_USER_ID]" https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings/saved/[SETTING_ID]
    ```

### Logo Upload

*   **Upload a logo (replace `[FILE_PATH]` with the path to a logo file, e.g., `~/logo.png`):**
    ```bash
    curl -X POST -H "X-User-Id: [YOUR_USER_ID]" -F "file=@[FILE_PATH]" https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend/api/settings/logo
    ```
