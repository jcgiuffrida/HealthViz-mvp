from django.db import models
import jsonfield
from django.contrib.auth.models import User



class Type(models.Model):
	""" The type of geography. """
	name = models.CharField(max_length=127, unique=True)
	slug = models.CharField(max_length=15, unique=True)
	description = models.TextField(blank=True, null=True, help_text="A basic description of this geography to be shown to the user.")
	technical_description = models.TextField(blank=True, null=True, help_text="Advanced details about this geography, such as how it is created or caveats.")
	plural_name = models.CharField(max_length=127, null=True, blank=True, help_text="The plural form of the name.")
	image = models.ImageField(upload_to='images', blank=True, null=True, help_text="A sample image of this geography, such as from a map or drawing.")
	shapes = models.FileField(upload_to='shapes', blank=True, null=True, help_text="A TopoJSON file of all the shapes which are part of this Type.")

	def __str__(self):
		return self.name


class Geography(models.Model):
	""" Model for the geographies. """
	geoid = models.CharField(max_length=15, verbose_name='GEOID', help_text='The <a href="https://www.census.gov/geo/reference/geoidentifiers.html" target="_blank">GEOID</a> for this geography, e.g. 60601 for a ZIP code, 17031 for a county, or 17031110100 for a census tract. The code should be numeric (with leading zeros) and uniquely identify each geography of this type. This will be used as the URL slug.')
	name = models.CharField(max_length=63, help_text="How this geography should be referred to throughout the site. This could be the same as the GEOID.")
	type = models.ForeignKey(Type, on_delete=models.CASCADE)
	latitude = models.DecimalField("Latitude of the centroid", max_digits=12, decimal_places=10, blank=True, null=True)
	longitude = models.DecimalField("Longitude of the centroid", max_digits=12, decimal_places=10, blank=True, null=True)
	special_area = models.BooleanField(default=False, help_text="Does this geography contain a special area, like a university, jail, or central business district?")
	special_area_name = models.CharField(max_length=127, blank=True, null=True, help_text="Name of the special area, if there is one.")

	class Meta:
		unique_together = (
			("name", "type"),
			("geoid", "type"))
		index_together = [
			["type", "name"]
		]
		verbose_name_plural = "geographies"
		ordering = ['geoid',]

	def __str__(self):
		return self.name


class Shape(models.Model):
	""" GeoJSON and/or TopoJSON for the geographies. We store this data separately because it can be large and slow down the main table. """
	geoid = models.OneToOneField(Geography, on_delete=models.CASCADE, related_name="shape")
	shape = jsonfield.JSONField()

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
	""" A Region is composed of one or more geographies. """
	name = models.CharField(max_length=63, unique=True, help_text="Name of the region")
	geographies = models.ManyToManyField(Geography, related_name="regions")
	description = models.TextField(help_text="Describe what this region represents and how it was created")
	date_added = models.DateField(auto_now_add=True)
	added_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

	def __str__(self):
   		return self.name

# test that if a geography is deleted, the region still remains
# TD: let us store data on regions
