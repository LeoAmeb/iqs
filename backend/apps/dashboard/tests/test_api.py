from datetime import UTC, datetime

import pytest
from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.ventas.models import Cotizacion, EstatusPedido, Pedido


@pytest.fixture
def grupo_dashboard(db):
    grupo = Group.objects.create(name="dashboard-test")
    grupo.permissions.set(Permission.objects.filter(codename="view_dashboard"))
    return grupo


@pytest.fixture
def usuario_con_permiso(db, grupo_dashboard):
    user = User.objects.create_user(
        email="dash@test.com",
        password="pass1234!",
        first_name="Dash",
        last_name="Test",
    )
    user.groups.set([grupo_dashboard])
    return user


@pytest.fixture
def usuario_sin_permiso(db):
    return User.objects.create_user(
        email="sinpermiso@test.com",
        password="pass1234!",
        first_name="Sin",
        last_name="Permiso",
    )


@pytest.fixture
def client_dash(usuario_con_permiso):
    client = APIClient()
    client.force_authenticate(user=usuario_con_permiso)
    return client


def _crear_pedido(folio, total, costo, creado_en, estatus=EstatusPedido.PENDIENTE, deleted_at=None):
    """Crea un Pedido con `created_at` forzado a una fecha específica (auto_now_add ignora .create)."""
    cotizacion = Cotizacion.objects.create(folio=folio, total=total, costo=costo)
    pedido = Pedido.objects.create(
        folio=folio,
        cotizacion=cotizacion,
        total=total,
        costo=costo,
        estatus=estatus,
        deleted_at=deleted_at,
    )
    Pedido.objects.filter(pk=pedido.pk).update(created_at=creado_en)
    return pedido


def _dt(anio, mes, dia):
    return datetime(anio, mes, dia, 12, 0, tzinfo=UTC)


class TestDashboardVentasSerieView:
    def test_agrupa_por_mes_cuando_el_rango_es_amplio(self, client_dash):
        _crear_pedido(1, "1000.00", "400.00", _dt(2026, 6, 10))
        _crear_pedido(2, "500.00", "100.00", _dt(2026, 6, 20))
        _crear_pedido(3, "2000.00", "800.00", _dt(2026, 7, 5))

        resp = client_dash.get(
            reverse("dashboard-ventas-serie"),
            {"desde": "2026-06-01", "hasta": "2026-07-31"},
        )

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["agrupacion"] == "mes"
        serie = {row["periodo"]: row for row in resp.data["serie"]}
        assert serie["2026-06-01"]["ventas"] == 1500
        assert serie["2026-06-01"]["ganancia"] == 1000
        assert serie["2026-07-01"]["ventas"] == 2000

    def test_agrupa_por_dia_cuando_el_rango_es_corto(self, client_dash):
        _crear_pedido(1, "1000.00", "400.00", _dt(2026, 8, 1))
        _crear_pedido(2, "500.00", "100.00", _dt(2026, 8, 3))

        resp = client_dash.get(
            reverse("dashboard-ventas-serie"),
            {"desde": "2026-08-01", "hasta": "2026-08-05"},
        )

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["agrupacion"] == "dia"
        periodos = {row["periodo"] for row in resp.data["serie"]}
        assert periodos == {"2026-08-01", "2026-08-03"}

    def test_excluye_cancelados_y_eliminados(self, client_dash):
        _crear_pedido(1, "1000.00", "400.00", _dt(2026, 6, 10))
        _crear_pedido(2, "5000.00", "1000.00", _dt(2026, 6, 12), estatus=EstatusPedido.CANCELADO)
        _crear_pedido(3, "5000.00", "1000.00", _dt(2026, 6, 13), deleted_at=_dt(2026, 6, 14))

        resp = client_dash.get(
            reverse("dashboard-ventas-serie"),
            {"desde": "2026-06-01", "hasta": "2026-06-30"},
        )

        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["serie"]) == 1
        assert resp.data["serie"][0]["ventas"] == 1000

    def test_usa_los_ultimos_seis_meses_por_omision(self, client_dash):
        resp = client_dash.get(reverse("dashboard-ventas-serie"))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["agrupacion"] == "mes"
        assert resp.data["serie"] == []

    def test_requiere_permiso(self, usuario_sin_permiso):
        client = APIClient()
        client.force_authenticate(user=usuario_sin_permiso)
        resp = client.get(reverse("dashboard-ventas-serie"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN
