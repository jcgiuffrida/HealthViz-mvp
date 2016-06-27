from django.conf.urls import url

from . import views

app_name = 'geo'
urlpatterns = [
    # ex: /geo/
    url(r'^$', views.IndexView.as_view(), name='index'),
    # ex: /geo/region/
    url(r'^region/$', views.RegionListView.as_view(), name='region_list'),
    # ex: /geo/region/1/
    url(r'^region/(?P<pk>\d+)/$', views.RegionView.as_view(), name='region'),
	# ex: /geo/zip/
    url(r'^(?P<slug>[A-Za-z-]+)/$', views.GeoListView.as_view(), name='list'),
	# ex: /geo/zip/60647/
	url(r'^(?P<slug>[A-Za-z-]+)/(?P<geoid>[\w-]+)/$', views.GeoDetailView.as_view(), name='detail'),
]
