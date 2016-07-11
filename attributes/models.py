from django.db import models
from django.contrib.auth.models import User


class Source(models.Model):
    """ A source of data in Health Viz. Examples include the Chicago Department of Public Health, EPA, U.S. Census Bureau, or Presence Health. This should be the "main source" of the data, i.e. the reference you would include under a chart or graph. Details about where exactly the data came from can be included in the Attribute.source_exact field. """
    name = models.CharField(max_length=100, unique=True, help_text="Name of the source. This should be fairly short and only include the name of the data product if it's well-known.")
    description = models.TextField("Description of the source.", blank=True, null=True)
    url = models.URLField("A URL for the source, such as the organization's home page.", max_length=200, blank=True, null=True, help_text="This should be a generic URL, not the URL holding the data itself.")

    class Meta:
        ordering = ['name',]
    def __str__(self):
        return self.name


class Category(models.Model):
    """ Category for attributes. These are derived from existing sources like Healthy People 2020. """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    is_health_outcome = models.BooleanField(default=False, help_text="If False, then this category reflects social determinants of health rather than health outcomes.")

    class Meta:
        verbose_name_plural = "categories"
    def __str__(self):
        return self.name


class Population(models.Model):
    """ 
    A class representing the sub-populations about which we have data. Each attribute has data about one or more populations - by default, one with no stratifications. 

    This class has nothing to do with the actual population (number of people) of an area. 
    """
    key = models.CharField(max_length=12, unique=True, editable=False, help_text="A short character string to refer to this populatio.")

    RACES = (
        (None, ''),
        ('W', 'Non-Hispanic White'),
        ('B', 'Non-Hispanic Black'),
        ('A', 'Asian or Native Hawaiian/Pacific Islander'),
        ('H', 'Hispanic or Latino'),
    )
    SEXES = (
        (None, ''),
        ('F', 'Females'),
        ('M', 'Males'),
    )
    AGES = (
        (None, ''),
        ('I', 'Infants (0-4 years)'),
        ('C', 'Children (5-17 years)'),
        ('Y', 'Young Adults (18-39 years)'),
        ('O', 'Older Adults (40-64 years)'),
        ('S', 'Seniors (65 and older)'),
    )
    
    race_or_ethnicity = models.CharField(max_length=1, choices=RACES, blank=True, null=True)
    sex = models.CharField(max_length=1, choices=SEXES, blank=True, null=True)
    age = models.CharField(max_length=1, choices=AGES, blank=True, null=True)

    def __str__(self):
        v = []
        if self.race_or_ethnicity:
            v.append(self.get_race_or_ethnicity_display())
        if self.sex:
            v.append(self.get_sex_display())
        if self.age:
            v.append(self.get_age_display())
        if v == []:
            v.append('Full population')
        return ', '.join(v)


class Attribute(models.Model):
    """ 
    The primary model for an attribute. Each Attribute is essentially an instance of this model which may have certain stratifications. 
    """
    key = models.CharField(max_length=12, unique=True, help_text="A unique three-letter key which can be used to search for this attribute and any of its stratifications.")
    name = models.CharField(max_length=100, unique=True)
    categories = models.ManyToManyField(Category, related_name='attributes')
    units = models.CharField(max_length=50, blank=True, null=True, default="% of residents", help_text="E.g. percent of residents, count, $.")
    period = models.CharField(max_length=50, help_text="The time period over which this data was collected or to which it refers.")
    description = models.TextField(blank=True, null=True, help_text="A short description of this attribute which will be displayed to the user.")
    source = models.ForeignKey(Source, related_name='attributes')
    source_exact = models.CharField("Exact source of the data", max_length=200, blank=True, null=True, help_text="E.g. table number, product name, or url. This should be specific enough that a user can use it to find the original data.")
    technical_notes = models.TextField(blank=True, null=True, help_text="Detailed notes on how this attribute was collected or calculated.")
    populations = models.ManyToManyField(Population, default=(1,),related_name="attributes", help_text="The sub-populations for which data is available about this attribute. The default is \"Full population\", which can be overriden.")

    WEIGHTINGS = (
        (None, ''),
        ('Population', 'Population'),
        ('Housing units', 'Housing units'),
        ('Land area', 'Land area'),
    )

    weight_by = models.CharField(max_length=20, choices=WEIGHTINGS, blank=True, null=True, default="Population", help_text="The base unit for this attribute when calculating rates or weighted averages across geographies.")
    date_added = models.DateField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, editable=False)

    def __str__(self):
        return "%s (%s)" % (self.name, self.key)

