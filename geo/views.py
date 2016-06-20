from django.shortcuts import render, get_list_or_404, get_object_or_404
from django.views import generic

from .models import Type, Geography, Region
from eav.models import EAV


class IndexView(generic.ListView):
    model = Type
    template_name = 'geo/index.html'
    context_object_name = 'geo_type_list'


def list(request, UrlSlug):
    current_type = Type.objects.filter(slug=UrlSlug)[0]
    geo_list = get_list_or_404(Geography, type=current_type)
    return render(request, 'geo/list.html', {
        'geo_list': geo_list, 
        'current_type': current_type,
    })


def detail(request, UrlSlug, geoid):
    current_type = Type.objects.filter(slug=UrlSlug)[0]
    geo = get_object_or_404(Geography, type=current_type, geoid=geoid)
    coverage = EAV.objects.filter(geography=geo)

    return render(request, 'geo/detail.html', {
        'geo': geo,
        'current_type': current_type,
        'coverage': coverage,
    })


class RegionListView(generic.ListView):
    model = Region
    template_name = 'geo/region_list.html'
    context_object_name = 'region_list'


class RegionView(generic.DetailView):
    model = Region
    template_name = 'geo/region.html'
