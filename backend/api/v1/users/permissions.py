from rest_framework.permissions import BasePermission


class IsAdminOrSuperuser(BasePermission):
    """
    Allows access only to superusers or users whose role slug is 'admin'.
    """

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated and (
            request.user.is_superuser
            or (
                request.user.role is not None
                and request.user.role.slug == "admin"
            )
        )


class HasPermission(BasePermission):
    """
    Permission class that checks custom role-based permissions.

    Usage::

        permission_classes = [HasPermission("users.view")]

    or via the factory::

        permission_classes = [require_permission("users.view", "users.edit")]
    """

    def __init__(self, *required_perms: str):
        self.required_perms = required_perms

    def has_permission(self, request, view) -> bool:
        if not request.user.is_authenticated:
            return False
        return all(request.user.has_permission(p) for p in self.required_perms)


def require_permission(*codenames: str) -> type[HasPermission]:
    """
    Factory that returns a ``HasPermission`` subclass pre-configured with
    the given permission codenames.

    Usage::

        permission_classes = [require_permission("users.view")]
    """

    class _Permission(HasPermission):
        def __init__(self):
            super().__init__(*codenames)

    _Permission.__name__ = f"HasPermission_{'_'.join(codenames)}"
    return _Permission
