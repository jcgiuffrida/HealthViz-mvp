from django.conf.urls import url

from . import views

app_name = 'geo'
urlpatterns = [
    # ex: /geo/
    # url(r'^$', views.IndexView.as_view(), name='index'),
	# ex: /geo/zip/
	# ex: /geo/zip/60647/
	# ex: /geo/region/
	# ex: /geo/region/1/
]
