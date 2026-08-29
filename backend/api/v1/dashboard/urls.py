from django.urls import path

from api.v1.dashboard.views import CeleryPingView, DashboardStatsView, DashboardVentasSerieView

urlpatterns = [
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("dashboard/ventas-serie/", DashboardVentasSerieView.as_view(), name="dashboard-ventas-serie"),
    path("dashboard/celery-ping/", CeleryPingView.as_view(), name="dashboard-celery-ping"),
]
