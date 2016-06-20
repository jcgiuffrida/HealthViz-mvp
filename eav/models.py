from django.db import models
from attributes.models import Attribute
from geo.models import Geography, Type


class Suppression(models.Model):
    name = models.CharField(max_length=63)
    description = models.TextField(blank=True, null=True)

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
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE)
    type = models.ForeignKey(Type, on_delete=models.CASCADE)
    original = models.BooleanField(default=True)
    interpolated = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = (
            ("attribute", "type"),
        )

    def __str__(self):
        return '%s, %s' % (self.attribute, self.type)
