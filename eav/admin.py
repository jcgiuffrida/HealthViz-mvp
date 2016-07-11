from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import Value, Coverage, Suppression


class CoverageAdmin(ImportExportModelAdmin):
    list_display = ['attribute', 'type', 'original']
    list_filter = ['type', 'original', ]
    ordering = ('attribute', 'type')

admin.site.register(Coverage, CoverageAdmin)


admin.site.register(Suppression)


class ValueAdmin(ImportExportModelAdmin):
    list_display = ['geography', 'attribute', 'population', 'value', 'se', 'suppression']
    list_filter = ['suppression',]

admin.site.register(Value, ValueAdmin)
