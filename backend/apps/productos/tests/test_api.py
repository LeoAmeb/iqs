import pytest
from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.productos.models import Categoria, ConfiguracionSistema, Producto, TipoCalculo
from apps.users.models import User


@pytest.fixture
def grupo_admin(db):
    grupo = Group.objects.create(name="admin-productos-test")
    perms = Permission.objects.filter(
        content_type__app_label="productos",
        codename__in=[
            "view_producto", "add_producto", "change_producto", "delete_producto",
            "view_categoria", "add_categoria", "change_categoria", "delete_categoria",
        ],
    )
    grupo.permissions.set(perms)
    return grupo


@pytest.fixture
def admin(db, grupo_admin):
    user = User.objects.create_user(
        email="admin@test.com",
        password="pass1234!",
        first_name="Admin",
        last_name="Test",
    )
    user.groups.set([grupo_admin])
    return user


@pytest.fixture
def superusuario(db):
    return User.objects.create_superuser(
        email="super@test.com",
        password="pass1234!",
        first_name="Super",
        last_name="User",
    )


@pytest.fixture
def client_admin(admin):
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def client_super(superusuario):
    client = APIClient()
    client.force_authenticate(user=superusuario)
    return client


@pytest.fixture
def producto(db):
    return Producto.objects.create(
        nombre="Logo test",
        tipo_calculo=TipoCalculo.PRECIO_FIJO,
        categoria_display="Test",
        config={"precio_base": 100, "costo_base": 20},
    )


class TestProductoViewSet:
    def test_listar_productos(self, client_admin, producto):
        url = reverse("producto-list")
        resp = client_admin.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_crear_producto(self, client_admin):
        url = reverse("producto-list")
        data = {
            "nombre": "Nuevo producto",
            "tipo_calculo": TipoCalculo.MANUAL,
            "categoria_display": "General",
            "config": {},
        }
        resp = client_admin.post(url, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED

    def test_editar_config_producto(self, client_admin, producto):
        url = reverse("producto-detail", args=[producto.pk])
        resp = client_admin.patch(url, {"config": {"precio_base": 200}}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        producto.refresh_from_db()
        assert producto.config["precio_base"] == 200


@pytest.fixture
def categoria(db):
    cat, _ = Categoria.objects.get_or_create(
        nombre="Logos",
        defaults={
            "icono": "🔤",
            "orden": 10,
            "tipo_calculo": TipoCalculo.PRECIO_FIJO,
            "config": {"precio_base": 1590, "costo_base": 300},
        },
    )
    return cat


class TestCategoriaViewSet:
    def test_listar_categorias(self, client_admin, categoria):
        url = reverse("categoria-list")
        resp = client_admin.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] >= 1

    def test_crear_categoria(self, client_super):
        url = reverse("categoria-list")
        data = {
            "nombre": "Nueva categoría",
            "icono": "✨",
            "orden": 99,
            "activo": True,
            "tipo_calculo": "precio_fijo",
            "config": {},
        }
        resp = client_super.post(url, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["tipo_calculo"] == "precio_fijo"

    def test_actualizar_config_categoria(self, client_super, categoria):
        url = reverse("categoria-detail", args=[categoria.pk])
        resp = client_super.patch(url, {"config": {"precio_base": 2000}}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        categoria.refresh_from_db()
        assert categoria.config["precio_base"] == 2000

    def test_eliminar_categoria(self, client_super, categoria):
        url = reverse("categoria-detail", args=[categoria.pk])
        resp = client_super.delete(url)
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_empleado_sin_permiso_no_puede_crear(self, db):
        user = User.objects.create_user(email="noperm@test.com", password="pass")
        client = APIClient()
        client.force_authenticate(user=user)
        url = reverse("categoria-list")
        resp = client.post(url, {"nombre": "X", "tipo_calculo": "manual", "config": {}}, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_restablecer_restaura_config_base(self, client_super, categoria):
        url_detail = reverse("categoria-detail", args=[categoria.pk])
        client_super.patch(url_detail, {"config": {"precio_base": 9999}}, format="json")
        url_reset = reverse("categoria-restablecer", args=[categoria.pk])
        resp = client_super.post(url_reset)
        assert resp.status_code == status.HTTP_200_OK
        categoria.refresh_from_db()
        assert categoria.config["precio_base"] == 0
        assert "opciones" in categoria.config

    def test_restablecer_categoria_sin_base_devuelve_404(self, client_super, db):
        cat = Categoria.objects.create(
            nombre="Custom Cat",
            tipo_calculo=TipoCalculo.MANUAL,
            config={},
        )
        url = reverse("categoria-restablecer", args=[cat.pk])
        resp = client_super.post(url)
        assert resp.status_code == status.HTTP_404_NOT_FOUND


class TestCotizadorConfigView:
    def test_endpoint_cotizador(self, client_admin, categoria):
        url = reverse("cotizador-config")
        resp = client_admin.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert "categorias" in resp.data
        assert "configuracion" in resp.data

    def test_categorias_incluyen_tipo_calculo_y_config(self, client_admin, categoria):
        url = reverse("cotizador-config")
        resp = client_admin.get(url)
        cat = resp.data["categorias"][0]
        assert "tipo_calculo" in cat
        assert "config" in cat
        assert "icono" in cat

    def test_configuracion_tiene_campos_correctos(self, client_admin):
        url = reverse("cotizador-config")
        resp = client_admin.get(url)
        config = resp.data["configuracion"]
        assert "hora_objetivo" in config
        assert "hora_laser" in config
        assert "meta_mensual" in config


class TestConfiguracionSistemaView:
    def test_get_configuracion(self, client_super):
        url = reverse("configuracion-sistema")
        resp = client_super.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_patch_configuracion(self, client_super):
        url = reverse("configuracion-sistema")
        resp = client_super.patch(url, {"meta_mensual": "25000.00"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert float(resp.data["meta_mensual"]) == 25000.0

    def test_empleado_sin_acceso(self, db):
        user = User.objects.create_user(email="emp2@test.com", password="pass")
        client = APIClient()
        client.force_authenticate(user=user)
        url = reverse("configuracion-sistema")
        resp = client.get(url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN
