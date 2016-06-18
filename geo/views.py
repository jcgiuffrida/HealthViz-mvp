from django.shortcuts import render
from django.views import generic
from django.shortcuts import get_list_or_404, get_object_or_404

from .models import Type, Geography, Region


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


def detail(request, UrlSlug, name):
    current_type = Type.objects.filter(slug=UrlSlug)[0]
    geo = get_object_or_404(Geography, type=current_type, name=name)
    return render(request, 'geo/detail.html', {
        'geo': geo,
        'current_type': current_type,
    })


class RegionListView(generic.ListView):
    model = Region
    template_name = 'geo/region_list.html'
    context_object_name = 'region_list'


class RegionView(generic.DetailView):
    model = Region
    template_name = 'geo/region.html'