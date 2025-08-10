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

def test_get_all_settings(client):
    # Mock the Firestore client's stream method
    mock_doc1 = MagicMock()
    mock_doc1.id = "setting1"
    mock_doc1.to_dict.return_value = {"brandName": "Brand 1", "logoUrl": "url1", "primaryColor": "#111"}

    mock_doc2 = MagicMock()
    mock_doc2.id = "setting2"
    mock_doc2.to_dict.return_value = {"brandName": "Brand 2", "logoUrl": "url2", "primaryColor": "#222"}

    mock_db_client.collection.return_value.stream.return_value = [mock_doc1, mock_doc2]

    # Make the request
    response = client.get("/ui_settings/get_all_settings/test_user")

    # Assert the response
    assert response.status_code == 200
    response_data = response.json()
    assert len(response_data) == 2
    assert response_data[0]['id'] == 'setting1'
    assert response_data[0]['brandName'] == 'Brand 1'
    assert response_data[1]['id'] == 'setting2'
    assert response_data[1]['brandName'] == 'Brand 2'

def test_delete_setting(client):
    # Make the request
    response = client.delete("/ui_settings/delete_setting/test_user/setting123")

    # Assert the response
    assert response.status_code == 204

    # Assert that Firestore's `delete` method was called
    mock_db_client.collection.assert_called_with("users/test_user/appSettings")
    mock_db_client.collection.return_value.document.assert_called_with("setting123")
    mock_db_client.collection.return_value.document.return_value.delete.assert_called_once()
