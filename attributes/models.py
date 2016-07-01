from django.db import models
from django.contrib.auth.models import User


class Source(models.Model):
    """ A source of data in Health Viz. Examples include the Chicago Department of Public Health, EPA, U.S. Census Bureau, or Presence Health. This should be the "main source" of the data, i.e. the reference you would include under a chart or graph. Details about where exactly the data came from can be included in the Parent_Attribute.source_exact field. """
    name = models.CharField(max_length=255, unique=True, help_text="Name of the source. This should be fairly short and only include the name of the data product if it's well-known.")
    description = models.TextField("Description of the source.")
    url = models.URLField("A URL for the source, such as the organization's home page.", max_length=200, blank=True, null=True, help_text="This should be a generic URL, not the URL holding the data itself.")

    class Meta:
        ordering = ['name',]
    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=63, unique=True)

    class Meta:
        verbose_name_plural = "categories"
    def __str__(self):
        return self.name

class Parent_Attribute(models.Model):
    base_key = models.CharField(max_length=12, unique=True)
    name = models.CharField(max_length=127, unique=True)
    units = models.CharField(max_length=127, blank=True, null=True, default="% of residents")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True)
    period = models.CharField(max_length=127)
    description = models.TextField(blank=True, null=True)
    source = models.ForeignKey(Source)
    source_exact = models.CharField("E.g. table number, product name", max_length=255, blank=True, null=True)
    technical_notes = models.TextField("Detailed notes on how this attribute was collected or calculated.", blank=True, null=True)

    DENOMINATORS = (
        (None, ''),
        ('Population', 'Population'),
        ('Housing units', 'Housing units'),
        ('Land area', 'Land area'),
    )
    denominator = models.CharField(max_length=31, choices=DENOMINATORS, blank=True, null=True)
    headline = models.BooleanField("Show by default", default=False)

    class Meta:
        verbose_name_plural = "parent attributes"
    def __str__(self):
        return "%s (%s)" % (self.name, self.base_key)


class Attribute(models.Model):
    parent = models.ForeignKey(Parent_Attribute, on_delete=models.CASCADE)
    key = models.CharField(max_length=12)

    AGES = (
        (None, ''),
        ('P', '0-4 years'),
        ('Q', '5-17 years'),
        ('R', '18-39 years'),
        ('S', '40-64 years'),
        ('T', '65 and older'),
        ('O', 'other'),
    )
    SEXES = (
        (None, ''),
        ('F', 'Female'),
        ('M', 'Male'),
    )
    RACES = (
        (None, ''),
        ('W', 'Non-Hispanic White'),
        ('B', 'Non-Hispanic Black'),
        ('A', 'Asian'),
        ('H', 'Hispanic/Latino'),
    )
    
    age_strat = models.CharField("age", max_length=1, choices=AGES, blank=True, null=True)
    sex_strat = models.CharField("sex", max_length=1, choices=SEXES, blank=True, null=True)
    race_strat = models.CharField("race/ethnicity", max_length=1, choices=RACES, blank=True, null=True)
    date_added = models.DateField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, editable=False)

    def __str__(self):
        """ Use try/except to address https://github.com/django-import-export/django-import-export/issues/439 during import/export. Once the data is in the database, it seems to pull self.parent.name just fine """
        try:
            v = self.parent.name + " (" + self.key + ")"
        except:
            v = self.key
        if self.age_strat:
            v += ', ' + self.get_age_strat_display()
        if self.sex_strat:
            v += ', ' + self.get_sex_strat_display()
        if self.race_strat:
            v += ', ' + self.get_race_strat_display()
        return v
