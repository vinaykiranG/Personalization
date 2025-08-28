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
    gcloud config set project [YOUR_PROJECT_ID]
    ```
    Replace `[YOUR_PROJECT_ID]` with your Google Cloud project ID.
4.  **Enable required APIs:**
    ```bash
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    gcloud services enable firestore.googleapis.com
    gcloud services enable storage.googleapis.com
    ```

## Backend Deployment (vigenair-backend)

The backend is a FastAPI application that will be deployed to Google Cloud Run.

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

2.  **Build the Docker image:**
    ```bash
    gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/vigenair-backend
    ```
    Replace `[YOUR_PROJECT_ID]` with your Google Cloud project ID. This command will build the Docker image using Cloud Build and push it to Google Container Registry.

3.  **Deploy to Cloud Run:**
    ```bash
    gcloud run deploy vigenair-backend \
      --image gcr.io/[YOUR_PROJECT_ID]/vigenair-backend \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated
    ```
    Replace `[YOUR_PROJECT_ID]` with your Google Cloud project ID. This command deploys the service to Cloud Run in the `us-central1` region and allows public access. You will be prompted to confirm the deployment.

    After the deployment is complete, you will get a service URL. It should be `https://vigenair-backend-....run.app`. The URL you provided (`https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend`) is for a Cloud Function, but we are deploying to Cloud Run. The code has been updated to use the URL you provided, but if you deploy to Cloud Run, the URL will be different. Please update the `apiBase` in `ui/src/ui/src/app/services/app-settings.service.ts` with the correct URL of your Cloud Run service.

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

Replace `[YOUR_BACKEND_URL]` with the URL of your deployed Cloud Run service (e.g., `https://us-central1-demos-dev-467317.cloudfunctions.net/vigenair-backend`). Replace `[YOUR_USER_ID]` with a test user ID (e.g., `testuser@example.com`).

### Settings

*   **Get settings:**
    ```bash
    curl -H "X-User-Id: [YOUR_USER_ID]" [YOUR_BACKEND_URL]/api/settings
    ```

*   **Update settings:**
    ```bash
    curl -X PUT -H "Content-Type: application/json" -H "X-User-Id: [YOUR_USER_ID]" -d '{"brandName": "My Brand", "logoUrl": "https://example.com/logo.png", "primaryColor": "#ff0000"}' [YOUR_BACKEND_URL]/api/settings
    ```

### Saved Settings

*   **Get saved settings:**
    ```bash
    curl -H "X-User-Id: [YOUR_USER_ID]" [YOUR_BACKEND_URL]/api/settings/saved
    ```

*   **Save a new setting:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "X-User-Id: [YOUR_USER_ID]" -d '{"brandName": "Saved Brand", "logoUrl": "https://example.com/saved.png", "primaryColor": "#00ff00"}' [YOUR_BACKEND_URL]/api/settings/saved
    ```

*   **Get a specific saved setting (replace `[SETTING_ID]` with an actual ID from the previous command's response):**
    ```bash
    curl -H "X-User-Id: [YOUR_USER_ID]" [YOUR_BACKEND_URL]/api/settings/saved/[SETTING_ID]
    ```

*   **Update a saved setting (replace `[SETTING_ID]` with an actual ID):**
    ```bash
    curl -X PUT -H "Content-Type: application/json" -H "X-User-Id: [YOUR_USER_ID]" -d '{"brandName": "Updated Brand", "logoUrl": "https://example.com/updated.png", "primaryColor": "#0000ff"}' [YOUR_BACKEND_URL]/api/settings/saved/[SETTING_ID]
    ```

*   **Delete a saved setting (replace `[SETTING_ID]` with an actual ID):**
    ```bash
    curl -X DELETE -H "X-User-Id: [YOUR_USER_ID]" [YOUR_BACKEND_URL]/api/settings/saved/[SETTING_ID]
    ```

### Logo Upload

*   **Upload a logo (replace `[FILE_PATH]` with the path to a logo file, e.g., `~/logo.png`):**
    ```bash
    curl -X POST -H "X-User-Id: [YOUR_USER_ID]" -F "file=@/[FILE_PATH]" [YOUR_BACKEND_URL]/api/settings/logo
    ```
