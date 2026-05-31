from django.urls import path

from api.v1.dashboard.views import CeleryPingView, DashboardStatsView

urlpatterns = [
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("dashboard/celery-ping/", CeleryPingView.as_view(), name="dashboard-celery-ping"),
]
