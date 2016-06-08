from django.contrib import admin

from .models import Source, Parent_Attribute, Attribute

admin.site.register(Source)
admin.site.register(Parent_Attribute)


class AttributeAdmin(admin.ModelAdmin):
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