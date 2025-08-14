from google.cloud import firestore
import os

os.environ['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8181'
os.environ['PROJECT_ID'] = 'demos-dev-467317'

db = firestore.Client(project=os.environ['PROJECT_ID'])

# Add a sample saved setting under /Settings/Google/saved_settings/
doc_ref = db.collection('Settings').document('Google').collection('saved_settings').document()
doc_ref.set({
    'brandName': 'Test Brand',
    'logoUrl': 'https://example.com/logo.png',
    'primaryColor': '#123456',
    'description': 'Seeded test description'
})

print("Seeded Firestore emulator with a sample saved setting.")