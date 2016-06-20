from django.contrib import admin

from .models import EAV, Coverage, Suppression


class CoverageAdmin(admin.ModelAdmin):
    list_display = ['attribute', 'type', 'original', 'interpolated']
    list_filter = ['type', 'original', 'interpolated']
    ordering = ('attribute', 'type')

admin.site.register(Coverage, CoverageAdmin)


admin.site.register(Suppression)


class EAVAdmin(admin.ModelAdmin):
    list_display = ['geography', 'attribute', 'value', 'suppression']
    list_filter = ['suppression']

admin.site.register(EAV, EAVAdmin)
