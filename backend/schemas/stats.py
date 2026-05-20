from pydantic import BaseModel

from backend.models.activity import SportType


class StatsTotals(BaseModel):
    count: int
    total_distance: float
    total_elevation: float
    total_duration: int


class PersonalRecord(BaseModel):
    sport_type: SportType
    best_time: int


class StatsResponse(BaseModel):
    totals: dict[str, StatsTotals]
    personal_records: list[PersonalRecord] = []
