#!/usr/bin/env python
# encoding: utf-8

"""
Django Blog Unified Error Handling View
Provides a unified error page rendering, reducing code duplication.
"""

import logging
from django.shortcuts import render
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


def render_error_page(request, status_code, message, exception=None):
    """
    General Error Page Rendering Function
    Handles various HTTP errors uniformly, providing a consistent error page display.

    Args:
        request: HTTP request object
        status_code: HTTP status code (404, 403, 500, etc.)
        message: Error message (supports internationalization)
        exception: Exception object (optional), will be logged

    Returns:
        HttpResponse: Rendered error page

        Usage:
            def my_error_handler(request, exception):
                return render_error_page(request, 404, "Page not found", exception)
    """
    if exception:
        logger.error(
            f"HTTP {status_code} Error: {exception}",
            exc_info=True,
            extra={"request": request, "status_code": status_code},
        )

    return render(
        request,
        "blog/error_page.html",
        {"message": message, "statuscode": str(status_code)},
        status=status_code,
    )


def page_not_found_view(request, exception, template_name="blog/error_page.html"):
    """
    404 Error Page Handler
    Displayed when a user requests a non-existent page

    Args:
        request: HTTP request object
        exception: exception object
        template_name: template name (reserved parameter for Django standard compatibility)

    Returns:
        HttpResponse: 404 error page
    """
    return render_error_page(
        request,
        404,
        _(
            "Sorry, the page you requested is not found, please click the home page to see other?"
        ),
        exception,
    )


def server_error_view(request, template_name="blog/error_page.html"):
    """
    500 Error Page Handler
    Displayed when there is an internal server error

    Args:
        request: HTTP request object
        template_name: Template name (reserved parameter for Django standard compatibility)

    Returns:
        HttpResponse: 500 error page
    """
    return render_error_page(
        request,
        500,
        _("Sorry, the server is busy, please click the home page to see other?"),
    )


def permission_denied_view(request, exception, template_name="blog/error_page.html"):
    """
    403 Error Page Handler
    Displayed when a user does not have permission to access the site

    Args:
        request: HTTP request object
        exception: exception object
        template_name: template name (reserved parameter for Django standard compatibility)

    Returns:
        HttpResponse: 403 error page
    """
    return render_error_page(
        request,
        403,
        _("Sorry, you do not have permission to access this page?"),
        exception,
    )


def bad_request_view(request, exception, template_name="blog/error_page.html"):
    """
    400 Error Page Handler
    Displayed when the request is incorrectly formatted

    Args:
        request: HTTP request object
        exception: exception object
        template_name: template name (reserved parameter for Django standard compatibility)

    Returns:
        HttpResponse: 400 error page
    """
    return render_error_page(
        request, 400, _("Sorry, the request was invalid?"), exception
    )
