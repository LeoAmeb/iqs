import pytest
from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.productos.models import Producto, TipoCalculo
from apps.users.models import User
from apps.ventas.models import Cotizacion, EstatusProduccion, Pedido, PedidoItem


@pytest.fixture
def grupo_empleado_ventas(db):
    grupo = Group.objects.create(name="empleado-ventas-test")
    perms = Permission.objects.filter(
        codename__in=[
            "view_cotizacion", "add_cotizacion",
            "view_pedido", "change_pedido", "delete_pedido",
            "view_pedidoitem", "change_pedidoitem",
        ]
    )
    grupo.permissions.set(perms)
    return grupo


@pytest.fixture
def empleado(db, grupo_empleado_ventas):
    user = User.objects.create_user(
        email="ventas@test.com",
        password="pass1234!",
        first_name="Ana",
        last_name="Ventas",
    )
    user.groups.set([grupo_empleado_ventas])
    return user


@pytest.fixture
def client_emp(empleado):
    client = APIClient()
    client.force_authenticate(user=empleado)
    return client


@pytest.fixture
def producto(db):
    return Producto.objects.create(
        nombre="Logo test",
        tipo_calculo=TipoCalculo.PRECIO_FIJO,
        categoria_display="Logos",
        config={"precio_base": 500},
    )


def _payload_cotizacion(producto_id):
    return {
        "nombre_cliente": "Cliente Test",
        "telefono": "555-1234",
        "total": "1000.00",
        "costo": "200.00",
        "iva": "0.00",
        "ganancia": "800.00",
        "margen": "80.00",
        "items": [
            {
                "nombre_producto": "Logo test",
                "tipo_calculo": "precio_fijo",
                "descripcion": "Logo 30x30",
                "cantidad": 2,
                "precio_unit": "500.00",
                "total": "1000.00",
                "costo": "200.00",
                "detalles": {"ancho": 30, "alto": 30},
            }
        ],
    }


def _crear_pedido(client, producto):
    """Crea una cotización y la convierte en pedido vía el action proceder."""
    resp = client.post(reverse("cotizacion-list"), _payload_cotizacion(producto.pk), format="json")
    assert resp.status_code == status.HTTP_201_CREATED
    cotizacion_id = resp.data["id"]
    client.post(reverse("cotizacion-proceder", args=[cotizacion_id]))
    return Pedido.objects.get(cotizacion_id=cotizacion_id)


