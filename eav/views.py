from django.shortcuts import render
from django.http import HttpResponseRedirect
from .forms import UploadCSVForm
from .scripts import handle_uploaded_CSV
import csv


def bulk_import(request):
    if request.method == 'POST':
        form = UploadCSVForm(request.POST, request.FILES)
        if form.is_valid():
            handle_uploaded_CSV(request.FILES['file'])
            return HttpResponseRedirect('/admin/')
    else:
        form = UploadCSVForm()
    return render(request, 'eav/import.html', {'form': form})

