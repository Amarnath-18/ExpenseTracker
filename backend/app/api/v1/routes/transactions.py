import uuid
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.controllers.transaction_controller import (
    create_transaction,
    create_transaction_from_image,
    delete_transaction,
    list_transactions,
)
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionDeleteResponse,
    TransactionListResponse,
    TransactionResponse,
)
from app.controllers.upload_job_controller import create_async_upload_job, get_job_status

router = APIRouter()


@router.get("/", response_model=TransactionListResponse)
def get_transactions(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionListResponse:
    """Get all stored transactions for the authenticated user."""
    return list_transactions(db, current_user.id)


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionResponse:
    """Manually add a transaction for the authenticated user."""
    return create_transaction(db, payload, current_user.id)


@router.post(
    "/upload",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    deprecated=True,
)
async def upload_transaction_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionResponse:
    """[DEPRECATED] Upload a transaction receipt image synchronously.

    Please use POST /api/v1/transactions/upload/async and poll GET /api/v1/transactions/jobs/{job_id} instead.
    """
    return await create_transaction_from_image(db, file, current_user.id)


@router.delete(
    "/{transaction_id}",
    response_model=TransactionDeleteResponse,
    status_code=status.HTTP_200_OK,
)
def delete_transaction_endpoint(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionDeleteResponse:
    """Delete a transaction by its ID for the authenticated user."""
    return delete_transaction(db, transaction_id, current_user.id)

@router.post(
    "/upload/async",
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_transaction_image_async(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Upload a transaction receipt image to be processed asynchronously."""
    job_id = create_async_upload_job(db, file, current_user.id)
    return {"message": "Image uploaded successfully and is processing", "job_id": job_id}

@router.get("/jobs/{job_id}", status_code=status.HTTP_200_OK)
def check_job_status(
    job_id: uuid.UUID,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    """Check the processing status of an uploaded receipt."""
    return get_job_status(db, job_id, current_user.id)