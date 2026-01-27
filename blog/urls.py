from django.urls import path
from django.views.decorators.cache import cache_page

from . import views

app_name = "blog"
urlpatterns = [
    path(r"", views.IndexView.as_view(), name="index"),
    path(r"page/<int:page>/", views.IndexView.as_view(), name="index_page"),
    path(
        r"article/<int:year>/<int:month>/<int:day>/<int:article_id>",
        views.ArticleDetailView.as_view(),
        name="detailbyid",
    ),
    path(
        r"category/<slug:category_name>",
        views.CategoryDetailView.as_view(),
        name="category_detail",
    ),
    path(
        r"category/<slug:category_name>/<int:page>",
        views.CategoryDetailView.as_view(),
        name="category_detail_page",
    ),
    path(
        r"author/<author_name>",
        views.AuthorDetailView.as_view(),
        name="author_detail",
    ),
    path(
        r"author/<author_name>/<int:page>",
        views.AuthorDetailView.as_view(),
        name="author_detail_page",
    ),
    path(r"tag/<slug:tag_name>", views.TagDetailView.as_view(), name="tag_detail"),
    path(
        r"tag/<slug:tag_name>/<int:page>",
        views.TagDetailView.as_view(),
        name="tag_detail_page",
    ),
    path(
        "archives",
        cache_page(60 * 60)(views.ArchivesView.as_view()),
        name="archives",
    ),
    path("links", views.LinkListView.as_view(), name="links"),
    path(r"upload", views.fileupload, name="upload"),
    path(r"clean", views.clean_cache_view, name="clean"),
]
