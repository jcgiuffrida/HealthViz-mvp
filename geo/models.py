from django.db import models
from django.contrib.auth.models import User
import csv


class Type(models.Model):
	name = models.CharField(max_length=127, unique=True)
	slug = models.CharField(max_length=15, unique=True)
	description = models.TextField(blank=True, null=True)
	plural_name = models.CharField(max_length=127, unique=True, null=True, blank=True)

	def __str__(self):
		return self.name


class Geography(models.Model):
	geoid = models.CharField(max_length=15, verbose_name='GEOID', help_text='The <a href="https://www.census.gov/geo/reference/geoidentifiers.html" target="_blank">GEOID</a> for this geography, e.g. 60601 for a ZIP code, 17031 for a county, or 17031110100 for a census tract. The code must be numeric (with leading zeros) and uniquely identify each geography of this type.')
	name = models.CharField(max_length=63)
	type = models.ForeignKey(Type, on_delete=models.CASCADE)
	latitude = models.DecimalField("Latitude of the centroid", max_digits=12, decimal_places=10, blank=True, null=True)
	longitude = models.DecimalField("Longitude of the centroid", max_digits=12, decimal_places=10, blank=True, null=True)
	special_area = models.BooleanField("Does this geography contain a special area, like a university, jail, or central business district?", default=False)
	special_area_name = models.CharField(max_length=127, blank=True, null=True)

	class Meta:
		unique_together = (
			("name", "type"),
			("geoid", "type"))
		index_together = [
			["type", "name"]
		]
		verbose_name_plural = "geographies"

	def __str__(self):
		return self.name


# class Overlap(models.Model):
# 	"""Store the overlap of different geographies, e.g. ZIP code and census tract. This table is de-normalized for simplicity because all information will be loaded at once. The table can help do the following things:

# 		- Convert a variable from one geography to another: for each ZIP code, calculate the weighted average of a variable currently existing at the census tract level
# 		- Help identify geographies: for a given census tract, what ZIP code is it primarily in?
# 		"""
# 	from_type = models.ForeignKey(Type, on_delete=models.CASCADE)
# 	from_geo = models.ForeignKey(Geography, on_delete=models.CASCADE)
# 	to_type = models.ForeignKey(Type, on_delete=models.CASCADE)
# 	to_geo = models.ForeignKey(Geography, on_delete=models.CASCADE)


class Region(models.Model):
	name = models.CharField(max_length=63, unique=True)
	geographies = models.ManyToManyField(Geography, related_name="regions")
	description = models.TextField()
	date_added = models.DateField(auto_now_add=True)
	added_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

	def __str__(self):
   		return self.name

# test that if a geography is deleted, the region still remains
# TD: let us store data on regions
