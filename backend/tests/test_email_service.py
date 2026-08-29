from unittest.mock import MagicMock, patch
import pytest
from app.core.config import settings
from app.services.email_service import EmailService


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
    monkeypatch.setattr(settings, "smtp_host", None)

    with caplog.at_level("INFO"):
        result = EmailService.send_otp_email("user@example.com", "654321")

    assert result is True
    assert "[DEV EMAIL SERVICE] Verification OTP" in caplog.text
    assert "654321" in caplog.text


def test_send_otp_email_brevo_smtp_success(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", "smtp-relay.brevo.com")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_user", "sender@verified.com")
    monkeypatch.setattr(settings, "smtp_password", "xsmtpsib-mock-smtp-key")
    monkeypatch.setattr(settings, "smtp_tls", True)
    monkeypatch.setattr(settings, "emails_from_name", "ExpenseTracker")

    with patch("smtplib.SMTP") as mock_smtp_cls:
        mock_server = MagicMock()
        mock_smtp_cls.return_value.__enter__.return_value = mock_server

        result = EmailService.send_otp_email("recipient@test.com", "112233")

        assert result is True
        mock_smtp_cls.assert_called_once_with("smtp-relay.brevo.com", 587, timeout=15)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("sender@verified.com", "xsmtpsib-mock-smtp-key")
        mock_server.send_message.assert_called_once()


def test_send_otp_email_smtp_failure(monkeypatch, caplog):
    monkeypatch.setattr(settings, "smtp_host", "smtp-relay.brevo.com")
    monkeypatch.setattr(settings, "smtp_port", 587)

    with patch("smtplib.SMTP", side_effect=Exception("Connection refused")):
        with caplog.at_level("ERROR"):
            result = EmailService.send_otp_email("recipient@test.com", "112233")

        assert result is False
        assert "Failed to send verification email" in caplog.text
