#!/usr/bin/env python
# encoding: utf-8

"""
Django Blog global constant definitions, including configurations for cache timeout, cache key templates, etc.
"""


# ===== Cache Expiration Time (seconds) =====
class CacheTimeout:
    """
    Cache timeout constants
    Centralized management of all cache expiration times facilitates unified adjustments to caching strategies.
    """

    # Minute level
    MINUTE_1 = 60
    MINUTE_5 = 60 * 5
    MINUTE_10 = 60 * 10
    MINUTE_30 = 60 * 30

    # Hour level
    HOUR_1 = 60 * 60
    HOUR_2 = 60 * 60 * 2
    HOUR_10 = 60 * 60 * 10
    HOUR_24 = 60 * 60 * 24

    # Day level
    DAY_7 = 60 * 60 * 24 * 7
    DAY_30 = 60 * 60 * 24 * 30

    # Default cache time
    DEFAULT = HOUR_10  # 10 hours


# ===== 10-hour cache key prefix =====
class CacheKey:
    """
    Cache key template
    Use a string formatting template to avoid cache key spelling errors.
    """

    # Article
    ARTICLE_COMMENTS = "article_comments_{article_id}"
    ARTICLE_NEXT = "article_next_{article_id}"
    ARTICLE_PREV = "article_prev_{article_id}"
    ARTICLE_CATEGORY_TREE = "article_category_tree_{article_id}"

    # List page cache
    INDEX_LIST = "index_{page}"
    CATEGORY_LIST = "category_list_{name}_{page}"
    TAG_LIST = "tag_{name}_{page}"
    AUTHOR_LIST = "author_{name}_{page}"
    ARCHIVES = "archives"

    # Categories and tags
    CATEGORY_TREE = "category_tree_{category_id}"
    SUB_CATEGORIES = "sub_categories_{category_id}"
    TAG_ARTICLE_COUNT = "tag_article_count_{tag_id}"

    # Global settings
    BLOG_SETTINGS = "blog_settings"
    CURRENT_SITE = "current_site"
    SIDEBAR = "sidebar_{type}"

    # Sidebar related
    SIDEBAR_LATEST_ARTICLES = "sidebar_latest_articles"
    SIDEBAR_HOT_ARTICLES = "sidebar_hot_articles"
    SIDEBAR_LATEST_COMMENTS = "sidebar_latest_comments"


# ===== HTTP status code =====
class HttpStatus:
    """HTTP status code constants"""

    OK = 200
    CREATED = 201
    NO_CONTENT = 204

    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404

    INTERNAL_SERVER_ERROR = 500
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503


# ===== 分页配置 =====
class Pagination:
    """Pagination-related constants"""

    DEFAULT_PAGE_SIZE = 10
    MAX_PAGE_SIZE = 100
    PAGE_QUERY_PARAM = "page"
