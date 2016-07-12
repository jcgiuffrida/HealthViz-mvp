from django.shortcuts import render, get_list_or_404, get_object_or_404
from django.views import generic
from django.db.models import Count
from datetime import datetime

from .models import Type, Geography, Region, Shape
from eav.models import Value


class IndexView(generic.ListView):
    """ Show all geography types with a picture and quick description.

    User stories:
    - Home page for Geographies app
    - I want to understand how Health Viz works
    - I want to decide at what level I need data
    """
    model = Type
    template_name = 'geo/index.html'
    context_object_name = 'geo_type_list'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        context['title'] = "Geographies"
        context['year'] = datetime.now().year
        return context


class GeoListView(generic.ListView):
    """ Show all geographies of a particular type. 

    User stories:
    - I want to find/search for a specific geography
    - I want to see geographies side by side
    - (?) I want to see an attribute in a full choropleth map
    """
    model = Geography
    template_name = 'geo/list.html'
    context_object_name = 'geo_list'

    def get_queryset(self, **kwargs):
        self.type = get_object_or_404(Type, slug=self.kwargs['slug'])
        self.shapes = self.type.shapes
        return Geography.objects.filter(type=self.type)

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super(GeoListView, self).get_context_data(**kwargs)
        # this should work but does not (to get population)
        # g = Geography.objects.filter(id=322).raw("select id, value AS population from eav_eav where attribute_id = 1 and geography_id = %s", [id])
        context['type'] = self.type
        context['shapelist'] = self.shapes.name
        context['shapes'] = self.shapes.read()
        context['title'] = self.type.name
        context['year'] = datetime.now().year
        return context


class GeoDetailView(generic.DetailView):
    """ Show information about one geography. 

    User stories:
    - I want to learn about my neighborhood.
    - I want to know how it stands out.
    - I want to know what places are similar.
    """
    model = Geography
    template_name = 'geo/detail.html'

    def get_object(self):
        self.type = get_object_or_404(Type, slug=self.kwargs['slug'])
        self.geography = get_object_or_404(Geography, type=self.type, geoid=self.kwargs['geoid'])
        try:
            self.shape = self.geography.shape.shape
        except:
            self.shape = {'geography': 'does not exist'}
        return self.geography

    def get_context_data(self, **kwargs):
        context = super(GeoDetailView, self).get_context_data(**kwargs)
        context['data'] = Value.objects.select_related('attribute').filter(geography=self.geography)
        context['regions'] = self.geography.regions.all()
        context['shape'] = self.shape
        context['type'] = self.type
        context['year'] = datetime.now().year
        return context


class RegionListView(generic.ListView):
    """ Show all regions. """
    model = Region
    template_name = 'geo/region_list.html'
    context_object_name = 'region_list'

    def get_queryset(self, **kwargs):
        return Region.objects.annotate(num_geographies=Count('geographies'))

    def get_context_data(self, **kwargs):
        context = super(RegionListView, self).get_context_data(**kwargs)
        context['title'] = "Regions"
        context['year'] = datetime.now().year
        return context



class RegionView(generic.DetailView):
    """ Show information about one region. """
    model = Region
    template_name = 'geo/region.html'

    def get_context_data(self, **kwargs):
        context = super(RegionView, self).get_context_data(**kwargs)
        object = super(RegionView, self).get_object()
        geographies = Geography.objects.filter(regions=object)
        shapes = Shape.objects.filter(geoid__in=geographies)
        shape_list = []
        for s in shapes:
            shape_list.append(s.shape)
        context['geographies'] = geographies
        context['shapes'] = shape_list
        context['title'] = object
        context['year'] = datetime.now().year
        return context
