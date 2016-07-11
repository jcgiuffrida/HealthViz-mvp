from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import Type, Geography, Region, Shape, Overlap

class TypeAdmin(ImportExportModelAdmin):
    list_display = [
        'id',
        'name',
    ]
    ordering = (
        'id',
    )

admin.site.register(Type, TypeAdmin)


class GeographyAdmin(ImportExportModelAdmin):
    list_display = ['__str__', 'type', 'special_area', 'special_area_name',]
    list_filter = ['type', 'special_area']
    search_fields = ['name', 'special_area_name']
    ordering = ('type', 'name')

admin.site.register(Geography, GeographyAdmin)


class ShapeAdmin(ImportExportModelAdmin):
    pass

admin.site.register(Shape, ShapeAdmin)


class RegionAdmin(ImportExportModelAdmin):
    list_display = ['name', 'added_by']
    list_filter = ['added_by']
    search_fields = ['name', 'description']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.added_by = request.user
        obj.save()

admin.site.register(Region, RegionAdmin)


class OverlapAdmin(ImportExportModelAdmin):
    pass

admin.site.register(Overlap, OverlapAdmin)