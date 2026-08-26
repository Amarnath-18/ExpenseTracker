import logging
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama  # 1. Import ChatOllama

from app.core.config import settings
from app.schemas.transaction import TransactionCreate

logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    """Custom domain exception for clean API error mapping."""

    pass


class LLMService:

    def __init__(self) -> None:
        self._model = None

    @property
    def model(self) -> ChatGoogleGenerativeAI | ChatOllama:
        """Lazily initialize LLM client depending on environment settings."""
        if self._model is None:
            # --- 2. Google Gemini Provider ---
            if settings.llm_provider == "google":
                if not settings.gemini_api_key:
                    raise LLMServiceError(
                        "GEMINI_API_KEY is not configured in settings."
                    )

                logger.info("Initializing Google Gemini API connection...")
                self._model = ChatGoogleGenerativeAI(
                    model=settings.llm_model,
                    google_api_key=settings.gemini_api_key,
                    temperature=0.0,
                )

            # --- 3. Local Ollama Provider ---
            elif settings.llm_provider == "ollama":
                logger.info(
                    f"Initializing Local Ollama Connection ({settings.llm_model})..."
                )
                self._model = ChatOllama(
                    model=settings.llm_model,
                    base_url=settings.ollama_base_url,
                    temperature=0.0,
                )

            else:
                raise LLMServiceError(
                    f"Unsupported LLM provider: {settings.llm_provider}"
                )

        return self._model

    def format_transaction(self, ocr_text: str) -> TransactionCreate:
        """Parses raw receipt OCR text and structures it into a standard transaction.

        Args:
            ocr_text: Raw text string scanned from the payment screenshot.

        Returns:
            TransactionCreate: The populated transaction schema.

        Raises:
            LLMServiceError: If the LLM call fails or returns invalid structure.
        """
        if not ocr_text.strip():
            raise LLMServiceError("Cannot format empty raw OCR text.")

        try:
            # Clean system prompt outlining precise formatting rules
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        (
                            "You are a precise payment transaction extractor.\n"
                            "Analyze the raw OCR text from a transaction/payment receipt screenshot "
                            "and extract the following fields strictly according to these rules:\n\n"
                            "- merchant: The name of the merchant, shop, company, or person who received the money. "
                            "Clean up any noise (e.g., 'Starbucks Coffee Corp' -> 'Starbucks', 'WAL-MART STORES' -> 'Walmart').\n"
                            "- amount: Total paid amount as a decimal number. Do not include currency symbols.\n"
                            "- currency: ISO 3-letter currency code (e.g. 'INR', 'USD', 'EUR'). Default to 'INR' if not specified.\n"
                            "- category: Classify into 'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Others'.\n"
                            "- date: Date of transaction in YYYY-MM-DD format. Default to today's date if missing.\n"
                            "- payment_method: Payment mode (e.g., 'UPI', 'Credit Card', 'Cash', 'Net Banking')."
                        ),
                    ),
                    ("human", "Raw OCR text to parse:\n\n{ocr_text}"),
                ]
            )

            # Leverage LangChain's native structured outputs mapped to our Pydantic schema
            # Best practice: use json_mode for Ollama to prevent strict grammar sampler crashes
            if settings.llm_provider == "ollama":
                structured_llm = self.model.with_structured_output(
                    TransactionCreate, method="json_mode"
                )
            else:
                structured_llm = self.model.with_structured_output(
                    TransactionCreate
                )
            chain = prompt | structured_llm

            logger.info("Invoking LLM structured output parsing...")
            result: TransactionCreate = chain.invoke({"ocr_text": ocr_text})

            # Preserve the original OCR text in the transaction for debugging
            result.raw_ocr_text = ocr_text

            return result

        except Exception as e:
            logger.exception(
                "Error occurred during LLM transaction structuring"
            )
            raise LLMServiceError(f"Failed to structure OCR text: {str(e)}")


# Singleton instance
llm_service = LLMService()
