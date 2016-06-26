from django.shortcuts import render
from django.views import generic
from datetime import datetime
from django.db.models import Avg, Max, Min, Count

from .models import Parent_Attribute, Attribute, Source
from eav.models import Coverage, EAV


class AttrList(generic.ListView):
    model = Attribute
    template_name = 'attributes/index.html'
    context_object_name = 'attribute_list'

    # we only want the first 10 attributes
    def get_queryset(self):
        """Return all attributes."""
        return Attribute.objects.all()

    def get_context_data(self, **kwargs):
        context = super(AttrList, self).get_context_data(**kwargs)
        context['attr_count'] = super(AttrList, self).get_queryset().count()
        context['source_count'] = Source.objects.all().count()
        context['eav_count'] = EAV.objects.all().count()
        context['title'] = "Attributes"
        context['year'] = datetime.now().year
        return context


class AttrDetail(generic.DetailView):
    model = Attribute
    template_name = 'attributes/detail.html'

    def get_context_data(self, **kwargs):
        context = super(AttrDetail, self).get_context_data(**kwargs)
        # Add in a QuerySet of this attribute's coverage
        object = super(AttrDetail, self).get_object()
        # determine best coverage: first entry in Type (ZIP, then CT, then County)
        cov = Coverage.objects.filter(attribute=object).filter(original=True).order_by('type')
        if bool(cov):
            cov_list = []
            for c in cov:
                cov_list.append({
                    'name': c.type,
                    'count': EAV.objects.filter(attribute=object).filter(geography__type=c.type).count(),
                    # TD this will be expensive as the EAV table grows
                })
            best_cov = cov[0].type
            context['stats_coverage'] = best_cov
            data = EAV.objects.filter(attribute=object).filter(geography__type=best_cov)
            # TD this may include null values
            # TD this will be expensive as the EAV table grows
            context['statistics'] = {
                'count': data.count(),
                'mean': data.aggregate(Avg('value'))['value__avg'],
                'max': data.aggregate(Max('value'))['value__max'],
                'min': data.aggregate(Min('value'))['value__min'],
            }
            values = data.values_list('value', flat=True).order_by('value')
            if data.count() % 2 == 1:  # odd number
                context['statistics']['median'] = values[int(round(data.count()/2))]
            else:
                context['statistics']['median'] = sum(values[data.count()/2-1 : data.count()/2+1]) / 2.0
        else:
            pass
        related_attrs = Attribute.objects.filter(parent__category=object.parent.category).exclude(pk=object.id)[:5]
        context['related_attrs'] = related_attrs
        context['coverage'] = cov_list
        context['title'] = object.parent.name
        context['year'] = datetime.now().year
        return context


class SourcesList(generic.ListView):
    template_name = 'attributes/sources.html'
    context_object_name = 'source_list'

    def get_queryset(self):
        """Return the first 10 sources."""
        return Source.objects.annotate(num_attrs=Count('parent_attribute__attribute'))

    def get_context_data(self, **kwargs):
        context = super(SourcesList, self).get_context_data(**kwargs)
        context['title'] = "Sources"
        context['year'] = datetime.now().year
        return context


class SourceDetail(generic.DetailView):
    model = Source
    template_name = 'attributes/source_detail.html'

    def get_context_data(self, **kwargs):
        context = super(SourceDetail, self).get_context_data(**kwargs)
        object = super(SourceDetail, self).get_object()
        attributes = Attribute.objects.filter(parent__source=object)
        context['attributes'] = attributes
        context['title'] = object
        context['year'] = datetime.now().year
        return context
