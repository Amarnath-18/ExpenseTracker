from fastapi import HTTPException, UploadFile, status
from app.schemas.ocr import OCRResponse
from app.services.ocr_service import ocr_service



async def extract_text_from_image(file:UploadFile) -> OCRResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code= 400,
            detail="Uploaded file must be an image."
        )
    
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    return ocr_service.process_image(content)