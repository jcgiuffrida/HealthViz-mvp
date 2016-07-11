from django.shortcuts import render
from django.views import generic
from datetime import datetime
from django.db.models import Avg, Max, Min, Count

from .models import Population, Attribute, Source
from eav.models import Coverage, Value


class AttrList(generic.ListView):
    """ Show all available attributes.

    User stories:
    - I want to see what data is available.
    - I want to search for specific data or topics.
    """
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
        context['value_count'] = Value.objects.all().count()
        context['title'] = "Attributes"
        context['year'] = datetime.now().year
        return context


class AttrDetail(generic.DetailView):
    """ Show information about one attribute.

    User stories:
    - I want to learn more about an attribute.
    - I want to see where an attribute's data comes from.
    - I want to see summary statistics about an attribute.
    - I want to see an attribute's geographic coverage.
    - I want to find similar attributes.
    """
    model = Attribute
    template_name = 'attributes/detail.html'

    def get_context_data(self, **kwargs):
        context = super(AttrDetail, self).get_context_data(**kwargs)
        # Add in a QuerySet of this attribute's coverage
        object = super(AttrDetail, self).get_object()
        # determine best coverage: first entry in Type (ZIP, then CT, then County)
        cov = Coverage.objects.filter(attribute=object).order_by('type')
        cov_list = []
        if bool(cov):
            for c in cov:
                cov_list.append({
                    'name': c.type,
                    'count': Value.objects.filter(attribute=object).filter(geography__type=c.type).count(),
                    # TD this will be expensive as the Value table grows
                    # TD specify which population
                })
            best_cov = cov.filter(original=True)[0].type
            # the best sub-population is the one with the lowest ID
            best_pop = object.populations.all().order_by('id')[0]
            # each attribute must have at least one population
            context['stats_coverage'] = best_cov
            data = Value.objects.filter(attribute=object).filter(geography__type=best_cov).filter(population=best_pop.id)
            # TD this may include null values
            # TD this will be expensive as the Value table grows
            context['statistics'] = {
                'count': data.count(),
                'mean': data.aggregate(Avg('value'))['value__avg'],
                'max': data.aggregate(Max('value'))['value__max'],
                'min': data.aggregate(Min('value'))['value__min'],
                'population': best_pop,
            }
            values = data.values_list('value', flat=True).order_by('value')
            try:
                if data.count() % 2 == 1:  # odd number
                    context['statistics']['median'] = values[int(round(data.count()/2))]
                else:
                    context['statistics']['median'] = sum(values[data.count()/2-1 : data.count()/2+1]) / 2.0
            except AssertionError:
                # no data for this attribute
                context['statistics']['median'] = 'N/A'

        else:
            pass
        related_attrs = Attribute.objects.filter(categories__in=object.categories.all()).exclude(pk=object.id)[:5]
        context['related_attrs'] = related_attrs
        context['coverage'] = cov_list
        context['title'] = object.name
        context['year'] = datetime.now().year
        return context


class SourcesList(generic.ListView):
    """ Show all data sources.

    User stories:
    - I want to see where data is drawn from.
    """
    template_name = 'attributes/sources.html'
    context_object_name = 'source_list'

    def get_queryset(self):
        """Return the first 10 sources."""
        return Source.objects.annotate(num_attrs=Count('attributes'))

    def get_context_data(self, **kwargs):
        context = super(SourcesList, self).get_context_data(**kwargs)
        context['title'] = "Sources"
        context['year'] = datetime.now().year
        return context


class SourceDetail(generic.DetailView):
    """ Show information about one data source.

    User stories:
    - I want to learn more about how an attribute is calculated.
    - I want to know where to find the original data.
    """
    model = Source
    template_name = 'attributes/source_detail.html'

    def get_context_data(self, **kwargs):
        context = super(SourceDetail, self).get_context_data(**kwargs)
        object = super(SourceDetail, self).get_object()
        attributes = Attribute.objects.filter(source=object)
        context['attributes'] = attributes
        context['title'] = object
        context['year'] = datetime.now().year
        return context
