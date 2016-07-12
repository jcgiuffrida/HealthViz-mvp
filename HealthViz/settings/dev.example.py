# Load defaults, then add/override with private settings unique to this implementation
# see https://code.djangoproject.com/wiki/SplitSettings#SimplePackageOrganizationforEnvironments

from HealthViz.settings.defaults import *


# Set this to False when in production
DEBUG = True

# Update to your own implementation
# See https://docs.djangoproject.com/en/1.9/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(PROJECT_ROOT, 'db.sqlite3'),
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}

# This should be a long random string of letters, numbers, and symbols. Keep it secret!
SECRET_KEY = 'J*$zUwP%#J7Yk?!]OAV$/Ah8+[Q6Avax|?kHOP2u@?D7lnBk=i'

# People who should be emailed when something goes wrong.
ADMINS = (
    ('Your Name', 'Your.Name@example.com'),
)
 
MANAGERS = ADMINS

# Host/domain names that this Django site can serve
# See https://docs.djangoproject.com/en/1.9/ref/settings/#std:setting-ALLOWED_HOSTS
ALLOWED_HOSTS = (
    'localhost',
)

# Example override of a default setting. This will set the pagination of the API to 50 objects at a time, rather than 10.
REST_FRAMEWORK['PAGE_SIZE'] = 50
