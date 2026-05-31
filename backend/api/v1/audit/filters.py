import django_filters

from apps.audit.models import AuditLog


class AuditLogFilter(django_filters.FilterSet):
    user_id = django_filters.NumberFilter(field_name="user__id")
    action = django_filters.ChoiceFilter(choices=AuditLog.ACTION_CHOICES)
    date_from = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    date_to = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = AuditLog
        fields = ["user_id", "action", "date_from", "date_to"]
