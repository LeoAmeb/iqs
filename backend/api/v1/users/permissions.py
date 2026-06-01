from rest_framework.permissions import BasePermission


class IsAdminOrSuperuser(BasePermission):
    """Permite acceso solo a superusuarios o usuarios en el grupo 'admin'."""

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated and (
            request.user.is_superuser
            or request.user.groups.filter(name="admin").exists()
        )


class HasPermission(BasePermission):
    """
    Verifica permisos de Django (app_label.codename) en el usuario autenticado.

    Uso::

        permission_classes = [HasPermission("clientes.view_cliente")]

    o mediante la factory::

        permission_classes = [require_permission("clientes.view_cliente")]
    """

    def __init__(self, *required_perms: str):
        self.required_perms = required_perms

    def has_permission(self, request, view) -> bool:
        if not request.user.is_authenticated:
            return False
        return all(request.user.has_perm(p) for p in self.required_perms)


def require_permission(*codenames: str) -> type[HasPermission]:
    """
    Factory que devuelve una subclase de ``HasPermission`` preconfigurada
    con los codenames dados.

    Uso::

        permission_classes = [require_permission("clientes.view_cliente")]
    """

    class _Permission(HasPermission):
        def __init__(self):
            super().__init__(*codenames)

    _Permission.__name__ = f"HasPermission_{'_'.join(codenames)}"
    return _Permission
