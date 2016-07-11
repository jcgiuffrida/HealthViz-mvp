from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import Source, Category, Population, Attribute


class SourceAdmin(ImportExportModelAdmin):
    list_display = [
        'id',
        'name',
    ]
    ordering = (
        'id',
    )


admin.site.register(Source, SourceAdmin)

class CategoryAdmin(ImportExportModelAdmin):
    list_display = [
        'id',
        'name',
        'is_health_outcome',
    ]
    list_filter = [
        'is_health_outcome',
    ]
    ordering = (
        'id',
    )

admin.site.register(Category, CategoryAdmin)


class PopulationAdmin(ImportExportModelAdmin):
    exclude = [
        'key',
    ]
    list_display = [
        'key', 
        'race_or_ethnicity',
        'sex', 
        'age', 
    ]
    list_filter = [
        'race_or_ethnicity', 
        'sex', 
        'age',
    ]
    ordering = (
        'id',
    )

    def save_model(self, request, obj, form, change):
        """ Adds the current user in the added_by field."""
        if not change:
            obj.added_by = request.user
        obj.save()


admin.site.register(Population, PopulationAdmin)


class AttributeAdmin(ImportExportModelAdmin):
    fieldsets = [
        (None, {'fields': [
            'name', 
            'key', 
            'categories',
            'units', 
            'period',
            'description',
            'source', 
            'source_exact',
        ]}),
        ('Advanced', {'fields': [
            'populations', 
            'weight_by', 
            'technical_notes',
        ]}),
    ]
    exclude = [
    ]
    list_display = [
        'key',
        'name',
        'period',
        'source',
    ]
    list_filter = [
        'categories',
        'period',
        'source',
        'populations__race_or_ethnicity',
        'populations__sex', 
        'populations__age',
        'weight_by',
    ]
    ordering = [
        'key',
    ]

admin.site.register(Attribute, AttributeAdmin)

