from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base
from backend.geometry import PATH_SRID

if TYPE_CHECKING:
    from backend.models.activity import Activity
    from backend.models.user import User


class Segment(Base):
    __tablename__ = "segments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    polyline: Mapped[str | None] = mapped_column(Text)
    path: Mapped[Any] = mapped_column(Geometry(geometry_type="LINESTRING", srid=PATH_SRID), nullable=True)
    distance: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    efforts: Mapped[list["SegmentEffort"]] = relationship("SegmentEffort", back_populates="segment")


class SegmentEffort(Base):
    __tablename__ = "segment_efforts"

    id: Mapped[int] = mapped_column(primary_key=True)
    segment_id: Mapped[int] = mapped_column(ForeignKey("segments.id", ondelete="CASCADE"), nullable=False)
    activity_id: Mapped[int] = mapped_column(ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    elapsed_time: Mapped[int] = mapped_column(Integer, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)

    segment: Mapped["Segment"] = relationship("Segment", back_populates="efforts")
    activity: Mapped["Activity"] = relationship("Activity")
    athlete: Mapped["User"] = relationship("User")
