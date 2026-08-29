import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.upload_job import UploadJob, JobStatus
from app.tasks.process_image import process_receipt_task
from app.core.rq_app import q

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR,exist_ok=True)

def create_async_upload_job(db: Session, file:UploadFile, user_id: uuid.UUID) -> uuid.UUID:
    """
    Saves the file, creates a pending job in the DB, and dispatches the Celery task.
    """
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR,unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_job = UploadJob(
        user_id = user_id,
        file_path = file_path,
        status = JobStatus.PENDING
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    q.enqueue(process_receipt_task,
        args=(str(new_job.id),file_path),
        job_timeout=3600 # 1 hour
    )

    return new_job.id

def get_job_status(db: Session, job_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    """
    Retrieves the status of an upload job for a specific user.
    """
    job = db.query(UploadJob).filter(
        UploadJob.id == job_id, 
        UploadJob.user_id == user_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "job_id": job.id,
        "status": job.status,
        "transaction_id": job.transaction_id,
        "error_message": job.error_message
    }