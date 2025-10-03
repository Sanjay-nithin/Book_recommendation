import logging
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetOTP

logger = logging.getLogger(__name__)

def send_otp_email(user):
    """
    Generate an OTP for password reset and send it via email
    
    Args:
        user: User model instance
    
    Returns:
        PasswordResetOTP instance
    """
    # Generate OTP
    otp_obj = PasswordResetOTP.generate_otp(user)
    
    # Send email with OTP
    subject = "Book Recommendation System - Password Reset OTP"
    message = f"""
    Hello {user.first_name},
    
    We received a request to reset your password for your Book Recommendation System account.
    
    Your OTP is: {otp_obj.otp}
    
    This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.
    
    Thank you,
    Book Recommendation System Team
    """
    
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None)
    logger.info("send_otp_email: Using from_email=%s, to=%s", from_email, user.email)
    recipient_list = [user.email]
    
    try:
        sent_count = send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False
        )
        logger.info("send_otp_email: send_mail returned count=%s", sent_count)
        logger.info("send_otp_email: Generated OTP id=%s for user=%s", otp_obj.id, user.email)
        return otp_obj
    except Exception as e:
        # Log the error but keep OTP to allow retry without re-generating
        logger.exception("send_otp_email: Failed to send email for user=%s", user.email)
        raise e