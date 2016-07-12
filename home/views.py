from django import forms
from django.shortcuts import render
from django.http import HttpRequest, HttpResponseRedirect
from django.template import RequestContext
from django.contrib.auth.forms import UserCreationForm

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Profile
from .forms import UserForm
from django.forms.models import inlineformset_factory
from django.core.exceptions import PermissionDenied


from attributes.models import Attribute
from geo.models import Geography
from eav.models import Value

def home(request):
    """Renders the home page."""
    assert isinstance(request, HttpRequest)
    return render(
    request,
        'home/index.html',
        context_instance = RequestContext(request, {})
    )

def terms(request):
    """Renders the terms of use page."""
    assert isinstance(request, HttpRequest)
    return render(
        request,
        'home/terms.html',
        context_instance = RequestContext(request, {})
    )

def about(request):
    """Renders the about page."""
    assert isinstance(request, HttpRequest)
    context = {
        'attr_count': Attribute.objects.count(),
        'geo_count': Geography.objects.count(),
        'value_count': Value.objects.count(),
    }
    return render(request, 'home/about.html',
        context_instance = RequestContext(request, context)
    )

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            return HttpResponseRedirect("/login/")
    else:
        form = UserCreationForm()
    return render(request, "home/register.html", {
        'form': form,
    })


# see https://blog.khophi.co/extending-django-user-model-userprofile-like-a-pro/ for a better explanation of the below
# @login_required() # only logged in users should access this
# def edit_user(request, pk):
#     # querying the User object with pk from url
#     user = User.objects.get(pk=pk)
 
#     # prepopulate UserProfileForm with retrieved user values from above.
#     user_form = UserForm(instance=user)
 
#     # inlineformset_factory lets us edit two related models at once
#     ProfileInlineFormset = inlineformset_factory(User, Profile, fields=('organization'))
#     formset = ProfileInlineFormset(instance=user)
    
#     # make sure that, from now on, the user is logged in and the id is the same
#     if request.user.is_authenticated() and request.user.id == user.id:
#         if request.method == "POST":
#             # need to process both forms at once
#             user_form = UserForm(request.POST, request.FILES, instance=user)
#             formset = ProfileInlineFormset(request.POST, request.FILES, instance=user)
 
#             if user_form.is_valid():
#                 created_user = user_form.save(commit=False)
#                 formset = ProfileInlineFormset(request.POST, request.FILES, instance=created_user)
 
#                 if formset.is_valid():
#                     created_user.save()
#                     formset.save()
#                     return HttpResponseRedirect('/profile/')
 
#         return render(request, "/home/update.html", {
#             "pk": pk,
#             "user_form": user_form,
#             "formset": formset,
#         })
#     else:
#         raise PermissionDenied
