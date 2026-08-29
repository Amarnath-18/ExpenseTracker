import logging
import os
import uuid
from app.db.session import SessionLocal
from app.models.upload_job import UploadJob, JobStatus
from app.services.ocr_service import ocr_service
from app.services.llm_service import llm_service
from app.services.transaction_service import transaction_service

logger = logging.getLogger(__name__)


def process_receipt_task(job_id: str, file_path: str):
    """
    Background worker task to run OCR, extract data with LLM, and persist transaction & job status.
    """
    logger.info(f"Worker picked up Job ID: {job_id}")
    db = SessionLocal()
    try:
        job = db.query(UploadJob).filter(UploadJob.id == uuid.UUID(job_id)).first()
        if not job:
            logger.error(f"Job {job_id} not found in database.")
            return {"status": "failed", "error": "Job not found"}

        # 1. Update status to PROCESSING
        job.status = JobStatus.PROCESSING
        db.commit()

        # 2. Read image file
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        # 3. Perform OCR
        logger.info(f"Running OCR for job {job_id}...")
        ocr_response = ocr_service.process_image(file_bytes)
        raw_text = ocr_response.extracted_text

        if not raw_text or not raw_text.strip():
            job.status = JobStatus.FAILED
            job.error_message = "No readable text detected in the uploaded image."
            db.commit()
            return {"status": "failed", "error": job.error_message}

        # 4. Perform LLM parsing
        logger.info(f"Running LLM extraction for job {job_id}...")
        transaction_in = llm_service.format_transaction(raw_text)

        # 5. Create transaction in DB
        transaction = transaction_service.create_transaction(
            db=db, payload=transaction_in, user_id=job.user_id
        )

        # 6. Update job as COMPLETED
        job.status = JobStatus.COMPLETED
        job.transaction_id = transaction.id
        db.commit()

        logger.info(f"Finished processing job {job_id}. Transaction ID: {transaction.id}")
        return {"status": "completed", "job_id": job_id, "transaction_id": str(transaction.id)}

    except Exception as e:
        logger.exception(f"Error processing job {job_id}: {str(e)}")
        db.rollback()
        job = db.query(UploadJob).filter(UploadJob.id == uuid.UUID(job_id)).first()
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            db.commit()
        return {"status": "failed", "error": str(e)}

    finally:
        db.close()
        # Clean up temporary uploaded file from disk
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
            except Exception as err:
                logger.warning(f"Failed to delete temporary file {file_path}: {str(err)}")
