from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("", include("api.v1.users.urls")),
    path("", include("api.v1.grupos.urls")),
    path("", include("api.v1.audit.urls")),
    path("", include("api.v1.dashboard.urls")),
    path("", include("api.v1.clientes.urls")),
    path("", include("api.v1.productos.urls")),
    path("", include("api.v1.ventas.urls")),
    path("auth/", include("dj_rest_auth.urls")),
    path("auth/register/", include("dj_rest_auth.registration.urls")),
    path("auth/", include("api.v1.users.social_urls")),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
