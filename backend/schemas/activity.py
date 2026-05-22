from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field

from backend.models.activity import SportType, Visibility

Int32 = Annotated[int, Field(ge=0, le=2147483647)]


class TaggedAthlete(BaseModel):
    id: int
    username: str

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    sport_type: SportType
    distance: float | None = Field(default=None, ge=0)
    duration: Int32 | None = None
    polyline: str | None = Field(default=None, max_length=100000)
    visibility: Visibility = Visibility.PUBLIC
    started_at: datetime | None = None
    tagged_athlete_ids: list[Annotated[int, Field(ge=1)]] = []


class ActivityOut(BaseModel):
    id: int
    owner_id: int
    owner_username: str | None = None
    title: str
    sport_type: SportType
    distance: float | None
    duration: int | None
    polyline: str | None
    visibility: Visibility
    started_at: datetime | None
    created_at: datetime
    kudos_count: int = 0
    user_has_kudos: bool = False
    tagged_athletes: list[TaggedAthlete] = []

    model_config = {"from_attributes": True}


class ActivityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    sport_type: SportType | None = None
    distance: float | None = Field(default=None, ge=0)
    duration: Int32 | None = None
    polyline: str | None = Field(default=None, max_length=100000)
    visibility: Visibility | None = None
    started_at: datetime | None = None
