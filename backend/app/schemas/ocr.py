from pydantic import BaseModel

class OCRResponse(BaseModel):
    extracted_text: str
    lines: list[str]
    