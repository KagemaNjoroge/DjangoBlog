#!/usr/bin/env python
# encoding: utf-8

"""
Django Blog Base View Classes: Provides base view classes with commonly used decorators, reducing repetitive dispatch method definitions.
"""

from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.views.generic import FormView, RedirectView


class SecureFormView(FormView):
    """
    A secure FormView base class
    Automatically adds CSRF protection, suitable for all views that require form submission.

        Usage:
            class MyFormView(SecureFormView):
                form_class = MyForm
                template_name = 'my_form.html'

                def form_valid(self, form):
                    # Process form data
                    return super().form_valid(form)
    """

    @method_decorator(csrf_protect)
    def dispatch(self, *args, **kwargs):
        """Add CSRF protection"""
        return super().dispatch(*args, **kwargs)


class AuthenticatedFormView(FormView):
    """
    FormView requiring login
    Automatically checks user login status and adds CSRF protection
    Unlogged users will be redirected to the login page

        Usage:
            class MyAuthFormView(AuthenticatedFormView):
                form_class = MyForm
                template_name = 'my_form.html'
    """

    @method_decorator(login_required)
    @method_decorator(csrf_protect)
    def dispatch(self, *args, **kwargs):
        """Add login requirements and CSRF protection"""
        return super().dispatch(*args, **kwargs)


class LoginFormView(FormView):
    """
    Dedicated FormView for Login
    Includes the following protection measures:
    - Sensitive parameter protection (password, etc.)
    - CSRF protection
    - Disable caching (prevents login status from being cached)

        Usage:
            class LoginView(LoginFormView):
                form_class = LoginForm
                template_name = 'login.html'

                def form_valid(self, form):
                    # Handle login logic
                    return super().form_valid(form)
    """

    @method_decorator(sensitive_post_parameters('password'))
    @method_decorator(csrf_protect)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        """Add sensitive parameter protection, CSRF protection, and disable caching."""
        return super().dispatch(request, *args, **kwargs)


class LogoutRedirectView(RedirectView):
    """
    Dedicated RedirectView for Logout
    Automatically disables caching to ensure logout operations are not cached.

        Usage:
            class LogoutView(LogoutRedirectView):
                url = '/login/'

                def get(self, request, *args, **kwargs):
                    logout(request)
                    return super().get(request, *args, **kwargs)
    """

    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        """Disable caching"""
        return super().dispatch(request, *args, **kwargs)


class NoCacheFormView(FormView):
    """
    禁用缓存的 FormView

    适用于需要实时数据的表单（如验证码、动态内容等）

    Usage:
        class MyCacheDisabledFormView(NoCacheFormView):
            form_class = MyForm
            template_name = 'my_form.html'
    """

    @method_decorator(never_cache)
    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        """禁用缓存并添加 CSRF 保护"""
        return super().dispatch(request, *args, **kwargs)
