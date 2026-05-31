from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.urls import path


class GoogleLogin(SocialLoginView):
    """
    POST /api/v1/auth/google/
    Body: {"access_token": "<google-access-token>"}
    Returns: {access, refresh, user}
    """

    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3001/api/auth/callback/google"
    client_class = OAuth2Client


class GitHubLogin(SocialLoginView):
    """
    POST /api/v1/auth/github/
    Body: {"access_token": "<github-access-token>"}
    Returns: {access, refresh, user}
    """

    adapter_class = GitHubOAuth2Adapter
    callback_url = "http://localhost:3001/api/auth/callback/github"
    client_class = OAuth2Client


urlpatterns = [
    path("google/", GoogleLogin.as_view(), name="google_login"),
    path("github/", GitHubLogin.as_view(), name="github_login"),
]
