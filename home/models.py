from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save

class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user')
	organization = models.CharField(max_length=100, default='', blank=True)

# whenever a user model is created, create a profile for the user
def create_profile(sender, **kwargs):
	user = kwargs["instance"]
	if kwargs["created"]:
		user_profile = Profile(user=user)
		user_profile.save()

post_save.connect(create_profile, sender=User)
