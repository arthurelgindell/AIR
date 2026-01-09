#!/usr/bin/env python3
"""
Daily Summary Email - Executed by launchd at 8am
ARTHUR Project - Automated daily reporting via Postmark
"""

import os
import sys
import argparse
import logging
from datetime import datetime

# Add project root to path
PROJECT_ROOT = "/Users/arthurdell/ARTHUR"
sys.path.insert(0, PROJECT_ROOT)

from arthur.notifications.daily_summary import (
    generate_daily_summary,
    format_email_body,
    format_email_subject
)
from arthur.notifications.postmark import PostmarkNotifier
from arthur.config import POSTMARK

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f"{PROJECT_ROOT}/logs/daily-summary.log", mode="a")
    ]
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Send ARTHUR daily summary email")
    parser.add_argument("--dry-run", action="store_true", help="Preview without sending")
    parser.add_argument("--test", action="store_true", help="Send test email immediately")
    parser.add_argument("--to", type=str, default=POSTMARK.default_recipient,
                        help=f"Recipient email (default: {POSTMARK.default_recipient})")
    parser.add_argument("--hours", type=int, default=24,
                        help="Lookback period in hours (default: 24)")
    parser.add_argument("--no-infra", action="store_true",
                        help="Skip infrastructure health checks")
    args = parser.parse_args()

    logger.info(f"ARTHUR Daily Summary - {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    # Check for API token
    server_token = os.getenv("POSTMARK_SERVER_TOKEN", "") or POSTMARK.server_token
    if not server_token and not args.dry_run:
        logger.error("POSTMARK_SERVER_TOKEN environment variable not set")
        print("\nTo set the token:")
        print("  export POSTMARK_SERVER_TOKEN='your-token-here'")
        sys.exit(1)

    # Generate summary
    logger.info(f"Generating summary for last {args.hours} hours...")
    summary = generate_daily_summary(
        lookback_hours=args.hours,
        check_infrastructure=not args.no_infra
    )

    subject = format_email_subject(summary)
    body = format_email_body(summary)

    print(f"\n{'='*60}")
    print(f"Subject: {subject}")
    print(f"To: {args.to}")
    print(f"From: {POSTMARK.default_sender}")
    print(f"{'='*60}\n")
    print(body)
    print(f"\n{'='*60}\n")

    if args.dry_run:
        logger.info("DRY RUN - Email not sent")
        print("Use --test to send a real email")
        return

    # Send email
    notifier = PostmarkNotifier(server_token=server_token)
    result = notifier.send_daily_summary(
        to=args.to,
        subject=subject,
        body=body,
        from_addr=POSTMARK.default_sender
    )

    if result.success:
        logger.info(f"Email sent successfully! Message ID: {result.message_id}")
        print(f"Email sent to {args.to}")
        print(f"Message ID: {result.message_id}")
    else:
        logger.error(f"Failed to send email: {result.error}")
        print(f"ERROR: {result.error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
