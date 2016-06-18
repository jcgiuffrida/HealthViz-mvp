from django.db import models

class Type(models.Model):
	name = models.CharField(max_length=127, unique=True)
	description = models.TextField(max_length=4195, blank=True, null=True)

	def __str__(self):
        return self.name


class Geography(models.Model):
	name = models.TextField(max_length=31)
	type = models.ForeignKey('Type', on_delete=models.CASCADE)
	latitude = models.DecimalField("Latitude of the centroid", max_digits=12, decimal_places=10, blank=True, null=True)
	longitude = models.DecimalField("Longitude of the centroid", max_digits=12, decimal_places=10, blank=True, null=True)
	special_area = models.BooleanField("Does this geography contain a special area, like a university, jail, or central business district?", default=False)
	special_area_name = models.CharField(max_length=127, blank=True, null=True)

	class Meta:
		unique_together = (("name", "type"),)
		index_together = [
			["type", "name"]
		]

	def __str__(self):
		return self.name


