from pydantic import BaseModel


class KudosResponse(BaseModel):
    kudos_count: int
    user_has_kudos: bool
