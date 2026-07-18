"""
MongoDB Atlas connection using Motor (async driver) with transparent local JSON database fallback.
"""
import os
import json
import re
import copy
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import pymongo
from pymongo.errors import ServerSelectionTimeoutError

from app.core.config import settings


class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if hasattr(obj, "isoformat"):
            return obj.isoformat()
        return super().default(obj)


def match_document(doc, filter_dict):
    if not filter_dict:
        return True
    for k, v in filter_dict.items():
        doc_val = doc.get(k)
        if k == "_id":
            if str(doc_val) != str(v):
                return False
            continue
        
        if isinstance(v, dict):
            matched_op = True
            for op, op_val in v.items():
                if op == "$in":
                    if doc_val not in op_val:
                        matched_op = False
                        break
                elif op == "$regex":
                    options = v.get("$options", "")
                    flags = 0
                    if "i" in options:
                        flags |= re.IGNORECASE
                    try:
                        pattern = re.compile(op_val, flags)
                        if not pattern.search(str(doc_val or "")):
                            matched_op = False
                            break
                    except Exception:
                        matched_op = False
                        break
            if not matched_op:
                return False
        else:
            if doc_val != v:
                return False
    return True


def update_document(doc, update_dict):
    if "$set" in update_dict:
        for k, v in update_dict["$set"].items():
            doc[k] = v
    if "$addToSet" in update_dict:
        for k, v in update_dict["$addToSet"].items():
            if k not in doc:
                doc[k] = []
            if not isinstance(doc[k], list):
                doc[k] = [doc[k]]
            if v not in doc[k]:
                doc[k].append(v)
    if "$pull" in update_dict:
        for k, v in update_dict["$pull"].items():
            if k in doc and isinstance(doc[k], list):
                if v in doc[k]:
                    doc[k].remove(v)


class MockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def sort(self, key, direction=1):
        reverse = (direction == -1)
        self.data = sorted(self.data, key=lambda x: x.get(key, ""), reverse=reverse)
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index >= len(self.data):
            raise StopAsyncIteration
        item = self.data[self.index]
        self.index += 1
        return item


class LocalJSONCollection:
    def __init__(self, name: str):
        self.name = name
        self.file_path = Path(__file__).resolve().parent / "mock_data" / f"{name}.json"
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self.data = []
        self._load_data()

    def _load_data(self):
        if self.file_path.exists():
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                self.data = []
                for doc in raw_data:
                    if "_id" in doc:
                        try:
                            doc["_id"] = ObjectId(doc["_id"])
                        except Exception:
                            pass
                    self.data.append(doc)
            except Exception as e:
                print(f"Error loading mock database for {self.name}: {e}")
                self.data = []
        else:
            self.data = []

    def _save_data(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, cls=JSONEncoder)
        except Exception as e:
            print(f"Error saving mock database for {self.name}: {e}")

    async def find_one(self, filter, projection=None):
        self._load_data()
        for doc in self.data:
            if match_document(doc, filter):
                return copy.deepcopy(doc)
        return None

    def find(self, filter=None, projection=None):
        self._load_data()
        filter = filter or {}
        matched = []
        for doc in self.data:
            if match_document(doc, filter):
                matched.append(copy.deepcopy(doc))
        return MockCursor(matched)

    async def insert_one(self, document):
        self._load_data()
        if "_id" not in document:
            document["_id"] = ObjectId()
        self.data.append(document)
        self._save_data()

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(document["_id"])

    async def insert_many(self, documents):
        self._load_data()
        inserted_ids = []
        for doc in documents:
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self.data.append(doc)
            inserted_ids.append(doc["_id"])
        self._save_data()

        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult(inserted_ids)

    async def update_one(self, filter, update):
        self._load_data()
        matched_count = 0
        modified_count = 0
        for doc in self.data:
            if match_document(doc, filter):
                matched_count = 1
                update_document(doc, update)
                modified_count = 1
                break
        if matched_count > 0:
            self._save_data()

        class UpdateResult:
            def __init__(self, matched_count, modified_count):
                self.matched_count = matched_count
                self.modified_count = modified_count
        return UpdateResult(matched_count, modified_count)

    async def delete_many(self, filter):
        self._load_data()
        original_len = len(self.data)
        self.data = [doc for doc in self.data if not match_document(doc, filter)]
        deleted_count = original_len - len(self.data)
        if deleted_count > 0:
            self._save_data()

        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted_count)

    async def count_documents(self, filter):
        self._load_data()
        count = 0
        for doc in self.data:
            if match_document(doc, filter):
                count += 1
        return count

    async def create_index(self, keys, **kwargs):
        return None


# Determine if we should fallback to the mock database
use_mock_db = False
try:
    # Quick connectivity test
    sync_client = pymongo.MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=1500)
    sync_client.admin.command('ping')
    print("Database connection verified successfully. Using MongoDB.")
except (ServerSelectionTimeoutError, Exception) as e:
    print("\n" + "=" * 60)
    print("DATABASE CONNECTION FAIL: Local/Atlas MongoDB is unreachable.")
    print("SWITCHING TO BACKEND LOCAL JSON DATABASE FALLBACK.")
    print("All registration, dashboards, and favorites will work via local files.")
    print("=" * 60 + "\n")
    use_mock_db = True


if use_mock_db:
    users_collection = LocalJSONCollection("users")
    predictions_collection = LocalJSONCollection("predictions")
    reports_collection = LocalJSONCollection("reports")
    doctors_collection = LocalJSONCollection("doctors")
    hospitals_collection = LocalJSONCollection("hospitals")
    feedback_collection = LocalJSONCollection("feedback")
    notifications_collection = LocalJSONCollection("notifications")
else:
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    # Collections
    users_collection = db["users"]
    predictions_collection = db["predictions"]
    reports_collection = db["reports"]
    doctors_collection = db["doctors"]
    hospitals_collection = db["hospitals"]
    feedback_collection = db["feedback"]
    notifications_collection = db["notifications"]


async def seed_database() -> None:
    """Populates MongoDB with sample doctors and hospitals from static file if empty."""
    doc_count = await doctors_collection.count_documents({})
    if doc_count == 0:
        path = Path(__file__).resolve().parent.parent / "data" / "doctors_hospitals_india.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data.get("doctors"):
                    for d in data["doctors"]:
                        d["latitude"] = float(d["latitude"])
                        d["longitude"] = float(d["longitude"])
                    await doctors_collection.insert_many(data["doctors"])
                    print("Seeded doctors database in MongoDB.")
            except Exception as e:
                print(f"Error seeding doctors database: {e}")

    hos_count = await hospitals_collection.count_documents({})
    if hos_count == 0:
        path = Path(__file__).resolve().parent.parent / "data" / "doctors_hospitals_india.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data.get("hospitals"):
                    for h in data["hospitals"]:
                        h["latitude"] = float(h["latitude"])
                        h["longitude"] = float(h["longitude"])
                    await hospitals_collection.insert_many(data["hospitals"])
                    print("Seeded hospitals database in MongoDB.")
            except Exception as e:
                print(f"Error seeding hospitals database: {e}")


async def init_indexes() -> None:
    """Create indexes needed for performance and uniqueness. Call on startup."""
    await users_collection.create_index("email", unique=True)
    await predictions_collection.create_index("user_id")
    await doctors_collection.create_index([("city", 1), ("state", 1)])
    await hospitals_collection.create_index([("city", 1), ("state", 1)])
    await seed_database()
