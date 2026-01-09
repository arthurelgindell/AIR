"""
ARTHUR Notifications Module
Email and alerting services
"""

from .postmark import PostmarkNotifier, EmailResult
from .daily_summary import generate_daily_summary, format_email_body, format_email_subject

__all__ = [
    "PostmarkNotifier",
    "EmailResult",
    "generate_daily_summary",
    "format_email_body",
    "format_email_subject",
]
