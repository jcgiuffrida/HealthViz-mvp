from django.db import models
from attributes.models import Attribute
from geo.models import Geography, Type


class Suppression(models.Model):
    """ Reasons for suppressing individual values. Some examples:
    - The numerator for a calculated rate is too small to protect privacy.
    - The denominator for a calculated rate is too small resulting in high variance on the estimate.
    - The value is an extreme outlier not supported by other facts.
    """
    name = models.CharField(max_length=63, help_text="A short reason for suppressing this value")
    description = models.TextField(blank=True, null=True, help_text="Detailed rules for when such values are suppressed")

    def __str__(self):
        return self.name


class EAV(models.Model):
    """This is the model for the actual data, according to the entity-attribute-value schema, where the geographies are the entities."""
    geography = models.ForeignKey(Geography, on_delete=models.CASCADE)
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE)
    value = models.FloatField(blank=True, null=True)
    suppression = models.ForeignKey(Suppression, on_delete=models.SET_NULL, blank=True, null=True)

    class Meta:
        unique_together = (
            ("geography", "attribute"),
        )
        verbose_name_plural = 'EAV'


class Coverage(models.Model):
    """ This model shows which attributes are available at which geographic levels. """
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE)
    type = models.ForeignKey(Type, on_delete=models.CASCADE)
    original = models.BooleanField(default=True, help_text="Data available from the original source at this geographic level and has not been altered.")
    interpolated = models.BooleanField(default=False, help_text="Data was not available from the original source at this geographic level, so it has been calculated from another geographic level using overlap tables.")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = (
            ("attribute", "type"),
        )

    def __str__(self):
        """ Use try/except to address https://github.com/django-import-export/django-import-export/issues/439 during import/export. Once the data is in the database, it seems to pull self.attribute and self.type just fine """
        try:
            return '%s, %s' % (self.attribute, self.type)
        except:
            return 'Coverage %s' % self.id
