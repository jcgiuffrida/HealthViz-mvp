"""
Definition of urls for HealthViz.
"""

from datetime import datetime
from django.conf.urls import patterns, url
from home.forms import BootstrapAuthenticationForm
from home.views import home, contact, about
from django.contrib.auth.views import login, logout

# Uncomment the next lines to enable the admin:
from django.conf.urls import include
from django.contrib import admin
admin.autodiscover()

urlpatterns = [
    # attributes
    url(r'^attr/', include('attributes.urls')),
    url(r'^geo/', include('geo.urls')),
    url(r'^$', home, name='home'),
    url(r'^contact$', contact, name='contact'),
    url(r'^about', about, name='about'),
    url(r'^login/$', login,
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
    url(r'^logout$', logout, 
        {
            'next_page': '/',
        },
        name='logout'),

    # port of original Health Viz
    # url(r'^SDH$', 'home.views.SDH', name='SDH'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
]
