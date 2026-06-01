import pytest
from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.clientes.models import Cliente
from apps.users.models import User


@pytest.fixture
def grupo_empleado(db):
    grupo = Group.objects.create(name="empleado-clientes-test")
    perms = Permission.objects.filter(
        content_type__app_label="clientes",
        codename__in=["view_cliente", "add_cliente", "change_cliente", "delete_cliente"],
    )
    grupo.permissions.set(perms)
    return grupo


@pytest.fixture
def empleado(db, grupo_empleado):
    user = User.objects.create_user(
        email="empleado@test.com",
        password="pass1234!",
        first_name="Juan",
        last_name="Test",
    )
    user.groups.set([grupo_empleado])
    return user


@pytest.fixture
def client_autenticado(empleado):
    client = APIClient()
    client.force_authenticate(user=empleado)
    return client


@pytest.fixture
def cliente(db):
    return Cliente.objects.create(nombre="ACME Corp", telefono="555-1234")


class TestClienteViewSet:
    def test_listar_clientes(self, client_autenticado, cliente):
        url = reverse("cliente-list")
        resp = client_autenticado.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] >= 1

    def test_crear_cliente(self, client_autenticado):
        url = reverse("cliente-list")
        resp = client_autenticado.post(url, {"nombre": "Nuevo Cliente", "telefono": "555-9999"})
        assert resp.status_code == status.HTTP_201_CREATED
        assert Cliente.objects.filter(nombre="Nuevo Cliente").exists()

    def test_detalle_cliente(self, client_autenticado, cliente):
        url = reverse("cliente-detail", args=[cliente.pk])
        resp = client_autenticado.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["nombre"] == "ACME Corp"

    def test_editar_cliente(self, client_autenticado, cliente):
        url = reverse("cliente-detail", args=[cliente.pk])
        resp = client_autenticado.patch(url, {"telefono": "555-0000"})
        assert resp.status_code == status.HTTP_200_OK
        cliente.refresh_from_db()
        assert cliente.telefono == "555-0000"

    def test_eliminar_cliente(self, client_autenticado, cliente):
        url = reverse("cliente-detail", args=[cliente.pk])
        resp = client_autenticado.delete(url)
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not Cliente.objects.filter(pk=cliente.pk).exists()

    def test_historial_pedidos(self, client_autenticado, cliente):
        url = reverse("cliente-pedidos", args=[cliente.pk])
        resp = client_autenticado.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert isinstance(resp.data, list)

    def test_busqueda_por_nombre(self, client_autenticado, cliente):
        url = reverse("cliente-list") + "?search=ACME"
        resp = client_autenticado.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] >= 1

    def test_sin_autenticacion_devuelve_401(self):
        url = reverse("cliente-list")
        resp = APIClient().get(url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
