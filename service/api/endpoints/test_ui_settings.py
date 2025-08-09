import sys
from unittest.mock import MagicMock, patch

# Mock the torch module before it's imported by other modules
sys.modules['torch'] = MagicMock()
sys.modules['torch.cuda'] = MagicMock()

import pytest
from fastapi.testclient import TestClient
from service.api.app import app

@pytest.fixture
def client():
    return TestClient(app)

from service.api.endpoints.ui_settings import get_firestore_client

# Mock the firestore client
mock_db_client = MagicMock()

def mock_get_firestore_client():
    return mock_db_client

app.dependency_overrides[get_firestore_client] = mock_get_firestore_client


def test_update_app_settings(client):
    # Prepare form data
    form_data = {
        "brand_name": "Test Brand",
        "color": "#123456",
        "user_id": "test_user"
    }

    # Make the request
    response = client.post("/ui_settings/update_settings", data=form_data)

    # Assert the response
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["message"] == "Settings updated successfully"
    assert response_data["brand_name"] == "Test Brand"
    assert response_data["color"] == "#123456"
    assert response_data["user_id"] == "test_user"

    # Assert that Firestore's `set` method was called with the correct data
    mock_db_client.collection.assert_called_with("users/test_user/appSettings")
    mock_db_client.collection.return_value.document.assert_called_with("branding_profile")
    mock_db_client.collection.return_value.document.return_value.set.assert_called_once()

    # Check the data that was passed to set
    call_args, call_kwargs = mock_db_client.collection.return_value.document.return_value.set.call_args
    assert call_args[0]['brandName'] == 'Test Brand'
    assert call_args[0]['primaryColor'] == '#123456'
    assert 'last_updated' in call_args[0]
