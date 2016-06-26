from django.contrib import admin
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import Source, Category, Parent_Attribute, Attribute


# class SourceResource(resources.ModelResource):

#     class Meta:
#         model = Source
#         skip_unchanged = True
#         report_skipped = True
#         export_order = ('id', 'description', 'name', 'url',)


class SourceAdmin(ImportExportModelAdmin):
    pass


admin.site.register(Source, SourceAdmin)

admin.site.register(Category)


class ParentAttributeAdmin(ImportExportModelAdmin):
    fieldsets = [
        (None, {'fields': [
            'name', 
            'base_key', 
            'units', 
            'period',
            'source', 
            'source_exact',
            'description',
        ]}),
        ('Advanced', {'fields': [
            'denominator', 
            'technical_notes',
            'headline',
        ], 'classes': ['collapse']}),
    ]
    exclude = [
        'category',
    ]
    list_display = [
        'base_key',
        'name',
        'period',
        'source',
    ]
    list_filter = [
        'category',
        'period',
        'source',
        'denominator',
    ]
    ordering = [
        'base_key',
    ]

    def save_model(self, request, obj, form, change):
        """ Adds an un-stratified attribute with this as its parent."""
        obj.save()
        if not change:
            a = Attribute(parent=obj, key=obj.base_key)
            a.save()



admin.site.register(Parent_Attribute, ParentAttributeAdmin)


class AttributeAdmin(ImportExportModelAdmin):
    fieldsets = [
        (None, {'fields': [
            'parent',
        ]}),
        ('Stratifications', {'fields': [
            'sex_strat', 
            'race_strat', 
            'age_strat',
        ], 'classes': ['collapse']}),
    ]
    exclude = [
        'key',
    ]
    list_display = [
        'key', 
        'parent', 
    ]
    list_filter = [
        'sex_strat', 
        'race_strat', 
        'age_strat',
    ]
    ordering = (
        'key',
    )

    def create_key(self, obj):
        v = obj.parent.base_key
        if obj.age_strat or obj.sex_strat or obj.race_strat:
            v += '-'
        if obj.age_strat:
            v += obj.age_strat
        if obj.sex_strat:
            v += obj.sex_strat
        if obj.race_strat:
            v += obj.race_strat
        return v

    def save_model(self, request, obj, form, change):
        """ Adds the current user in the added_by field."""
        obj.added_by = request.user
        if not change:
            obj.key = self.create_key(obj)
            obj.save()


admin.site.register(Attribute, AttributeAdmin)



