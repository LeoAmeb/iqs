import django_filters

from apps.users.models import User


class UserFilter(django_filters.FilterSet):
    email = django_filters.CharFilter(lookup_expr="icontains")
    is_active = django_filters.BooleanFilter()
    group_id = django_filters.NumberFilter(field_name="groups__id")

    class Meta:
        model = User
        fields = ["email", "is_active", "group_id"]
