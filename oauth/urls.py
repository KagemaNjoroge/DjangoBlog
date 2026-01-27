from django.urls import path

from . import views

app_name = "oauth"
urlpatterns = [
    path(r"oauth/authorize", views.authorize),
    path(
        r"oauth/requireemail/<int:oauthid>",
        views.RequireEmailView.as_view(),
        name="require_email",
    ),
    path(
        r"oauth/emailconfirm/<int:id>/<sign>", views.emailconfirm, name="email_confirm"
    ),
    path(r"oauth/bindsuccess/<int:oauthid>", views.bindsuccess, name="bindsuccess"),
    path(r"oauth/oauthlogin", views.oauthlogin, name="oauthlogin"),
]