class TestCotizacionViewSet:
    def test_crear_cotizacion_no_crea_pedido(self, client_emp, producto):
        """POST a cotizaciones solo crea la cotización; el pedido se crea con proceder."""
        url = reverse("cotizacion-list")
        resp = client_emp.post(url, _payload_cotizacion(producto.pk), format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        folio = resp.data["folio"]
        assert Cotizacion.objects.filter(folio=folio).exists()
        assert not Pedido.objects.filter(folio=folio).exists()

    def test_proceder_crea_pedido(self, client_emp, producto):
        """El action proceder convierte la cotización en pedido con sus ítems."""
        url = reverse("cotizacion-list")
        resp = client_emp.post(url, _payload_cotizacion(producto.pk), format="json")
        cotizacion_id = resp.data["id"]
        folio = resp.data["folio"]

        resp_proceder = client_emp.post(reverse("cotizacion-proceder", args=[cotizacion_id]))
        assert resp_proceder.status_code == status.HTTP_201_CREATED
        assert Pedido.objects.filter(folio=folio).exists()
        assert PedidoItem.objects.filter(pedido__folio=folio).count() == 1

    def test_proceder_solo_una_vez(self, client_emp, producto):
        """No se puede llamar proceder dos veces sobre la misma cotización."""
        resp = client_emp.post(reverse("cotizacion-list"), _payload_cotizacion(producto.pk), format="json")
        cotizacion_id = resp.data["id"]
        client_emp.post(reverse("cotizacion-proceder", args=[cotizacion_id]))
        resp2 = client_emp.post(reverse("cotizacion-proceder", args=[cotizacion_id]))
        assert resp2.status_code == status.HTTP_400_BAD_REQUEST

    def test_items_vacios_devuelve_400(self, client_emp):
        url = reverse("cotizacion-list")
        payload = _payload_cotizacion(None)
        payload["items"] = []
        resp = client_emp.post(url, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_forma_pago_invalida_devuelve_400(self, client_emp, producto):
        """Solo se aceptan los valores del catálogo (efectivo/transferencia/tarjeta)."""
        payload = _payload_cotizacion(producto.pk)
        payload["forma_pago"] = "Efectivo en dolares"
        resp = client_emp.post(reverse("cotizacion-list"), payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_forma_pago_valida_se_guarda_y_se_copia_al_pedido(self, client_emp, producto):
        payload = _payload_cotizacion(producto.pk)
        payload["forma_pago"] = "transferencia"
        resp = client_emp.post(reverse("cotizacion-list"), payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["forma_pago"] == "transferencia"

        cotizacion_id = resp.data["id"]
        client_emp.post(reverse("cotizacion-proceder", args=[cotizacion_id]))
        pedido = Pedido.objects.get(cotizacion_id=cotizacion_id)
        assert pedido.forma_pago == "transferencia"

    def test_folios_son_unicos_y_secuenciales(self, client_emp, producto):
        url = reverse("cotizacion-list")
        resp1 = client_emp.post(url, _payload_cotizacion(producto.pk), format="json")
        resp2 = client_emp.post(url, _payload_cotizacion(producto.pk), format="json")
        assert resp1.data["folio"] != resp2.data["folio"]

    def test_retrieve_cotizacion(self, client_emp, producto):
        url = reverse("cotizacion-list")
        resp = client_emp.post(url, _payload_cotizacion(producto.pk), format="json")
        cotizacion_id = resp.data["id"]
        resp2 = client_emp.get(reverse("cotizacion-detail", args=[cotizacion_id]))
        assert resp2.status_code == status.HTTP_200_OK

    def test_editar_item_bloqueado_si_tiene_pedido(self, client_emp, producto):
        """Una vez convertida en pedido, los ítems de la cotización no se pueden editar."""
        pedido = _crear_pedido(client_emp, producto)
        item = pedido.cotizacion.items.first()
        url = reverse("cotizacion-item-detail", args=[item.pk])
        resp = client_emp.patch(url, {"cantidad": 99}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


class TestPedidoViewSet:
    def test_listar_pedidos(self, client_emp, producto):
        _crear_pedido(client_emp, producto)
        resp = client_emp.get(reverse("pedido-list"))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] >= 1

    def test_actualizar_estatus_pedido(self, client_emp, producto):
        pedido = _crear_pedido(client_emp, producto)
        resp = client_emp.patch(reverse("pedido-detail", args=[pedido.pk]), {"estatus": "listo"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        pedido.refresh_from_db()
        assert pedido.estatus == "listo"

    def test_soft_delete_empleado(self, client_emp, producto):
        pedido = _crear_pedido(client_emp, producto)
        resp = client_emp.delete(reverse("pedido-detail", args=[pedido.pk]))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        pedido.refresh_from_db()
        assert pedido.deleted_at is not None

    def test_pedidos_eliminados_no_aparecen_en_lista(self, client_emp, producto):
        pedido = _crear_pedido(client_emp, producto)
        client_emp.delete(reverse("pedido-detail", args=[pedido.pk]))
        resp = client_emp.get(reverse("pedido-list"))
        folios = [p["folio"] for p in resp.data["results"]]
        assert pedido.folio not in folios

    def test_filtro_pendientes_excluye_entregados_y_cancelados(self, client_emp, producto):
        activo = _crear_pedido(client_emp, producto)
        entregado = _crear_pedido(client_emp, producto)
        client_emp.patch(reverse("pedido-detail", args=[entregado.pk]), {"estatus": "entregado"}, format="json")
        cancelado = _crear_pedido(client_emp, producto)
        client_emp.patch(reverse("pedido-detail", args=[cancelado.pk]), {"estatus": "cancelado"}, format="json")

        resp = client_emp.get(reverse("pedido-list"), {"pendientes": "1"})

        folios = [p["folio"] for p in resp.data["results"]]
        assert activo.folio in folios
        assert entregado.folio not in folios
        assert cancelado.folio not in folios


class TestProduccionViewSet:
    def test_listar_items_produccion(self, client_emp, producto):
        _crear_pedido(client_emp, producto)
        resp = client_emp.get(reverse("produccion-list"))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] >= 1

    def test_cambio_estatus_produccion_crea_log(self, client_emp, producto):
        pedido = _crear_pedido(client_emp, producto)
        item = PedidoItem.objects.get(pedido=pedido)
        resp = client_emp.patch(
            reverse("produccion-detail", args=[item.pk]),
            {"estatus_produccion": EstatusProduccion.EN_PRODUCCION, "nota": "Iniciando"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        item.refresh_from_db()
        assert item.estatus_produccion == EstatusProduccion.EN_PRODUCCION
        assert item.logs.count() == 1
        log = item.logs.first()
        assert log.estatus_anterior == EstatusProduccion.PENDIENTE
        assert log.estatus_nuevo == EstatusProduccion.EN_PRODUCCION
        assert log.nota == "Iniciando"

    def test_mismo_estatus_no_crea_log(self, client_emp, producto):
        pedido = _crear_pedido(client_emp, producto)
        item = PedidoItem.objects.get(pedido=pedido)
        client_emp.patch(
            reverse("produccion-detail", args=[item.pk]),
            {"estatus_produccion": EstatusProduccion.PENDIENTE},
            format="json",
        )
        assert item.logs.count() == 0
