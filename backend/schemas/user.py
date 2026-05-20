from datetime import datetime

from pydantic import BaseModel, Field


class UserOut(BaseModel):
    id: int
    username: str
    bio: str | None
    location: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    bio: str | None = Field(default=None, max_length=5000)
    location: str | None = Field(default=None, max_length=100)
