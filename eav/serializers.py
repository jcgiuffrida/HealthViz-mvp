from rest_framework import serializers
from attributes.models import Source, Population, Attribute, Category
from geo.models import Type, Geography, Region, Shape
from eav.models import Value



class NestedAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        fields = ('id', 'key', 'name', 'period', )


class SourceSerializer(serializers.ModelSerializer):
    attributes = NestedAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Source
        fields = ('id', 'name', 'description', 'url', 'attributes',)


class CategorySerializer(serializers.ModelSerializer):
    attributes = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'is_health_outcome', 'attributes',)


class AttributeSerializer(serializers.ModelSerializer):
    source = serializers.ReadOnlyField(source='source.name')
    categories = serializers.StringRelatedField(many=True, read_only=True)
    coverage = serializers.StringRelatedField(many=True, read_only=True)
    populations = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Attribute
        fields = ('id', 'key', 'name', 'units', 'categories', 
            'period', 'source', 'description', 'source_exact', 
            'weight_by', 'populations', 'coverage', )


class NestedRegionSerializer(serializers.ModelSerializer):
    added_by = serializers.ReadOnlyField(source='added_by.username')

    class Meta:
        model = Region
        fields = ('id', 'name', 'added_by', )



class GeographySerializer(serializers.ModelSerializer):
    type = serializers.StringRelatedField(read_only=True)
    regions = NestedRegionSerializer(many=True, read_only=True)

    class Meta:
        model = Geography
        fields = ('id', 'geoid', 'name', 'type', 'regions', )


class GeographyShapeSerializer(serializers.ModelSerializer):
    type = serializers.StringRelatedField(read_only=True)
    regions = NestedRegionSerializer(many=True, read_only=True)
    shape = serializers.ReadOnlyField(source='shape.shape')

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
    population = serializers.StringRelatedField(read_only=True)
    suppression = serializers.StringRelatedField(read_only=True)
    value = serializers.SerializerMethodField()
    se = serializers.SerializerMethodField()

    class Meta:
        model = Value
        fields = ('geography', 'attribute', 'population', 'value', 'se', 'suppression', )

    # cannot reveal case count when value is suppressed
    def get_value(self, obj):
        # TD we may want to allow some suppression values, e.g. warnings
        if obj.suppression:
            return None
        return obj.value

    # showing the standard error can also reveal the case count
    def get_se(self, obj):
        if obj.suppression:
            return None
        return obj.se













