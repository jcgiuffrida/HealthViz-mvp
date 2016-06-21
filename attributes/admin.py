from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import Source, Parent_Attribute, Attribute


# class SourceResource(resources.ModelResource):

#     class Meta:
#         model = Source
#         skip_unchanged = True
#         report_skipped = True
#         export_order = ('id', 'description', 'name', 'url',)


class SourceAdmin(ImportExportModelAdmin):
    pass


admin.site.register(Source, SourceAdmin)


class ParentAttributeAdmin(ImportExportModelAdmin):
    pass


admin.site.register(Parent_Attribute, ParentAttributeAdmin)


class AttributeAdmin(ImportExportModelAdmin):
    fieldsets = [
        (None, {'fields': ['name', 'key', 'source', 'source_exact', 'period', 'description']}),
        ('Advanced', {'fields': ['denominator', 'source_url',], 'classes': ['collapse']}),
        ('Stratifications', {'fields': ['sex_strat', 'race_strat', 'age_strat',], 'classes': ['collapse']}),
    ]
    list_display = ['key', '__str__', 'period', 'source']
    list_filter = ['source', 'sex_strat', 'race_strat', 'age_strat', 'period', 'source']
    search_fields = ['name', 'description']
    ordering = ('key',)

    def save_model(self, request, obj, form, change):
      obj.added_by = request.user
      obj.save()


admin.site.register(Attribute, AttributeAdmin)



