import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp: str) -> bool:
        """
        Sends an email with the verification OTP.
        If SMTP is not configured, logs the OTP locally for development/testing.
        """
        email_clean = to_email.strip().lower()

        # Local development / test fallback when SMTP is not configured
        if not settings.smtp_host:
            logger.info(
                f"\n========================================\n"
                f"[DEV EMAIL SERVICE] Verification OTP\n"
                f"To: {email_clean}\n"
                f"OTP Code: {otp}\n"
                f"Valid for: 5 minutes\n"
                f"========================================\n"
            )
            return True

        try:
            from_email = settings.smtp_user or settings.emails_from_email
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"{settings.emails_from_name} - Your Email Verification Code"
            msg["From"] = f"{settings.emails_from_name} <{from_email}>"
            msg["To"] = email_clean

            text_content = (
                f"Hello,\n\n"
                f"Your verification code is: {otp}\n\n"
                f"This code will expire in 5 minutes. If you did not request this, please ignore this email.\n"
            )

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }}
                    .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
                    .header {{ text-align: center; margin-bottom: 24px; }}
                    .header h1 {{ color: #1e293b; font-size: 22px; margin: 0; }}
                    .otp-box {{ text-align: center; margin: 28px 0; padding: 20px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; }}
                    .otp-code {{ font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; margin: 0; }}
                    .info {{ color: #64748b; font-size: 14px; line-height: 1.6; text-align: center; }}
                    .footer {{ margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Verify Your Email</h1>
                    </div>
                    <p class="info">Use the verification code below to verify your account:</p>
                    <div class="otp-box">
                        <div class="otp-code">{otp}</div>
                    </div>
                    <p class="info">This code is valid for <strong>5 minutes</strong>. For your security, never share this code with anyone.</p>
                    <div class="footer">
                        &copy; {settings.emails_from_name}. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
            """

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                if settings.smtp_tls:
                    server.starttls()
                if settings.smtp_user and settings.smtp_password:
                    server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)

            logger.info(f"Verification OTP email sent successfully to {email_clean}")
            return True
        except Exception as e:
            logger.error(f"Failed to send verification email to {email_clean}: {e}")
            return False


email_service = EmailService()
