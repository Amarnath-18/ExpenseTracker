import logging
from fastapi import HTTPException, UploadFile, status
from app.schemas.ocr import OCRResponse
from app.services.ocr_service import ocr_service

logger = logging.getLogger(__name__)


async def extract_text_from_image(file:UploadFile) -> OCRResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(f"OCR failed: file content-type '{file.content_type}' is not an image.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image."
        )
    
    content = await file.read()
    if not content:
        logger.warning("OCR failed: uploaded file is empty.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    try:
        return ocr_service.process_image(content)
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"OCR engine failed to parse image: {str(e)}"
        )