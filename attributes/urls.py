from django.conf.urls import url

from . import views

app_name = 'attributes'
urlpatterns = [
    # ex: /attr/
    url(r'^$', views.IndexView.as_view(), name='index'),
]