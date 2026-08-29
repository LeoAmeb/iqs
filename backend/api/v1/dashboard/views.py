from datetime import date, timedelta

from celery.app.control import Control
from django.db.models import DateField, DecimalField, Q, Sum
from django.db.models.functions import Coalesce, TruncDate, TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.users.permissions import IsAdminOrSuperuser, require_permission
from apps.dashboard.constants import Permissions
from apps.productos.models import ConfiguracionSistema
from apps.ventas.models import EstatusPedido, Pedido, PedidoItem


def _cero():
    return Coalesce(Sum("total"), 0, output_field=DecimalField())


def _cero_costo():
    return Coalesce(Sum("costo"), 0, output_field=DecimalField())


def _primer_dia_mes(fecha: date, meses_atras: int) -> date:
    """Primer día del mes que está `meses_atras` meses antes de `fecha`."""
    mes_total = fecha.month - 1 - meses_atras
    anio = fecha.year + mes_total // 12
    mes = mes_total % 12 + 1
    return date(anio, mes, 1)


@extend_schema(
    tags=["Dashboard"],
    description="Retorna métricas IQS del mes en curso: ventas, costos, ganancias, meta y producción.",
)
class DashboardStatsView(APIView):
    permission_classes = [require_permission(Permissions.VIEW)]

    def get(self, request):
        now = timezone.now()
        inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        en_48h = now + timedelta(hours=48)

        pedidos_mes = Pedido.objects.filter(
            created_at__gte=inicio_mes,
            deleted_at__isnull=True,
        ).exclude(estatus=EstatusPedido.CANCELADO)

        totales = pedidos_mes.aggregate(
            ventas=_cero(),
            costos=_cero_costo(),
        )
        ventas = totales["ventas"] or 0
        costos = totales["costos"] or 0
        ganancia = ventas - costos
        margen = round((ganancia / ventas * 100), 2) if ventas else 0

        # IVA estimado sobre ventas (16%)
        iva = round(ventas * 16 / 116, 2)

        config = ConfiguracionSistema.get()
        meta_mensual = config.meta_mensual

        # Ventas por producto del mes
        items_mes = (
            PedidoItem.objects.filter(
                pedido__created_at__gte=inicio_mes,
                pedido__deleted_at__isnull=True,
            )
            .exclude(pedido__estatus=EstatusPedido.CANCELADO)
            .values("nombre_producto")
            .annotate(total_ventas=_cero())
            .order_by("-total_ventas")[:10]
        )

        # Pedidos activos
        pedidos_activos = Pedido.objects.filter(
            deleted_at__isnull=True,
        ).exclude(estatus__in=[EstatusPedido.ENTREGADO, EstatusPedido.CANCELADO])

        pedidos_activos_count = pedidos_activos.count()

        # Entregas próximas (≤ 48h)
        entregas_proximas = pedidos_activos.filter(
            fecha_entrega__isnull=False,
            fecha_entrega__lte=en_48h.date(),
        ).count()

        # Saldo pendiente (anticipo no cubierto)
        saldo_pendiente = (
            pedidos_activos.aggregate(
                saldo=Coalesce(
                    Sum("total") - Sum("anticipo"),
                    0,
                    output_field=DecimalField(),
                )
            )["saldo"]
            or 0
        )

        return Response(
            {
                "periodo": {
                    "inicio": inicio_mes.date().isoformat(),
                    "hoy": now.date().isoformat(),
                },
                "ventas": ventas,
                "costos": costos,
                "iva": iva,
                "ganancia": ganancia,
                "margen": margen,
                "meta_mensual": meta_mensual,
                "avance_meta_pct": round(float(ventas) / float(meta_mensual) * 100, 1) if meta_mensual else 0,
                "pedidos_activos": pedidos_activos_count,
                "entregas_proximas_48h": entregas_proximas,
                "saldo_pendiente": saldo_pendiente,
                "top_productos": list(items_mes),
            }
        )


@extend_schema(
    tags=["Dashboard"],
    description=(
        "Serie histórica de ventas, costos y ganancia agrupada por mes. "
        "Acepta `desde` y `hasta` (YYYY-MM-DD); por omisión, los últimos 6 meses. "
        "Si el rango cabe en poco más de un mes (35 días o menos), agrupa por día en vez de por mes."
    ),
)
class DashboardVentasSerieView(APIView):
    permission_classes = [require_permission(Permissions.VIEW)]

    def get(self, request):
        hoy = timezone.localdate()
        hasta = parse_date(request.query_params.get("hasta", "")) or hoy
        desde = parse_date(request.query_params.get("desde", "")) or _primer_dia_mes(hoy, 5)

        if desde > hasta:
            desde, hasta = hasta, desde

        por_dia = (hasta - desde).days <= 35
        trunc = (
            TruncDate("created_at", output_field=DateField())
            if por_dia
            else TruncMonth("created_at", output_field=DateField())
        )

        pedidos_rango = Pedido.objects.filter(
            created_at__date__gte=desde,
            created_at__date__lte=hasta,
            deleted_at__isnull=True,
        ).exclude(estatus=EstatusPedido.CANCELADO)

        serie_qs = (
            pedidos_rango.annotate(periodo=trunc)
            .values("periodo")
            .annotate(ventas=_cero(), costos=_cero_costo())
            .order_by("periodo")
        )

        serie = [
            {
                "periodo": row["periodo"].isoformat(),
                "ventas": row["ventas"],
                "costos": row["costos"],
                "ganancia": row["ventas"] - row["costos"],
            }
            for row in serie_qs
        ]

        return Response(
            {
                "desde": desde.isoformat(),
                "hasta": hasta.isoformat(),
                "agrupacion": "dia" if por_dia else "mes",
                "serie": serie,
            }
        )


@extend_schema(
    tags=["Dashboard"],
    request=None,
    responses={
        200: inline_serializer(
            name="CeleryPingResponse",
            fields={
                "task_id": serializers.CharField(),
                "status": serializers.CharField(),
                "workers": serializers.ListField(child=serializers.CharField()),
            },
        )
    },
    description=(
        "Despacha una tarea no-op a Celery y hace ping a los workers activos. "
        "Útil para verificar la conexión al broker."
    ),
)
class CeleryPingView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def post(self, request):
        from config.celery import app as celery_app, debug_task

        control = Control(celery_app)
        ping_responses = control.ping(timeout=1.0) or []
        workers = [list(r.keys())[0] for r in ping_responses if r]

        task = debug_task.delay()

        return Response(
            {
                "task_id": task.id,
                "status": "queued",
                "workers": workers,
            },
            status=status.HTTP_200_OK,
        )
