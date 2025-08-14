def get_firestore_client():
    try:
        project_id = os.getenv("PROJECT_ID")
        logger.info(f"Initializing Firestore client for project: {project_id}, database: {FIRESTORE_DATABASE_ID}")
        client = firestore.Client(project=project_id, database=FIRESTORE_DATABASE_ID)
        logger.info(f"Firestore client initialized successfully for project: {client.project}")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Firestore client in ui_settings_routes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Firestore: {e}")
