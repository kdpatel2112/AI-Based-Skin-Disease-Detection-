"""
Doctor / hospital recommendation service backed by live MongoDB Atlas collections.
"""
import math
from app.db.mongodb import doctors_collection, hospitals_collection


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two points in kilometers."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


async def find_doctors(city: str | None = None, state: str | None = None,
                        user_lat: float | None = None, user_lng: float | None = None,
                        limit: int = 10) -> list[dict]:
    """Queries MongoDB doctors collection with optional location/city filters and distance sorting."""
    query = {}
    if city:
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    elif state:
        query["state"] = {"$regex": f"^{state}$", "$options": "i"}

    results = []
    cursor = doctors_collection.find(query)
    async for doc in cursor:
        doc["id"] = doc.get("id") or str(doc["_id"])
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        results.append(doc)

    if user_lat is not None and user_lng is not None:
        for d in results:
            d["distance_km"] = round(haversine_km(user_lat, user_lng, d["latitude"], d["longitude"]), 1)
        results = sorted(results, key=lambda d: d.get("distance_km", 9999))

    return results[:limit]


async def find_hospitals(city: str | None = None, state: str | None = None,
                          emergency_only: bool = False,
                          user_lat: float | None = None, user_lng: float | None = None,
                          limit: int = 10) -> list[dict]:
    """Queries MongoDB hospitals collection with optional location/city filters and emergency room flags."""
    query = {}
    if city:
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    elif state:
        query["state"] = {"$regex": f"^{state}$", "$options": "i"}
    if emergency_only:
        query["emergency"] = True

    results = []
    cursor = hospitals_collection.find(query)
    async for doc in cursor:
        doc["id"] = doc.get("id") or str(doc["_id"])
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        results.append(doc)

    if user_lat is not None and user_lng is not None:
        for h in results:
            h["distance_km"] = round(haversine_km(user_lat, user_lng, h["latitude"], h["longitude"]), 1)
        results = sorted(results, key=lambda h: h.get("distance_km", 9999))

    return results[:limit]
