from django.shortcuts import render

# Create your views here.

def doctor_view(request):
    return render(request, "doctor_view.html")