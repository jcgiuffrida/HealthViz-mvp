from django.conf.urls import url, include
from . import views
from rest_framework.routers import SimpleRouter

# Create a router and register our viewsets with it
router = SimpleRouter()
router.register(r'attributes', views.AttributeViewSet, base_name='attribute')
router.register(r'geographies', views.GeographyViewSet, base_name='geography')
router.register(r'data', views.DataViewSet, base_name='data')
router.register(r'sources', views.SourceViewSet, base_name='source')
router.register(r'categories', views.CategoryViewSet, base_name='category')
router.register(r'regions', views.RegionViewSet, base_name='region')
router.register(r'shapes', views.GeographyShapeViewSet, base_name='shape')

# API urls are determined automatically by the router
urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^$', views.Health_Viz_API, name="api-root"),
]
