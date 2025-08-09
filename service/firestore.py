# Copyright 2024 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import firestore
from datetime import datetime
import uuid

def get_user_settings(user_id: str):
    db = firestore.Client()
    settings_ref = db.collection('users').document(user_id).collection('settings').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(1)
    docs = settings_ref.stream()
    for doc in docs:
        return doc.to_dict()
    return None

def set_user_settings(user_id: str, settings: dict):
    db = firestore.Client()
    setting_id = str(uuid.uuid4())
    settings['createdAt'] = datetime.utcnow()
    db.collection('users').document(user_id).collection('settings').document(setting_id).set(settings)

def get_saved_settings(user_id: str):
    db = firestore.Client()
    settings_ref = db.collection('users').document(user_id).collection('settings').order_by('createdAt', direction=firestore.Query.DESCENDING)
    docs = settings_ref.stream()
    saved_settings = []
    for doc in docs:
        setting = doc.to_dict()
        setting['id'] = doc.id
        saved_settings.append(setting)
    return saved_settings

def save_setting(user_id: str, settings: dict):
    db = firestore.Client()
    setting_id = str(uuid.uuid4())
    settings['createdAt'] = datetime.utcnow()
    db.collection('users').document(user_id).collection('settings').document(setting_id).set(settings)
    return setting_id

def delete_saved_setting(user_id: str, setting_id: str):
    db = firestore.Client()
    db.collection('users').document(user_id).collection('settings').document(setting_id).delete()

def get_saved_setting_by_id(user_id: str, setting_id: str):
    db = firestore.Client()
    setting_ref = db.collection('users').document(user_id).collection('settings').document(setting_id)
    doc = setting_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None
