from rest_framework import viewsets, generics, permissions
from attributes.models import Source, Category, Parent_Attribute
from geo.models import Geography, Region
from eav.models import EAV
from eav.serializers import SourceSerializer, CategorySerializer, ParentAttributeSerializer, GeographySerializer, GeographyShapeSerializer, RegionSerializer, DataSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.reverse import reverse


@api_view(['GET'])
@permission_classes((permissions.AllowAny,))
def Health_Viz_API(request, format=None):
    """
    ### This is the API root for Health Viz.

    The endpoints are detailed below. All accept `GET` requests only, and you can see individual objects by adding the object ID after the trailing slash, e.g. [`/api/attributes/2`](/api/attributes/2).

    To retrieve JSON alone, add `?format=json` to the URL.
    """
    return Response([
        {
            'endpoint': 'Attributes',
            'url': reverse('attribute-list', request=request, format=format),
            'description': 'Returns a list of attributes.'
        },
        {
            'endpoint': 'Geographies',
            'url': reverse('geography-list', request=request, format=format),
            'description': 'Returns a list of geographies.'
        },  
        {
            'endpoint': 'Data',
            'url': reverse('data-list', request=request, format=format),
            'description': 'Returns raw data points - should be used with query parameters.'
        },  
        {
            'endpoint': 'Data Sources',
            'url': reverse('source-list', request=request, format=format),
            'description': 'Returns a list of sources for the data.'
        },  
        {
            'endpoint': 'Attribute Categories',
            'url': reverse('category-list', request=request, format=format),
            'description': 'Returns a list of categories of the data.'
        },  
        {
            'endpoint': 'Regions',
            'url': reverse('region-list', request=request, format=format),
            'description': 'Returns a list of user-created geographic regions.'
        },  
        {
            'endpoint': 'Geography Shapes',
            'url': reverse('shape-list', request=request, format=format),
            'description': 'Returns a list of geographies with their GeoJSON representations.'
        },
    ])

class SourceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This endpoint shows the sources of data in Health Viz through `list` and `detail` views. 

    You can add the `id` field after the trailing slash to request that data source alone, e.g. [`/api/sources/2/`](/api/sources/2).

    **This endpoint is experimental and could change without warning.**
    """
    queryset = Source.objects.all()
    serializer_class = SourceSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """
    This endpoint shows the categories of data in Health Viz through `list` and `detail` views. 

    You can add the `id` field after the trailing slash to request that category alone, e.g. [`/api/categories/2/`](/api/categories/2).

    **This endpoint is experimental and could change without warning.**
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class AttributeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This endpoint shows the attributes in Health Viz through `list` and `detail` views. Each attribute may have a number of stratifications (on age, sex, and/or race and ethnicity), and each stratification has a defined coverage over geography types.

    You can add the `id` field after the trailing slash to request that attribute alone, e.g. [`/api/attributes/2/`](/api/attributes/2).

    **This endpoint is experimental and could change without warning.**
    """
    queryset = Parent_Attribute.objects.all()
    serializer_class = ParentAttributeSerializer


class GeographyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This endpoint shows the geographies in Health Viz through `list` and `detail` views. 

    You can add the `id` field after the trailing slash to request that geography alone, e.g. [`/api/geographies/2/`](/api/geographies/2).

    To see only geographies of a certain type, add the `type` as a query parameter, e.g. [`/api/geographies/?type=county`](/api/geographies/?type=county&format=json). Possible values include `zip`, `tract`, and `county`.

    **This endpoint is experimental and could change without warning.**
    """
    serializer_class = GeographySerializer

    def get_queryset(self):
        queryset = Geography.objects.all()
        type = self.request.query_params.get('type', None)
        if type is not None:
            queryset = queryset.filter(type__slug=type)
        return queryset

class GeographyShapeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This endpoint shows the geographies in Health Viz through `list` and `detail` views along with their GeoJSON representations, which can be quite large. 

    You can add the `id` field after the trailing slash to request that geography alone, e.g. [`/api/shapes/2/`](/api/shapes/2).

    **This endpoint is experimental and could change without warning.**
    """
    queryset = Geography.objects.all()
    serializer_class = GeographyShapeSerializer

class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This endpoint shows the user-created geographic regions in Health Viz.

    You can add the `id` field after the trailing slash to request that region alone, e.g. [`/api/regions/1/`](/api/regions/1).

    **This endpoint is experimental and could change without warning.**
    """
    queryset = Region.objects.all()
    serializer_class = RegionSerializer

class DataViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This endpoint shows the data in Health Viz.

    Due to the quantity of data, you should filter by attribute, individual geography, type of geography, or any combination of these by adding `attribute`, `geography`, or `type` as query parameters. Use the attribute's `key` field, the geography's `geoid` field, and the type's `slug` field.

    For instance, the following would retrieve all population information about ZIP codes:

    [`/api/data/?attribute=POP&type=zip`](/api/data/?attribute=POP&type=zip&format=json)

    **This endpoint is experimental and could change without warning.**
    """
    serializer_class = DataSerializer

    def get_queryset(self):
        queryset = EAV.objects.all()
        geography = self.request.query_params.get('geography', None)
        attribute = self.request.query_params.get('attribute', None)
        type = self.request.query_params.get('type', None)
        if type is not None:
            queryset = queryset.filter(geography__type__slug=type)
        if geography is not None:
            queryset = queryset.filter(geography__geoid=geography)
        if attribute is not None:
            queryset = queryset.filter(attribute__key=attribute)
        return queryset


