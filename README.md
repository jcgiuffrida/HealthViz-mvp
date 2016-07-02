# Social Determinants of Health in Chicago

### What is this?
This interactive scatterplot, produced through the Epidemiology and Public Health Informatics Unit at the Chicago Department of Public Health (CDPH), allows users to plot various social determinants, like economic, educational, housing, and demographic factors, against indicators of health like obesity and mortality in Chicago's 77 community areas. A good way to get started is to click on “Examples” and go through those links. 

You can put any variables on the `X` and `Y` axes to look at their relationship. The size of the bubbles indicates a third variable, which you can change by clicking `size`. Mouse over the bubbles for more information and to identify which community area a bubble represents. You can also see summary statistics of the variables selected to the right. 

### How was this built?
This is a visualization in d3.js visualization based on <http://bl.ocks.org/msbarry/9911363>. It is built entirely with open-source technologies, and uses the MIT License, so the entire visualization is free to reuse or modify with attribution. 

### Get involved
If you have ideas about how this scatterplot might be improved, or would like to work with myself and CDPH to make it better, please <a href="mailto:jcgiuffri at gmail dot com">get in touch</a>. 
### Deployment checklist
To run Health Viz on your own computer:

**If you don't already have Django**

1. Install python 3.5
2. Install [pip](https://pip.pypa.io/)
3. Create a folder to hold all your virtual environments, e.g. `mkdir ~/.virtualenvs`
4. Create a virtual environment where you want everything Django to live: `python -m venv ~/.virtualenvs/Django` (or whatever name you want)
5. Run the virtual environment: `source ~/.virtualenvs/Django/bin/activate`. You may want to put this in a bash/BATCH script that lives in your root directory so it's easy to load quickly.
6. Install django: from within the virtual environment, type `pip install django`
7. Verify that django was installed: type `python` to load Python, then type `import django; print(django.get_version())`. You should have version 1.9.

**After installing Django**

8. Go through the [Django tutorial](https://docs.djangoproject.com/en/1.9/intro/tutorial01/) to learn the basics of the Django framework. Just use the included SQLite database. 
9. When you're ready to work on Health Viz, clone the GitHub repo to a folder within your Django virtual environment. This folder will be your local repo.
10. Install the dependencies: `pip install -r requirements.txt`
11. The Django repo does not include your settings file, which is essential. Create a folder "settings" inside of the "HealthViz" folder, and put in there a file called "dev.py". This will contain your local development variables and settings, such as your database settings. 
12. In the root of the Health Viz repo, run `python manage.py migrate` to initialize your database. SQLite should be fine for your local implementation.
13. Run `python manage.py createsuperuser` to create a local account you can use to log into the admin service.
14. Run `python manage.py makemigrations` to load all the models for Health Viz. Then run `python manage.py migrate` to update your database.
15. Run `python manage.py runserver` to launch Health Viz at <http://localhost:8000>. Go to <http://localhost:8000/admin> to log in using the superuser account you just created. 
