from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from backend.models.activity import SportType


class StatsTotals(BaseModel):
    count: int
    total_distance: float
    total_duration: int


RecordType = Literal[
    "longest_distance",
    "longest_duration",
    "fastest_pace",
    "fastest_speed",
]


class PersonalRecord(BaseModel):
    sport_type: SportType
    record_type: RecordType
    value: float
    activity_id: int
    achieved_at: datetime | None = None


class StatsResponse(BaseModel):
    totals: dict[str, StatsTotals]
    personal_records: list[PersonalRecord] = []
