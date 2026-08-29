from unittest.mock import MagicMock, patch
import pytest
from app.core.config import settings
from app.services.email_service import BREVO_API_URL, EmailService


def test_build_otp_templates():
    otp = "123456"
    text = EmailService._build_otp_text(otp)
    html = EmailService._build_otp_html(otp)

    assert "123456" in text
    assert settings.emails_from_name in text
    assert "123456" in html
    assert "Verify Your Email" in html
    assert settings.emails_from_name in html


def test_send_otp_email_dev_fallback(monkeypatch, caplog):
    monkeypatch.setattr(settings, "brevo_api_key", None)
    monkeypatch.setattr(settings, "smtp_host", None)

    with caplog.at_level("INFO"):
        result = EmailService.send_otp_email("user@example.com", "654321")

    assert result is True
    assert "[DEV EMAIL SERVICE] Verification OTP" in caplog.text
    assert "654321" in caplog.text


def test_send_otp_email_brevo_api_success(monkeypatch):
    monkeypatch.setattr(settings, "brevo_api_key", "xkeysib-mock-test-key")
    monkeypatch.setattr(settings, "emails_from_email", "sender@verified.com")
    monkeypatch.setattr(settings, "emails_from_name", "ExpenseTracker")

    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"messageId": "<test-msg-id-123>"}

    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.post.return_value = mock_response
        mock_client_cls.return_value = mock_client

        result = EmailService.send_otp_email("recipient@test.com", "987654")

        assert result is True
        mock_client.post.assert_called_once()
        args, kwargs = mock_client.post.call_args
        assert args[0] == BREVO_API_URL
        assert kwargs["headers"]["api-key"] == "xkeysib-mock-test-key"
        assert kwargs["json"]["to"] == [{"email": "recipient@test.com"}]
        assert kwargs["json"]["sender"]["email"] == "sender@verified.com"
        assert "987654" in kwargs["json"]["htmlContent"]


def test_send_otp_email_brevo_api_failure(monkeypatch, caplog):
    monkeypatch.setattr(settings, "brevo_api_key", "xkeysib-invalid-key")

    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Key not found"

    with patch("httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.post.return_value = mock_response
        mock_client_cls.return_value = mock_client

        with caplog.at_level("ERROR"):
            result = EmailService.send_otp_email("recipient@test.com", "987654")

        assert result is False
        assert "Brevo API error (401)" in caplog.text


def test_send_otp_email_smtp_relay_success(monkeypatch):
    monkeypatch.setattr(settings, "brevo_api_key", None)
    monkeypatch.setattr(settings, "smtp_host", "smtp-relay.brevo.com")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_user", "smtp-user@example.com")
    monkeypatch.setattr(settings, "smtp_password", "custom-key")
    monkeypatch.setattr(settings, "smtp_tls", True)

    with patch("smtplib.SMTP") as mock_smtp_cls:
        mock_server = MagicMock()
        mock_smtp_cls.return_value.__enter__.return_value = mock_server

        result = EmailService.send_otp_email("recipient@test.com", "112233")

        assert result is True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("smtp-user@example.com", "custom-key")
        mock_server.send_message.assert_called_once()
