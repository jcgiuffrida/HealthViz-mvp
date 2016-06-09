from django.shortcuts import render
from django.views import generic

from .models import Attribute


class IndexView(generic.ListView):
    model = Attribute
    template_name = 'attributes/index.html'
    context_object_name = 'attribute_list'

    # we only want the first 10 attributes
    # def get_queryset(self):
    #     """Return the first 10 attributes."""
    #     return Attribute.objects.order_by('key')[:2]