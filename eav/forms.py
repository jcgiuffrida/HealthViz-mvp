from django import forms


class UploadCSVForm(forms.Form):
	MODELS = (
		('Parent attributes', 'Parent attributes'),
		('Sources', 'Sources'),
		('Attributes', 'Attributes'),
		('Geographies', 'Geographies'),
		('Coverages', 'Coverages'),
		('EAV', 'EAV'),
	)
	table = forms.ChoiceField(choices=MODELS)
	file = forms.FileField()
