"""
Definition of views.
"""

from django.shortcuts import render
from django.http import HttpRequest
from django.template import RequestContext
from datetime import datetime

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
    return render(
        request,
        'home/about.html',
        context_instance = RequestContext(request,
        {
            'title':'About',
            'message':'Your application description page.',
            'year':datetime.now().year,
        })
    )

def SDH(request):
    """Renders a port of the original Health Viz."""
    assert isinstance(request, HttpRequest)
    return render(
        request,
        'home/SDH/index.html',
        context_instance = RequestContext(request,
        {
            'title':'SDH',
            'year':datetime.now().year,
        })
    )
