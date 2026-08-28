from app.schemas.ocr import OCRResponse
import tempfile
import os


# Windows compatibility flag for PaddleOCR
os.environ["FLAGS_enable_pir_api"] = "0"

class OCRService:

    def __init__(self):
        self._ocr = None

    @property
    def ocr(self):
        """Lazy-initialize PaddleOCR instance."""
        if self._ocr is None:
            from paddleocr import PaddleOCR
            self._ocr = PaddleOCR(
                use_doc_orientation_classify=False,
                use_doc_unwarping= False,
                use_textline_orientation=False,
                enable_mkldnn = False
            )
        return self._ocr


    def process_image(self, file_bytes: bytes) -> OCRResponse:
        """Saves image bytes to a temporary file, runs OCR, and cleans up."""
        with tempfile.NamedTemporaryFile(
            delete=False,suffix=".png"
        ) as temp_file :
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        try:
            results = self.ocr.predict(temp_path)
            lines: list[str] = []

            if results:
                for item in results:
                    if isinstance(item, dict) and "rec_texts" in item:
                        lines.extend(item["rec_texts"])
            extracted_text = "\n".join(lines)
            return OCRResponse(extracted_text= extracted_text,lines=lines)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

ocr_service = OCRService()