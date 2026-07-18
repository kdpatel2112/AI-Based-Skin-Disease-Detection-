import pytest
from unittest.mock import MagicMock
from bson import ObjectId
import app.db.mongodb

class MockCursor:
    def __init__(self, items):
        self.items = items
        self.index = 0

    def sort(self, *args, **kwargs):
        # We can sort mock items if needed, but for testing we can return self
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index >= len(self.items):
            raise StopAsyncIteration
        item = self.items[self.index]
        self.index += 1
        return item


class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []

    async def find_one(self, filter, projection=None):
        for doc in self.data:
            if self._matches(doc, filter):
                return doc
        return None

    def find(self, filter=None, projection=None):
        filter = filter or {}
        matched = [doc for doc in self.data if self._matches(doc, filter)]
        return MockCursor(matched)

    async def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.data.append(doc)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def count_documents(self, filter):
        matched = [doc for doc in self.data if self._matches(doc, filter)]
        return len(matched)

    async def insert_many(self, docs):
        for doc in docs:
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self.data.append(doc)
        return len(docs)

    async def update_one(self, filter, update):
        matched = None
        for doc in self.data:
            if self._matches(doc, filter):
                matched = doc
                break
        if not matched:
            class UpdateResult:
                matched_count = 0
                modified_count = 0
            return UpdateResult()
        
        if "$set" in update:
            for k, v in update["$set"].items():
                matched[k] = v
        if "$addToSet" in update:
            for k, v in update["$addToSet"].items():
                if k not in matched:
                    matched[k] = []
                if v not in matched[k]:
                    matched[k].append(v)
        if "$pull" in update:
            for k, v in update["$pull"].items():
                if k in matched and v in matched[k]:
                    matched[k].remove(v)

        class UpdateResult:
            matched_count = 1
            modified_count = 1
        return UpdateResult()

    async def delete_many(self, filter):
        original_len = len(self.data)
        self.data = [doc for doc in self.data if not self._matches(doc, filter)]
        class DeleteResult:
            deleted_count = original_len - len(self.data)
        return DeleteResult()

    async def create_index(self, *args, **kwargs):
        return None

    def _matches(self, doc, filter):
        for k, v in filter.items():
            if k == "_id":
                if str(doc.get("_id")) != str(v):
                    return False
            elif k == "email" and isinstance(v, dict) and "$in" in v:
                if doc.get("email") not in v["$in"]:
                    return False
            elif k == "user_id":
                if str(doc.get("user_id")) != str(v):
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True


# Monkeypatch MongoDB collections inside app.db.mongodb
mock_users = MockCollection("users")
mock_predictions = MockCollection("predictions")
mock_reports = MockCollection("reports")
mock_doctors = MockCollection("doctors")
mock_hospitals = MockCollection("hospitals")
mock_feedback = MockCollection("feedback")
mock_notifications = MockCollection("notifications")

app.db.mongodb.users_collection = mock_users
app.db.mongodb.predictions_collection = mock_predictions
app.db.mongodb.reports_collection = mock_reports
app.db.mongodb.doctors_collection = mock_doctors
app.db.mongodb.hospitals_collection = mock_hospitals
app.db.mongodb.feedback_collection = mock_feedback
app.db.mongodb.notifications_collection = mock_notifications

# Seed sample data in mock collections so search has content
mock_doctors.data = [
    {
        "_id": ObjectId(),
        "name": "Dr. Ramesh Sharma",
        "specialty": "Dermatologist",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777
    }
]
mock_hospitals.data = [
    {
        "_id": ObjectId(),
        "name": "Mumbai Skin & Laser Center",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777
    }
]
