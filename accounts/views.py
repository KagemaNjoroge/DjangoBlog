import logging
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib import auth
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth import get_user_model
from django.contrib.auth import logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.hashers import make_password
from django.http import HttpResponseRedirect, HttpResponseForbidden
from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views import View

from djangoblog.utils import (
    send_email,
    get_sha256,
    get_current_site,
    generate_code,
    delete_sidebar_cache,
)
from djangoblog.base_views import SecureFormView, LoginFormView, LogoutRedirectView
from . import utils
from .forms import RegisterForm, LoginForm, ForgetPasswordForm, ForgetPasswordCodeForm
from .models import BlogUser

logger = logging.getLogger(__name__)


class RegisterView(SecureFormView):
    """
    User registration view (reconstructed version)

    Using the SecureFormView base class, CSRF protection is automatically provided.
    """

    form_class = RegisterForm
    template_name = "account/registration_form.html"

    def form_valid(self, form):
        if form.is_valid():
            user = form.save(False)
            user.is_active = False
            user.source = "Register"
            user.save(True)
            site = get_current_site().domain
            sign = get_sha256(get_sha256(settings.SECRET_KEY + str(user.id)))

            if settings.DEBUG:
                site = "127.0.0.1:8000"
            path = reverse("account:result")
            url = "http://{site}{path}?type=validation&id={id}&sign={sign}".format(
                site=site, path=path, id=user.id, sign=sign
            )

            content = """
                            <p>Please click the link below to verify your email address.</p>

                            <a href="{url}" rel="bookmark">{url}</a>

                            Thank you!
                            <br />
                            If the link above cannot be opened, please copy this link into your browser.
                            {url}
                            """.format(
                url=url
            )
            send_email(
                emailto=[
                    user.email,
                ],
                title="Verify your email address",
                content=content,
            )

            url = reverse("accounts:result") + "?type=register&id=" + str(user.id)
            return HttpResponseRedirect(url)
        else:
            return self.render_to_response({"form": form})


class LogoutView(LogoutRedirectView):
    """
    User Logout View (Refactored)

    Uses the LogoutRedirectView base class, automatically disabling caching.
    """

    url = "/login/"

    def get(self, request, *args, **kwargs):
        logout(request)
        delete_sidebar_cache()
        # Retrieve the response object and delete the login cookie.
        response = super(LogoutView, self).get(request, *args, **kwargs)
        response.delete_cookie("logged_user")
        return response


class LoginView(LoginFormView):
    """
    User Login View (Refactored Version)

    Uses the LoginFormView base class, automatically providing:
    - Sensitive parameter protection (password)
    - CSRF protection
    - Disable caching
    """

    form_class = LoginForm
    template_name = "account/login.html"
    success_url = "/"
    redirect_field_name = REDIRECT_FIELD_NAME

    def get_context_data(self, **kwargs):
        redirect_to = self.request.GET.get(self.redirect_field_name)
        if redirect_to is None:
            redirect_to = "/"
        kwargs["redirect_to"] = redirect_to

        return super(LoginView, self).get_context_data(**kwargs)

    def form_valid(self, form):
        form = AuthenticationForm(data=self.request.POST, request=self.request)

        if form.is_valid():
            delete_sidebar_cache()
            logger.info(self.redirect_field_name)

            auth.login(self.request, form.get_user())
            # Set login validity period
            if self.request.POST.get("remember"):
                self.request.session.set_expiry(settings.REMEMBER_ME_LOGIN_TTL)
                cookie_max_age = settings.REMEMBER_ME_LOGIN_TTL
            else:
                # Using Django's default 2 weeks
                self.request.session.set_expiry(settings.SESSION_COOKIE_AGE)
                cookie_max_age = settings.SESSION_COOKIE_AGE

            # Retrieve the response object and set the login cookie.
            response = super(LoginView, self).form_valid(form)
            response.set_cookie(
                "logged_user",
                "true",
                max_age=cookie_max_age,
                httponly=False,  # Allow JavaScript access
                samesite="Lax",
            )
            return response
            # return HttpResponseRedirect('/')
        else:
            return self.render_to_response({"form": form})

    def get_success_url(self):

        redirect_to = self.request.POST.get(self.redirect_field_name)
        if not url_has_allowed_host_and_scheme(
            url=redirect_to, allowed_hosts=[self.request.get_host()]
        ):
            redirect_to = self.success_url
        return redirect_to


def account_result(request):
    type = request.GET.get("type")
    id = request.GET.get("id")

    user = get_object_or_404(get_user_model(), id=id)
    logger.info(type)
    if user.is_active:
        return HttpResponseRedirect("/")
    if type and type in ["register", "validation"]:
        if type == "register":
            content = """
  Congratulations on your successful registration! A verification email has been sent to your inbox. Please verify your email address and log in to this site.
    """
            title = "Registration successful"
        else:
            c_sign = get_sha256(get_sha256(settings.SECRET_KEY + str(user.id)))
            sign = request.GET.get("sign")
            if sign != c_sign:
                return HttpResponseForbidden()
            user.is_active = True
            user.save()
            content = """
           Congratulations! You have successfully completed email verification. You can now log in to this site using your account.
            """
            title = "Verification successful"
        return render(
            request, "account/result.html", {"title": title, "content": content}
        )
    else:
        return HttpResponseRedirect("/")


class ForgetPasswordView(SecureFormView):
    """
    Forgot Password View (Refactored)

    Uses the SecureFormView base class, automatically providing CSRF protection.
    """

    form_class = ForgetPasswordForm
    template_name = "account/forget_password.html"

    def form_valid(self, form):
        if form.is_valid():
            blog_user = BlogUser.objects.filter(
                email=form.cleaned_data.get("email")
            ).get()
            blog_user.password = make_password(form.cleaned_data["new_password2"])
            blog_user.save()
            return HttpResponseRedirect("/login/")
        else:
            return self.render_to_response({"form": form})


class ForgetPasswordEmailCode(View):

    def post(self, request: HttpRequest):
        form = ForgetPasswordCodeForm(request.POST)
        if not form.is_valid():
            return HttpResponse("Wrong email format")
        to_email = form.cleaned_data["email"]

        code = generate_code()
        utils.send_verify_email(to_email, code)
        utils.set_code(to_email, code)

        return HttpResponse("ok")
