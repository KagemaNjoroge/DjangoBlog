import _thread
import logging

import django.dispatch
from django.contrib.admin.models import LogEntry
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.db.models.signals import post_save
from django.dispatch import receiver

from comments.models import Comment
from comments.utils import send_comment_email
from djangoblog.utils import (
    cache,
    expire_view_cache,
    delete_sidebar_cache,
    delete_view_cache,
)
from djangoblog.utils import get_current_site
from oauth.models import OAuthUser

logger = logging.getLogger(__name__)

oauth_user_login_signal = django.dispatch.Signal(["id"])
send_email_signal = django.dispatch.Signal(["emailto", "title", "content"])


@receiver(oauth_user_login_signal)
def oauth_user_login_signal_handler(sender, **kwargs):
    id = kwargs["id"]
    oauthuser = OAuthUser.objects.get(id=id)
    site = get_current_site().domain
    if oauthuser.picture and not oauthuser.picture.find(site) >= 0:
        from djangoblog.utils import save_user_avatar

        oauthuser.picture = save_user_avatar(oauthuser.picture)
        oauthuser.save()

    delete_sidebar_cache()


@receiver(post_save)
def model_post_save_callback(
    sender, instance, created, raw, using, update_fields, **kwargs
):
    if isinstance(instance, LogEntry):
        return

    # Check if only pageviews were updated.
    is_update_views = update_fields == {"views"}
    if is_update_views:
        return  # No need to clear cache when pageviews are updated

    # Comment-related cache cleanup
    if isinstance(instance, Comment):
        if instance.is_enable:
            path = instance.article.get_absolute_url()
            site = get_current_site().domain
            if site.find(":") > 0:
                site = site[0 : site.find(":")]

            expire_view_cache(
                path, servername=site, serverport=80, key_prefix="blogdetail"
            )

            # Clear comment-related cache
            comment_cache_key = "article_comments_{id}".format(id=instance.article.id)
            cache.delete(comment_cache_key)
            delete_view_cache("article_comments", [str(instance.article.pk)])
            delete_sidebar_cache()
            cache.delete("seo_processor")

            _thread.start_new_thread(send_comment_email, (instance,))

    # Fine-grained cache cleanup related to articles
    elif "get_full_url" in dir(instance):
        from blog.models import Article, Category, Tag

        if isinstance(instance, Article):
            # Clear article list homepage cache
            cache.delete("index_1")

            # Clear article details cache
            article_cache_key = f"article_comments_{instance.id}"
            cache.delete(article_cache_key)

            # Clean up category-related cache
            if instance.category:
                category_name = instance.category.name
                cache.delete(f"category_list_{category_name}_1")

            # Clear tag-related cache
            try:
                for tag in instance.tags.all():
                    cache.delete(f"tag_{tag.name}_1")
            except Exception:
                pass  # Tags may not have been associated when the application is created.

            # Clear author-related cache
            if instance.author:
                from uuslug import slugify

                author_slug = slugify(instance.author.username)
                cache.delete(f"author_{author_slug}_1")

            # Clear archive cache
            cache.delete("archives")

            # Clear sidebar and context processor cache
            delete_sidebar_cache()
            cache.delete("seo_processor")

        elif isinstance(instance, Category):
            # Clean up category-related cache
            cache.delete(f"category_list_{instance.name}_1")
            delete_sidebar_cache()
            cache.delete("seo_processor")

        elif isinstance(instance, Tag):
            # Clear tag-related cache
            cache.delete(f"tag_{instance.name}_1")
            delete_sidebar_cache()

        # Cache cleanup for other models
        else:
            # For other models that have get_full_url, clear the basic cache.
            delete_sidebar_cache()
            cache.delete("seo_processor")


@receiver(user_logged_in)
@receiver(user_logged_out)
def user_auth_callback(sender, request, user, **kwargs):
    if user and user.username:
        logger.info(user)
        delete_sidebar_cache()
        # cache.clear()
