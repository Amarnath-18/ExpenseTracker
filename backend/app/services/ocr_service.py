import io
from PIL import Image
import pytesseract
from app.schemas.ocr import OCRResponse

class OCRService:
    def process_image(self, file_bytes: bytes) -> OCRResponse:
        """Runs Tesseract OCR on image bytes and returns OCRResponse."""
        try:
            # 1. Load image directly from bytes in memory using Pillow
            image = Image.open(io.BytesIO(file_bytes))
            
            # 2. Perform OCR
            extracted_text = pytesseract.image_to_string(image)
            
            # 3. Clean up and split text into lines
            lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
            
            return OCRResponse(extracted_text=extracted_text, lines=lines)
            
        except Exception as e:
            # Fallback/error handling
            raise RuntimeError(f"Tesseract OCR failed: {str(e)}")

ocr_service = OCRService()
