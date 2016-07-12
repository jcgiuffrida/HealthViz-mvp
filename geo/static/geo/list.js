// control for map to show values
var mapinfo = L.control({
  position: 'topleft'
});

mapinfo.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'mapinfo');
    this.update();
    return this._div;
};

// update based on feature properties passed
mapinfo.update = function (props) {
  var html = '';
  if (props){
    html = '<h4>' + props.name + 
    '</h4><b>Click</b> to zoom to this ' + type + '<br><b>Right click</b> to learn more about this ' + type;
  } else {
    html = 'Hover over an area';
  }
  this._div.innerHTML = html;
};

mapinfo.addTo(map);

// extend geojson to include topojson
// Copyright (c) 2013 Ryan Clark
L.TopoJSON = L.GeoJSON.extend({  
  addData: function(jsonData) {    
    if (jsonData.type === "Topology") {
      for (key in jsonData.objects) {
        geojson = topojson.feature(jsonData, jsonData.objects[key]);
        L.GeoJSON.prototype.addData.call(this, geojson);
      }
    }    
    else {
      L.GeoJSON.prototype.addData.call(this, jsonData);
    }
  }  
});

// create empty layer
var topoLayer = new L.TopoJSON();

// set initial styles for features
var onEachFeature = function(feature, layer){
  layer.setStyle(defaultStyle);
}


// zoom to feature on mouse click
function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

// select feature
function selectFeature(e){
  window.location.href = url + this.feature.properties.id + '/';
}

function enterLayer(){  
  this.setStyle({
    fillOpacity: 0.55,
    opacity: 1,
  });
  mapinfo.update(this.feature.properties);
}

function leaveLayer(){  
  this.setStyle({
    fillOpacity: 0.35,
    opacity: 0.5,
  });
  mapinfo.update();
}

$(document).ready(function(){
  // table for the attributes
  $('#all_geos').DataTable({
    "lengthChange": false,
    "pageLength": 20,
    "dom": '<"pull-left"f>rt<"pull-left"p><"pull-right"i><"clear">',
  });

  // load the topoJSON data
  // add data to the empty layer
  setTimeout(function(){ // this gives a cleaner load experience
  topoLayer.addData(shapes);

  // properties for each feature
  topoLayer.eachLayer(function(i){

    // apply default style
    i.setStyle(defaultStyle);

    i.on({
      mouseover: enterLayer,
      mouseout: leaveLayer,
      click: zoomToFeature,
      contextmenu: selectFeature,
    });
  });

  map.addLayer(topoLayer);
  map.fitBounds(topoLayer.getBounds());
}, 100);
});