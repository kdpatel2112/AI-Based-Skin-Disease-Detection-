"""
Dermatologist and hospital recommendation routes for the Indian Healthcare
Module, plus saved-favorites management.
"""
from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.db.mongodb import users_collection
from app.services.doctor_service import find_doctors, find_hospitals

router = APIRouter(prefix="/api/doctors", tags=["Doctors & Hospitals"])


@router.get("")
async def list_doctors(
    city: str | None = None,
    state: str | None = None,
    lat: float | None = Query(None),
    lng: float | None = Query(None),
):
    return await find_doctors(city=city, state=state, user_lat=lat, user_lng=lng)


@router.get("/hospitals")
async def list_hospitals(
    city: str | None = None,
    state: str | None = None,
    emergency_only: bool = False,
    lat: float | None = Query(None),
    lng: float | None = Query(None),
):
    return await find_hospitals(city=city, state=state, emergency_only=emergency_only, user_lat=lat, user_lng=lng)


@router.post("/favorites/{doctor_id}")
async def save_favorite_doctor(doctor_id: str, current_user: dict = Depends(get_current_user)):
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$addToSet": {"favorite_doctors": doctor_id}},
    )
    return {"message": "Doctor saved to favorites."}


@router.delete("/favorites/{doctor_id}")
async def remove_favorite_doctor(doctor_id: str, current_user: dict = Depends(get_current_user)):
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$pull": {"favorite_doctors": doctor_id}},
    )
    return {"message": "Doctor removed from favorites."}
