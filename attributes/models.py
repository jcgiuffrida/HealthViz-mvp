from django.db import models
from django.contrib.auth.models import User


class Source(models.Model):
    """ A data source. Each entry in this model should be an entity that provides data (e.g. a government agency, organization, or company) rather than the specific name of the product. The sole exception is the American Community Survey, because it is used so frequently. """
    name = models.CharField(max_length=255, unique=True, help_text="Name of the source. This should be fairly short and only include the name of the data product if it's well-known.")
    description = models.TextField("Description of the source.")
    url = models.URLField("A URL for the source, such as the organization's home page.", max_length=200, blank=True, null=True, help_text="This should be a generic URL, not the URL holding the data itself.")

    class Meta:
        ordering = ['name',]
    def __str__(self):
        return self.name


class Category(models.Model):
    """ Category for attributes. These are derived from existing sources like Healthy People 2020. """
    name = models.CharField(max_length=63, unique=True)

    class Meta:
        verbose_name_plural = "categories"
    def __str__(self):
        return self.name

class Parent_Attribute(models.Model):
    """ The primary model for an attribute. Each Attribute is essentially an instance of this model which may have certain stratifications. """
    base_key = models.CharField(max_length=12, unique=True, help_text="A unique three-letter key which can be used to search for this attribute and any of its stratifications.")
    name = models.CharField(max_length=127, unique=True)
    units = models.CharField(max_length=127, blank=True, null=True, default="% of residents", help_text="E.g. percent of residents, count, $.")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True)
    period = models.CharField(max_length=127, help_text="The time period over which this data was collected or to which it refers.")
    description = models.TextField(blank=True, null=True, help_text="A short description of this attribute which will be displayed to the user.")
    source = models.ForeignKey(Source)
    source_exact = models.CharField("Exact source of the data", max_length=255, blank=True, null=True, help_text="E.g. table number, product name. This should be specific enough that a user can use it to find the original data.")
    technical_notes = models.TextField(blank=True, null=True, help_text="Detailed notes on how this attribute was collected or calculated.")

    DENOMINATORS = (
        (None, ''),
        ('Population', 'Population'),
        ('Housing units', 'Housing units'),
        ('Land area', 'Land area'),
    )
    denominator = models.CharField(max_length=31, choices=DENOMINATORS, blank=True, null=True, help_text="The base unit for this attribute when calculating rates or weighted averages across geographies.")
    headline = models.BooleanField("Show by default", default=False)

    class Meta:
        verbose_name_plural = "parent attributes"
    def __str__(self):
        return "%s (%s)" % (self.name, self.base_key)


class Attribute(models.Model):
    """ An instance of the Parent_Attribute model which may have stratifications on age, sex, and/or race-ethnicity. Attribute is the model which other apps connect to and inherits most of its information from its parent. """
    parent = models.ForeignKey(Parent_Attribute, on_delete=models.CASCADE)
    key = models.CharField(max_length=12, help_text="A unique key consisting of the parent's base key and any stratifications. For instance, \"POP\" is the full population of this geography, while \"POP-M\" is the male population, and \"POP-MHY\" is the population of male Hispanic youth.")

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
