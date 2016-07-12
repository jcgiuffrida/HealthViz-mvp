# Health Viz: Visualizing Illinois Communities

### What is this?
Health Viz is a platform for understanding, analyzing, and visualizing information about Illinois communities. It is managed and primarily produced by Presence Health, with components and data contributed from other organizations including the Chicago Department of Public Health. 

Health Viz provides the ability to understand how various social determinants, like economic, educational, housing, and demographic factors, affect health outcomes in Chicago and across Illinois. Maps, graphics, and advanced statistical models all provide insight into the complicated interplay of environmental and health factors. This helps identify disparities in health, understand what might be causing them, and design programs to improve health outcomes by addressing the root causes.

### How was this built?
Health Viz is built with a Django backend with interactive d3.js graphics. It is built entirely with open-source technologies, and the code is stored publicly at GitHub under the MIT License, so everything here is free to reuse or modify with attribution. The underlying data comes from numerous sources which are identified within the site. 

### Get involved
If you have ideas about how this site might be improved, notice a bug, or would like to work with us to make it better, please get in touch by [opening an issue](https://github.com/PresenceHealth/HealthViz/issues/new). 
### Deployment checklist
To run a copy of Health Viz on your own computer, you will need Python and Django.

**If you don't already have Django**

1. Install python 3.5
2. Install [pip](https://pip.pypa.io/)
3. Create a folder to hold all your virtual environments, e.g. `mkdir ~/.virtualenvs`
4. Create a virtual environment where you want everything Django to live: `python -m venv ~/.virtualenvs/Django` (or whatever name you want)
5. Run the virtual environment: `source ~/.virtualenvs/Django/bin/activate`. On Windows, just type `Scripts\activate`. You may want to put this in a bash/BATCH script that lives in your root directory so it's easy to load quickly.
6. Install django: from within the virtual environment, type `pip install django`
7. Verify that django was installed: type `python` to load Python, then type `import django; print(django.get_version())`. You should have version 1.9.x.

**After installing Django**

8. Go through the [Django tutorial](https://docs.djangoproject.com/en/1.9/intro/tutorial01/) to learn the basics of the Django framework. 
9. When you're ready to work on Health Viz, clone the GitHub repo to a folder within your Django virtual environment. 
10. Install the dependencies: `pip install -r requirements.txt`
11. The Health Viz repo includes default settings which you will need to adjust for your implementation. Find the file `HealthViz/settings/dev.py` and update the local development variables and settings, such as your database settings. 
12. In the root of the Health Viz repo, run `python manage.py migrate` to initialize your database. SQLite is probably fine for your local implementation.
13. Run `python manage.py createsuperuser` to create a local account you can use to log into the admin service.
14. Run the following to load all the models for Health Viz:

```bash
python manage.py makemigrations attributes
python manage.py makemigrations geo
python manage.py makemigrations eav
```

Then run `python manage.py migrate` to update your database.

15. Load some initial data from the JSON file in the `HealthViz/fixtures/` folder by running `python manage.py loaddata initial-data.json --ignorenonexistent`. *You must create a superuser in step #13 first.*
16. Run `python manage.py runserver` to launch Health Viz at <http://localhost:8000>. Go to <http://localhost:8000/admin> to log in using the superuser account you just created. 
