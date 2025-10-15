from pydantic import BaseModel, ConfigDict


class SenderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone_number: str
    spam_count: int
    is_blocked: bool
