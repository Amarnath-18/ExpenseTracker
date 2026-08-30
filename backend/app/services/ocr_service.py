import io
from PIL import Image
from rapidocr_onnxruntime import RapidOCR
from app.schemas.ocr import OCRResponse

class OCRService:
    def __init__(self):
        self._engine = None

    @property
    def engine(self):
        if self._engine is None:
            self._engine = RapidOCR()
        return self._engine

    def process_image(self, file_bytes: bytes) -> OCRResponse:
        """Runs RapidOCR on image bytes and returns OCRResponse."""
        try:
            # RapidOCR can run directly on image bytes, PIL Image, or numpy arrays
            result, elapse = self.engine(file_bytes)
            
            if not result:
                return OCRResponse(extracted_text="", lines=[])
                
            # RapidOCR returns blocks in the structure: [ [box, text, confidence], ... ]
            lines = [line[1] for line in result]
            extracted_text = "\n".join(lines)
            
            return OCRResponse(extracted_text=extracted_text, lines=lines)
            
        except Exception as e:
            raise RuntimeError(f"RapidOCR engine failed: {str(e)}")

ocr_service = OCRService()
