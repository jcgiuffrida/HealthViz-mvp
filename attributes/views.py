from django.shortcuts import render
from django.views import generic

from .models import Attribute, Source


class IndexView(generic.ListView):
    model = Attribute
    template_name = 'attributes/index.html'
    context_object_name = 'attribute_list'

    # we only want the first 10 attributes
    def get_queryset(self):
        """Return the first 10 attributes."""
        return Attribute.objects.order_by('key')[:10]


class AttrDetailView(generic.DetailView):
    model = Attribute
    template_name = 'attributes/detail.html'


class SourcesView(generic.ListView):
    template_name = 'attributes/sources.html'
    context_object_name = 'source_list'

    def get_queryset(self):
        """Return the first 10 sources."""
        return Source.objects.order_by('name')[:10]


class SourceDetailView(generic.DetailView):
    model = Source
    template_name = 'attributes/source_detail.html'
