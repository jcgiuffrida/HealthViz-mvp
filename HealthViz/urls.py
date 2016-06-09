"""
Definition of urls for HealthViz.
"""

from datetime import datetime
from django.conf.urls import patterns, url
from home.forms import BootstrapAuthenticationForm

# Uncomment the next lines to enable the admin:
from django.conf.urls import include
from django.contrib import admin
admin.autodiscover()

urlpatterns = [
    # attributes
    url(r'^attr/', include('attributes.urls')),
    url(r'^$', 'home.views.home', name='home'),
    url(r'^contact$', 'home.views.contact', name='contact'),
    url(r'^about', 'home.views.about', name='about'),
    url(r'^login/$',
        'django.contrib.auth.views.login',
        {
            'template_name': 'home/login.html',
            'authentication_form': BootstrapAuthenticationForm,
            'extra_context':
            {
                'title':'Log in',
                'year':datetime.now().year,
            }
        },
        name='login'),
    url(r'^logout$',
        'django.contrib.auth.views.logout',
        {
            'next_page': '/',
        },
        name='logout'),

    # port of original Health Viz
    url(r'^SDH$', 'home.views.SDH', name='SDH'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
]
