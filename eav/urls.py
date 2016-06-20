from django.conf.urls import url

from . import views

app_name = 'eav'
urlpatterns = [
    # ex: /eav/import/
    url(r'^import/$', views.bulk_import, name='import'),
]
