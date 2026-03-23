#!/usr/bin/env python
# encoding: utf-8

"""
Django Blog mixins provide reusable functional modules, reducing code duplication.
"""

import logging
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


# ===== Model Layer Mixin =====


class TimeStampedModel(models.Model):
    """
    Abstract Model: Provides a unified timestamp field for all models

    Provides `created_at` and `updated_at` fields, automatically managing timestamps

    Inheriting this model eliminates duplicate timestamp field definitions.

        Usage:
            class MyModel(TimeStampedModel):
                name = models.CharField(max_length=100)
    """

    created_at = models.DateTimeField(
        _("creation time"),
        default=now,
        db_index=True,
        help_text=_("The date and time when this object was created"),
    )
    updated_at = models.DateTimeField(
        _("last modify time"),
        default=now,
        help_text=_("The date and time when this object was last modified"),
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]
        get_latest_by = "created_at"

    def save(self, *args, **kwargs):
        """
        Override the `save` method to automatically update the `updated_at` field.
        Note: If using the `update_fields` parameter, you must explicitly include `updated_at`.
        """
        # Check if it's a partial update (if update_fields are specified).
        update_fields = kwargs.get("update_fields")
        if update_fields:
            # If `update_fields` is specified but `update_at` is not included, then add it.
            if "updated_at" not in update_fields:
                update_fields = list(update_fields) + ["updated_at"]
                kwargs["update_fields"] = update_fields

        # Update timestamp
        self.updated_at = now()

        super().save(*args, **kwargs)


# ===== View Layer Mixin =====


class SlugCachedMixin:
    """
    Mixin: Caches slug query results to avoid duplicate database queries.
    When retrieving the same slug object multiple times within the same request cycle,
    only one database query will be executed; subsequent calls will use the cached object.

    Attributes:

        slug_url_kwarg: URL parameter name, defaults to 'slug'

        slug_model: The model class to query

        Usage:
            class MyView(SlugCachedMixin, ListView):
                slug_url_kwarg = 'category_slug'
                slug_model = Category

                def get_queryset(self):
                    category = self.get_slug_object()
                    return Article.objects.filter(category=category)
    """

    slug_url_kwarg = "slug"
    slug_model = None

    def get_slug_object(self):
        """
        Retrieves and caches the object corresponding to the slug.

        Returns:

            Model instance: The model instance corresponding to the slug.

        Raises:

            Http404: If the object corresponding to the slug does not exist.
        """
        if not hasattr(self, "_slug_object"):
            if self.slug_model is None:
                raise ValueError(
                    f"{self.__class__.__name__} must define slug_model attribute"
                )

            slug = self.kwargs.get(self.slug_url_kwarg)
            self._slug_object = get_object_or_404(self.slug_model, slug=slug)
            logger.debug(
                f"Loaded {self.slug_model.__name__} object: {self._slug_object} (slug={slug})"
            )

        return self._slug_object


class OptimizedArticleQueryMixin:
    """
    Mixin: Optimize Article Queries (Preload Related Objects)

    Optimize article queries using `select_related` and `prefetch_related`,

    reducing the number of database queries and avoiding the N+1 query problem.

        Usage:
            class MyView(OptimizedArticleQueryMixin, ListView):
                def get_queryset(self):
                    return self.get_optimized_article_queryset().filter(status='p')
    """

    def get_optimized_article_queryset(self):
        """
        Returns the optimized Article queryset

        Preloading foreign key relationships using `select_related`:

        - author: Article author

        - category: Article category

        Preloading many-to-many relationships using `prefetch_related`:

        - tags: Article tags

        Returns:

            QuerySet: Optimized Article queryset
        """
        from blog.models import Article

        return Article.objects.select_related(
            "author",
            "category",  # Preload Authors (ForeignKey) # Preload Categories (ForeignKey)
        ).prefetch_related(
            "tags"  # Preload tags (ManyToMany)
        )


class CachedListViewMixin:
    """
    Mixin: Provides unified caching logic for ListView

    Automatically caches queryset results, reducing database queries

    Subclasses need to implement the `get_queryset_cache_key()` and `get_queryset_data()` methods

        Usage:
            class MyView(CachedListViewMixin, ListView):
                def get_queryset_cache_key(self):
                    return f'my_list_{self.page_number}'

                def get_queryset_data(self):
                    return Article.objects.filter(status='p')
    """

    def get_queryset_cache_key(self):
        """
        Subclass implementation: Returns the cache key

        Returns:
            str: Cache key
        Raises:
            NotImplementedError: Subclasses must implement this method
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} must implement get_queryset_cache_key()"
        )

    def get_queryset_data(self):
        """
        Subclass Implementation: Returns the actual data
        Returns:
            QuerySet: The queryset to be cached
        Raises:
            NotImplementedError: Subclasses must implement this method
        """
        raise NotImplementedError(
            f"{self.__class__.__name__} must implement get_queryset_data()"
        )

    def get_queryset_from_cache(self, cache_key):
        """
        Retrieve the queryset from the cache; if it doesn't exist in the cache, query and cache it.

        Args:
            cache_key: Cache key

        Returns:
            QuerySet: Query results
        """
        from djangoblog.utils import cache

        value = cache.get(cache_key)
        if value:
            logger.info(f"Cache HIT: {cache_key}")
            return value

        queryset = self.get_queryset_data()
        cache.set(cache_key, queryset)
        logger.info(f"Cache MISS: {cache_key}")
        return queryset

    def get_queryset(self):
        """
        Rewrite `get_queryset` to use caching.

        Returns:

            QuerySet: Query results (from cache or database)
        """
        key = self.get_queryset_cache_key()
        return self.get_queryset_from_cache(key)


class PageNumberMixin:
    """
    Mixin: Provides page number retrieval functionality

    Retrieves the current page number from URL parameters or GET parameters.

        Usage:
            class MyView(PageNumberMixin, ListView):
                def get_queryset_cache_key(self):
                    return f'list_{self.page_number}'
    """

    page_kwarg = "page"

    @property
    def page_number(self):
        """
        Get the current page number

        Retrieves the page number from the URL kwargs or GET parameters, defaulting to 1

        Returns:
            int: Current page number
        """
        page = (
            self.kwargs.get(self.page_kwarg)
            or self.request.GET.get(self.page_kwarg)
            or 1
        )

        try:
            return int(page)
        except (ValueError, TypeError):
            return 1


class ArticleListMixin(
    OptimizedArticleQueryMixin, CachedListViewMixin, PageNumberMixin
):
    """
    Mixin: Combine multiple Mixins to provide a complete article list functionality.

    Views inheriting from this Mixin automatically include:

    - Optimized article search

    - Caching support

    - Page number handling

        Usage:
            class MyArticleListView(ArticleListMixin, ListView):
                def get_queryset_data(self):
                    return self.get_optimized_article_queryset().filter(status='p')

                def get_queryset_cache_key(self):
                    return f'my_list_{self.page_number}'
    """

    pass
