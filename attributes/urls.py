from django.conf.urls import url

from . import views

app_name = 'attributes'
urlpatterns = [
    # ex: /attr/
    url(r'^$', views.IndexView.as_view(), name='index'),
    # ex: /attr/5/
    url(r'^(?P<pk>[0-9]+)/$', views.AttrDetailView.as_view(), name='attribute_detail'),
    # ex: /attr/sources/
    url(r'^sources/$', views.SourcesView.as_view(), name='sources'),
    # ex: /attr/sources/5
    url(r'^sources/(?P<pk>[0-9]+)/$', views.SourceDetailView.as_view(), name="source_detail"),
]
