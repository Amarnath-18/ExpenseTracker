from fastapi import APIRouter, File , UploadFile , status
from app.controllers.ocr_controller import extract_text_from_image
from app.schemas.ocr import OCRResponse



router = APIRouter()

@router.post("/extract", response_model=OCRResponse,status_code=200)
async def process_ocr(file:UploadFile = File(...)) -> OCRResponse:
    return await extract_text_from_image(file)