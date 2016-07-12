from datetime import datetime
from django.conf.urls import patterns, url
from home.forms import BootstrapAuthenticationForm
from home.views import home, terms, about
from django.contrib.auth.views import login, logout
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import include
from django.contrib import admin
admin.autodiscover()

urlpatterns = [
    # attributes
    url(r'^attr/', include('attributes.urls', namespace='attributes')),
    url(r'^geo/', include('geo.urls', namespace='geo')),
    url(r'^api/', include('eav.urls')),
    url(r'^$', home, name='home'),
    url(r'^terms$', terms, name='terms'),
    url(r'^about', about, name='about'),
    url(r'^login/$', login,
        {
            'template_name': 'home/login.html',
            'authentication_form': BootstrapAuthenticationForm,
        },
        name='login'),
    url(r'^logout$', logout, 
        {
            'next_page': '/',
        },
        name='logout'),
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
