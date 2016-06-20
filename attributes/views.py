from django.shortcuts import render
from django.views import generic

from .models import Attribute, Source
from eav.models import Coverage


class AttrList(generic.ListView):
    model = Attribute
    template_name = 'attributes/index.html'
    context_object_name = 'attribute_list'

    # we only want the first 10 attributes
    def get_queryset(self):
        """Return the first 10 attributes."""
        return Attribute.objects.order_by('key')[:10]


class AttrDetail(generic.DetailView):
    model = Attribute
    template_name = 'attributes/detail.html'

    def get_context_data(self, **kwargs):
        context = super(AttrDetail, self).get_context_data(**kwargs)
        # Add in a QuerySet of this attribute's coverage
        object = super(AttrDetail, self).get_object()
        context['coverage'] = Coverage.objects.filter(attribute=object)
        return context



class SourcesList(generic.ListView):
    template_name = 'attributes/sources.html'
    context_object_name = 'source_list'

    def get_queryset(self):
        """Return the first 10 sources."""
        return Source.objects.order_by('name')[:10]


class SourceDetail(generic.DetailView):
    model = Source
    template_name = 'attributes/source_detail.html'
