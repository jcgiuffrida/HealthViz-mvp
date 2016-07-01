"""
Definition of views.
"""

from django.shortcuts import render
from django.http import HttpRequest
from django.template import RequestContext
from datetime import datetime

from attributes.models import Attribute
from geo.models import Geography
from eav.models import EAV

def home(request):
    """Renders the home page."""
    assert isinstance(request, HttpRequest)
    return render(
        request,
        'home/index.html',
        context_instance = RequestContext(request,
        {
            'title':'Home Page',
            'year':datetime.now().year,
        })
    )

def terms(request):
    """Renders the terms of use page."""
    assert isinstance(request, HttpRequest)
    return render(
        request,
        'home/terms.html',
        context_instance = RequestContext(request,
        {
            'title':'Terms of Use',
            'message':'Terms of use for Health Viz.',
            'year':datetime.now().year,
        })
    )

def about(request):
    """Renders the about page."""
    assert isinstance(request, HttpRequest)
    context = {
        'year': datetime.now().year,
        'attr_count': Attribute.objects.count(),
        'geo_count': Geography.objects.count(),
        'eav_count': EAV.objects.count(),
    }
    return render(request, 'home/about.html',
        context_instance = RequestContext(request, context)
    )
