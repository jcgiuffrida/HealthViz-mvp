from django.shortcuts import render

def bulk_import(request):
    return render(request, 'eav/import.html')

