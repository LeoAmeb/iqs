"""Celery tasks for the users app."""
from celery import shared_task


@shared_task(bind=True, ignore_result=True, max_retries=3)
def flush_expired_tokens(self):
    """
    Purge expired Outstanding and Blacklisted JWT tokens from the database.
    Equivalent to running: python manage.py flushexpiredtokens
    """
    try:
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )
        from django.utils import timezone

        expired = OutstandingToken.objects.filter(expires_at__lt=timezone.now())
        count = expired.count()
        BlacklistedToken.objects.filter(token__in=expired).delete()
        expired.delete()
        return {"deleted": count}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * 10)
