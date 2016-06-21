from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import Type, Geography, Region


admin.site.register(Type)


class GeographyAdmin(ImportExportModelAdmin):
    list_display = ['__str__', 'type', 'special_area']
    list_filter = ['type', 'special_area']
    search_fields = ['name', 'special_area_name']
    ordering = ('type', 'name')

admin.site.register(Geography, GeographyAdmin)


class RegionAdmin(admin.ModelAdmin):
    list_display = ['name', 'added_by']
    list_filter = ['added_by']
    search_fields = ['name', 'description']

    def save_model(self, request, obj, form, change):
      obj.added_by = request.user
      obj.save()

admin.site.register(Region, RegionAdmin)
