from rest_framework import serializers
from attributes.models import Source, Parent_Attribute, Attribute, Category
from geo.models import Type, Geography, Region, Shape
from eav.models import EAV



class NestedParentAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent_Attribute
        fields = ('id', 'base_key', 'name', 'period', )


class SourceSerializer(serializers.ModelSerializer):
    attributes = NestedParentAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Source
        fields = ('id', 'name', 'description', 'url', 'attributes',)


class CategorySerializer(serializers.ModelSerializer):
    attributes = NestedParentAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'attributes',)


class AttributeSerializer(serializers.ModelSerializer):
    coverage = serializers.StringRelatedField(many=True, read_only=True)

    class Meta: 
        model = Attribute
        fields = ('key', 'age_strat', 'race_strat', 'sex_strat', 'coverage', )


class ParentAttributeSerializer(serializers.ModelSerializer):
    source = serializers.ReadOnlyField(source='source.name')
    category = serializers.StringRelatedField(read_only=True)
    stratifications = AttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Parent_Attribute
        fields = ('id', 'base_key', 'name', 'units', 'category', 
            'period', 'source', 'description', 'source_exact', 
            'denominator', 'stratifications', )


class NestedRegionSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='region-detail')
    added_by = serializers.ReadOnlyField(source='added_by.username')

    class Meta:
        model = Region
        fields = ('id', 'name', 'added_by', )


class NestedShapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shape
        fields = ('shape', )


class GeographySerializer(serializers.ModelSerializer):
    type = serializers.StringRelatedField(read_only=True)
    regions = NestedRegionSerializer(many=True, read_only=True)

    class Meta:
        model = Geography
        fields = ('id', 'geoid', 'name', 'type', 'regions', )


class GeographyShapeSerializer(serializers.ModelSerializer):
    type = serializers.StringRelatedField(read_only=True)
    regions = NestedRegionSerializer(many=True, read_only=True)
    shape = NestedShapeSerializer(read_only=True)

    class Meta:
        model = Geography
        fields = ('id', 'geoid', 'name', 'type', 'regions', 'shape', )


class RegionSerializer(serializers.ModelSerializer):
    geographies = serializers.StringRelatedField(many=True, read_only=True)
    added_by = serializers.ReadOnlyField(source='added_by.username')

    class Meta:
        model = Region
        fields = ('id', 'name', 'description', 'added_by', 'geographies', )


class DataSerializer(serializers.ModelSerializer):
    attribute = serializers.ReadOnlyField(source='attribute.key')
    geography = serializers.ReadOnlyField(source='geography.geoid')
    class Meta:
        model = EAV
        fields = ('geography', 'attribute', 'value', 'suppression', )














