import os

os.environ["FLAGS_enable_pir_api"] = "0"

from paddleocr import PaddleOCR

ocr = PaddleOCR(
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False,
)

result = ocr.predict("text-image.png")

for item in result:
    print(item["rec_texts"])