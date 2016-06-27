from django.shortcuts import render, get_list_or_404, get_object_or_404
from django.views import generic
from datetime import datetime

from .models import Type, Geography, Region
from eav.models import EAV


class IndexView(generic.ListView):
    model = Type
    template_name = 'geo/index.html'
    context_object_name = 'geo_type_list'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        context['title'] = "Geographies"
        context['year'] = datetime.now().year
        return context


class GeoListView(generic.ListView):
    model = Geography
    template_name = 'geo/list.html'
    context_object_name = 'geo_list'

    def get_queryset(self, **kwargs):
        self.type = get_object_or_404(Type, slug=self.kwargs['slug'])
        return Geography.objects.filter(type=self.type)

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super(GeoListView, self).get_context_data(**kwargs)
        # this should work but does not (to get population)
        # g = Geography.objects.filter(id=322).raw("select id, value AS population from eav_eav where attribute_id = 1 and geography_id = %s", [id])
        context['type'] = self.type
        context['title'] = self.type.name
        context['year'] = datetime.now().year
        return context


class GeoDetailView(generic.DetailView):
    model = Geography
    template_name = 'geo/detail.html'

    def get_object(self):
        self.type = get_object_or_404(Type, slug=self.kwargs['slug'])
        self.geography = get_object_or_404(Geography, type=self.type, geoid=self.kwargs['geoid'])
        return self.geography

    def get_context_data(self, **kwargs):
        context = super(GeoDetailView, self).get_context_data(**kwargs)
        context['data'] = EAV.objects.select_related('attribute').filter(geography=self.geography)
        context['regions'] = self.geography.regions.all()
        context['type'] = self.type
        context['year'] = datetime.now().year
        return context


class RegionListView(generic.ListView):
    model = Region
    template_name = 'geo/region_list.html'
    context_object_name = 'region_list'

    def get_context_data(self, **kwargs):
        context = super(RegionListView, self).get_context_data(**kwargs)
        context['title'] = "Regions"
        context['year'] = datetime.now().year
        return context



class RegionView(generic.DetailView):
    model = Region
    template_name = 'geo/region.html'

    def get_context_data(self, **kwargs):
        context = super(RegionView, self).get_context_data(**kwargs)
        object = super(RegionView, self).get_object()
        geographies = Geography.objects.filter(regions=object)
        context['geographies'] = geographies
        context['title'] = object
        context['year'] = datetime.now().year
        return context
