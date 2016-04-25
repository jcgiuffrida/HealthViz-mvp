// some code adapted from http://bl.ocks.org/msbarry/raw/9911363/

// global vars
var margin = {top: 10, right: 30, bottom: 10, left: 80},
    width = $('#chart').width() - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    transitionDuration = 1000,
    easingFunc = 'cubic-in-out',
    geography = "Community Area",    // starting geography
    attributes = {},
    filter = [],
    currentLegend = 'Region',
    hideSpecialAreas = false,
    hideSmallAreas = false;

    var chroma1 = 'e';

var masterComplete = false;
var mapDrawn = false;
var elementsLoaded = 0;

// create svg using global vars
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add filters
var defs = svg.append("defs");
var vizFilter = defs.append("filter")
    .attr("id", "glow")
    .attr('x', '-40%')
    .attr('y', '-40%')
    .attr('height', '200%')
    .attr('width', '200%');
vizFilter.append("feGaussianBlur")
    .attr("stdDeviation", 2)
    .attr("result", "coloredBlur");

// TD what does this do?
var feMerge = vizFilter.append("feMerge");
feMerge.append("feMergeNode")
    .attr("in", "coloredBlur")
feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");

// axes
var xAxis = d3.svg.axis()
  .tickFormat(function(d) {
    // format the tick numbers
    if (Math.abs(d) < 0.00000001){
      return '0';
    } else if(d3.formatPrefix(d).symbol == "m" | (Math.abs(d) < 2)) {
        return d3.format(",.1g")(d);
    } else {
        return d3.format(",s")(d);
    }
  })
  .orient("bottom");

var yAxis = d3.svg.axis()
  .tickFormat(function(d) {
    // format the tick numbers
    if (Math.abs(d) < 0.00000001){
      return '0';
    } else if(d3.formatPrefix(d).symbol == "m" | (Math.abs(d) < 2)) {
        return d3.format(",.1g")(d);
    } else {
        return d3.format(",s")(d);
    }
  })
  .orient("left");

// x axis
svg.append('g')
    .attr('class', 'x axis')
    .attr("transform", "translate(0," + (height+25) + ")")
  .append('text') 
    .attr('x', width)
    .attr('dy', -4)
    .style('text-anchor', 'end')
    .style('font-size', '12px')
    .attr('class', 'x label');

// y axis
svg.append('g')
    .attr('class', 'y axis')
    .attr("transform", "translate(-25,0)")
  .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('dy', 12)
    .style('text-anchor', 'end')
    .style('font-size', '12px')
    .attr('class', 'y label');






// initialize the map
var map = L.map('map', {
  center: [41.8338, -87.7334],
  zoom: 10,
  zoomControl: false
});

L.control.zoom({
  position: 'topright'
}).addTo(map);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>- <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    minZoom: 6,
    id: 'mapbox.light',
    accessToken: 'pk.eyJ1IjoiamdpdWZmcmlkYSIsImEiOiJjaW1pZnF3cXMwMDl5dXRrZ2FwbDAxOGx3In0.u5objUUR9x0mfHYy1PtYCQ'
}).addTo(map);

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
  if (Object.keys(attributes).length){
    html += '<h4>' + attributes.y.key + '</h4>';
  } else {
    html += '<h4></h4>';
  }
  html += (props ? (props.name + '<br><b>' + props[attributes.y.key] + 
    '</b> ' + (attributes.y.units || '') + 
    '<br>') : 'Hover over an area');
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

// style for features
var defaultStyle = {
  fillColor: "transparent",
  fillOpacity: 0.8,
  color:'#FFF', // line
  weight:0.5,     // line
  opacity:0.5,   // line
  smoothFactor: 0.95
};

// color features
var mapColorScale;

// dictionary for leaflet ids
var leaflet_IDs = {};

// repository for hidden features
var featureRepo = [];

var getLeafletID = function(id, geo){
  var str = [geo.replace(" ", "_") + "_" + id];
  return leaflet_IDs[str];
};


// map methods

// set initial styles for features
var onEachFeature = function(feature, layer){
  layer.setStyle(defaultStyle);
}

var mouseOverMap = false;

// highlight layer on mouse over
function enterLayer(){  
  mouseOverMap = true;
  var layer = this;
  this.bringToFront();
  this.setStyle({
    weight: 2,
    opacity: 1
  });

  mapinfo.update(this.feature.properties);

  // highlight corresponding bubble
  // TD replace with options[geo].ID or a standard ID field
  d3.selectAll('circle').classed("not-highlighted", true);
  d3.selectAll('circle').each(function(d, i){
    if (d[options[geography].ID] === layer.feature.properties.id){
      d3.select(this).classed("temp-highlighted", true);
    }
  });
}

// un-highlight layer on mouse over
function leaveLayer(){  
  mouseOverMap = false;
  var layer = this;
  this.bringToBack();
  this.setStyle({
    weight: 0.5,
    opacity: 0.5
  });

  mapinfo.update();

  // un-highlight corresponding bubble
  // build in delay so bubbles don't blink when mouse goes over a crack in the map
  mouseOverStill = setTimeout(function(){
    if (!(mouseOverMap)){
      d3.selectAll('circle').classed("not-highlighted", false);
      highlightLegend(); // reset
    }
  }, 50);

  d3.selectAll('circle').each(function(d, i){
    if (d[options[geography].ID] === layer.feature.properties.id){
      d3.select(this).classed("temp-highlighted", false);
    }
  });
}

// temporarily highlight layer on mouse over corresponding bubble
function highlightLayer(){
  var layer = this;
  this.bringToFront();
  this.setStyle({
    weight: 2,
    opacity: 1
  });

  // mapinfo.update(this.feature.properties);
}

function unhighlightLayer(){
  var layer = this;
  this.bringToBack();
  this.setStyle({
    weight: 0.5,
    opacity: 0.5
  });
}

// zoom to feature on mouse click
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}







// examples
var examples = {
  'Community Area': [
    {
      name: 'Divergence in Outcomes',
      x: 'Hardship Index',
      y: 'Years of Potential Life Lost',
      r: 'Population',
      description: "The Hardship Index tends to predict poor health outcomes (shown as Years of Potential Life Lost, or YPLL) fairly well, but there is a clear divergence among community areas. Some score highly on the Hardship Index without suffering higher YPLL."
    }, {
      name: 'A Hispanic Paradox', 
      x: 'Hardship Index',
      y: 'Years of Potential Life Lost',
      r: 'Latino',
      description: "By making the size of each bubble represent that community area's Latino population, we see that community areas that are majority Latino tend not to suffer worse health outcomes even when life is hard. Change the Y axis to different variables under Mortality, below, to see what diseases are causing this divergence in health outcomes."
    }, {
      name: 'Obesity Among the Uninsured', 
      x: 'Uninsured',
      y: 'Obesity Prevalence Estimate',
      r: 'Population',
      description: "We've long known that lack of health insurance is correlated with many adverse health indicators. Here we see that community areas with higher uninsurance rates also tend to have higher rates of obesity. (The sizes of bubbles are proportional to population.)"
    }, {
      name: 'What Makes Armour Square Different?',
      x: 'Uninsured',
      y: 'Obesity Prevalence Estimate',
      r: 'Asian, Non-Hispanic',
      description: "The clear outlier in the preceding graph is Armour Square, which has a high uninsured population but little obesity. By setting the size of bubbles proportional to their Asian, Non-Hispanic population, we find a possible explanation."
    }, {
      name: 'A Determinant of Infant Mortality', 
      x: 'Foreclosure Rate',
      y: 'Infant Mortality',
      r: 'Population',
      description: "Community areas with higher foreclosure rates are more likely to also have worse child health outcomes, especially infant mortality rates, which can increase by a factor of 10 in neighborhoods hard-hit by the foreclosure crisis."
    }, {
      name: 'Reset',
      x: 'Hardship Index',
      y: 'Infant Mortality',
      r: 'Population',
      description: ""
    }
  ],
  'Census Tract': [
    {
      name: 'Child Lead Levels',
      x: 'Built 1979 or earlier',
      y: 'Children with high blood lead levels, 2009-2013',
      r: 'Population',
      description: 'Buildings constructed before 1979, when lead was removed from paint, are correlated with high levels of lead in blood among children under 5 tested in Chicago between 2009 and 2013.'
    },
    {
      name: 'Child Lead: Persistent Racial Disparities',
      x: 'Built 1979 or earlier',
      y: 'Children with high blood lead levels, 1995-1999',
      r: 'Black',
      description: 'Yet living in an older building by no means guarantees childhood lead poisoning. In the late 1990s, a clear racial disparity was evident between neighborhoods where lead was removed from old walls and pipes, and others--predominantly black--without such investment. (The size of each bubble is proportional to the black share of its population.) Almost no majority-black Census tracts saw the percentage of children with high blood lead levels dip below 30%, while it was almost never above 60% in majority-white Census tracts.'
    },
    {
      name: 'Child Lead: Ongoing Racial Disparities',
      x: 'Built 1979 or earlier',
      y: 'Children with high blood lead levels, 2009-2013',
      r: 'Black',
      description: 'This disparity persists to the present day, though lead levels have plummeted all throughout Chicago, and almost eliminated in some minority neighborhoods.'
    },
    {
      name: 'Child Lead: An Open Data Predictor',
      x: 'Built 1979 or earlier',
      y: 'Children with high blood lead levels, 2009-2013',
      r: 'Building violations',
      description: 'When trying to explain high lead levels, an even better predictor than race is the number of building violations reported to the Department of Buildings (shown here as the size of the bubbles). Building violations may indicate poor upkeep of housing or absentee landlords, factors which contribute to accidental lead poisoning. In fact, the proportion of old buildings and the rate of violations can almost entirely identify which Census tracts have the highest blood lead levels in children--and may help prevent lead poisoning before it occurs.'
    },
    {
      name: 'Walk Score and Commuting',
      x: 'Walk Score',
      y: 'Drive alone to work',
      r: 'Population',
      description: 'Redfin\'s Walk Score indicates how many daily errands can be accomplished on foot rather than by car. Communities that are very walkable (high Walk Score) tend to have far fewer residents driving alone to work--a habit that has been shown to bleed money and decrease life spans.'
    },
    {
      name: 'High Walkability, High Potential',
      x: 'Walk Score',
      y: 'Poverty rate',
      r: 'Population',
      description: 'Given that the Walk Score measures the accessibility of shops, grocery stores, parks, and other amenities, we might expect it to be positively correlated with income. The opposite is true: places with a high Walk Score tend to have higher poverty rates. In Cook County, this finding may offer a silver lining. The most distressed communities tend to be found in older neighborhoods with abundant public and private infrastructure that could play a part in economic revitalization.'
    },
    {
      name: 'A Determinant of Poverty',
      x: 'Disability (working-age adults)',
      y: 'Labor force participation',
      r: 'Population',
      description: 'A persistent cause of poverty is the debilitating effect of a physical or mental disability. Work-related injuries and health-related disabilities continue to strike especially hard in poor communities, permanently removing residents from the labor force and making it difficult to break the cycle.'
    },
    {
      name: 'Vacant Houses and Health Insurance',
      x: 'Vacant',
      y: 'Uninsured',
      r: 'Population',
      description: 'Communities that were hit hard by the foreclosure crisis, and have very high vacancy rates, also tend to be those with large numbers of uninsured residents. The lack of stable housing wealth thus translates directly into poor health outcomes.'
    },
    {
      name: 'Reaching the Uninsured',
      x: 'Non-citizens',
      y: 'Uninsured',
      r: 'Speak English poorly',
      description: 'It\'s well-known that many of those who still have no health insurance are immigrants, documented and undocumented, who face a number of barriers to enrolling in Medicaid or other insurance plans. As you can see here, those with the greatest need of health insurance also tend to speak the least English, adding a further challenge to enrollment efforts.'
    },
    {
      name: 'Disconnected Youth',
      x: 'Median earnings for workers',
      y: 'Disconnected youth',
      r: 'Population',
      description: 'Researchers have drawn attention recently to a particularly troubling issue: a large percentage of young people in some communities are disconnected, both out of school and out of work. The fact that the median earnings in these communities tend to be lower could provide some insight: when those who do work earn a pittance, getting a job looks less attractive.'
    },
    {
      name: 'Reset',
      x: 'Household median income',
      y: 'College graduation rate',
      r: 'Population',
      description: ''
    }
  ],
  'ZIP Code': [
    {
      name: 'Reset',
      x: 'Hardship Index',
      y: 'Lung cancer incidence',
      r: 'Population',
      description: ''
    }
  ]
};


function loadExamples(arr){
  var item;
  arr.forEach(function(e){
    item = $('<a href="#" class="list-group-item list-group-item-default">')
      .append($('<h4 class="list-group-item-heading">').text(e.name));
    if (e.name == 'Reset'){
      item.find('h4').css('font-size', '15px')
        .css('color', '#777');
    } else {
      item.append($('<p class="list-group-item-text">').text(e.description));
    }
    $('#collapseExamples .list-group').append(item);
  });

}

// metadata about the options
var options = {
  'Community Area': {
    data: 'SDH ii.csv',       // name of local file
    shapes: 'data/communityareas.topo.json',  // name of local topoJSON file for map
    ID: 'ID',                 // name of numeric ID field (must be unique)
    name: 'Community Area',   // name of display name field (also unique)
    default: {                // default attributes for scatterplot
                              // important: these attributes must have roughly 100% coverage across ALL areas
      x: 'Hardship Index',
      y: 'Infant Mortality',
      r: 'Population',
      geofilter: 'Region',    // name of default geofilter / color coding field
      filter: []              // initial filter
    },
    tooltipText: function(d){ // function to create the name/description in the tooltip
      return d['Community Area'] + ' (' + d.ID + ')';
    },
    sizeRange: [2, 14],       // [ minimum radius, maximum radius ] for bubbles
    minCoverage: 0.5,        // minimum coverage a variable needs in the data to be included
    cols: [],                 // holds data from the master table
    idCols: [],               // just the identification (non-data) fields
    statistics: {},
    regions: {}               // auto-generated list of regions with counts and id numbers
  },
  'Census Tract': {
    data: 'census tract.csv',
    shapes: 'data/tracts.topo.json',
    ID: 'Tract',
    name: 'Tract',
    default: {
      x: 'Household median income',
      y: 'College graduation rate',
      r: 'Population',
      geofilter: 'random',
      filter: [{
        name: "ZIP Code", 
        values: ["60608", "60609", "60612", "60622", "60623", "60624", 
                 "60629", "60632", "60639", "60644", "60647", "60651"]
      }]
    },
    tooltipText: function(d){ // function to create the name/description in the tooltip
      var t = 'Tract ' + String(d['Tract']).substring(5) + 
        '<br>' + d.City + ', ' + d.County;
      if (d['ZIP Code'].length){
        t += ' (' + d['ZIP Code'][0] + ')';
      }
      if (d['Special area'].length){
        t += '<br>' + d['Special area'];
      }
      return t;
    },
    sizeRange: [1.5, 10],
    minCoverage: 0.1,
    cols: [],
    idCols: [],
    statistics: {},
    regions: {}
  },
  'ZIP Code': {
    data: 'zip code.csv',
    shapes: 'data/zipcodes.topo.json',
    ID: 'ZIP',
    name: 'ZIP',
    default: {
      x: 'Hardship Index',
      y: 'Lung cancer incidence',
      r: 'Population',
      geofilter: 'random',
      filter: [{
        name: 'County',
        values: ["Cook County"]
      }]
    },
    tooltipText: function(d){
      var t = d['ZIP']; 
      if (d['County'].length){
        t += '<br>' + d['County'][0];
      }
      if (d['Special area'].length){
        t += '<br>' + d['Special area'];
      }
      return t;
    },
    sizeRange: [2, 12],
    minCoverage: 0.01,
    cols: [],
    idCols: [],
    statistics: {},
    regions: {}
  }
}

// load the master table
// NOTE: the master table needs to conform to these requirements:
//   - non-data variables have the category "Identification" or "Geofilter"
//   - the master table is sorted by geography (all similar geographies are listed together)
//   - the non-data variables come first within each geography
// the data table does NOT need to be sorted by rows or columns
// any columns in the data csv that are not in the master table will not be shown

Papa.parse("master.csv",{
    download: true,
    header: true,
    complete: function(results) {
      for (r in results.data){
        var row = results.data[r];
        if (row.geography in options){
          // distinguish between the data columns and the ID columns
          if (row.category == "Identification" || row.category == "Geofilter"){
            options[row.geography].idCols.push(row);
          } else {
            options[row.geography].cols.push(row);
          }
        } else if (row.key !== ""){
          // error
          console.log("the following is not a recognized geography: ");
          console.log(row);
          continue;
        }
      }
      masterComplete = true;
  }
});



/************************
***** CREATE THE CHART ****
*************************/

// Main function
function Scatter(geo){
  // show loading screen
  $('.loading-div .text').show()
    .find('.geography-text').text(geo.toLowerCase());
  $('.loading-div .error').html('');
  $('.loading-div').show();

  var coverage = {};
  var attributesPlaced = false;
  attributes = {};              // clear attributes from previous scatterplot
  filter = options[geo].default.filter;

  geography = geo;              // tell everyone we're doing this geography
  options[geo].regions = {};
  $('#collapseExamples .list-group').empty();
  loadExamples(examples[geo]);  // fill out the examples panel
  $('#collapseExamples').collapse('hide');

  $('#legend').empty();
  $('.legend-select').empty();

  currentLegend = options[geo].default.geofilter;

  featureRepo = [];
  mapDrawn = false;
  elementsLoaded = 0;

  // clear current things
  d3.select('#controls #attributes').selectAll("*").remove();
  $('.header-attributes select').empty();
  $('#geofilters').empty();
  svg.selectAll("#circles").remove();
  svg.selectAll("#lines").remove();
  topoLayer.clearLayers();

  // turn off all existing click events or you'll have serious problems
  $('.header-attributes select').off('select2:select');
  $('#collapseExamples').off('click');
  $('#chart').off('redraw');
  $('#chart').off('redrawLegend');
  $('#chart').off('downloadCSV');


  // Read in, clean, and format the data
  d3.csv(options[geo].data, clean, function(data) {

    // update legend select element with options for legend and coloring (including random)
    options[geo].idCols.forEach(function(c){
      if (c.category == "Geofilter"){
        $('.legend-select').append('<option value="' + c.key + '">' + c.key + '</option>');
      }
    });

    $('.legend-select').append('<option value="random">Random colors</option>');

    $('.legend-select').select2({
      minimumResultsForSearch: Infinity,
      width: '100%'
    }).val(currentLegend);

    /**********************
    ********* INITIALIZE
    **********************/

    var drawn = false; // has it been drawn yet?

    // create attributes table and drop-down select inputs
    var colsTable = d3.select('#controls #attributes');
    
    $('#controls #attributes').append('<div class="panel-group" id="accordion" ' + 
      'role="tablist" aria-multiselectable="true">');

    var attrs = [
      {value: 'x'},
      {value: 'y'},
      {value: 'size'}
    ];

    // drop columns without enough coverage
    options[geo].cols = options[geo].cols.filter(function(c){
      return coverage[c.key] * 1.0 / data.length >= options[geo].minCoverage;
    });

    var cols = options[geo].cols;

    // create panels
    var currentCategory = "";
    var panel = undefined;
    for (c in cols){
      var thisCategory = cols[c].category;
      var thisCategoryHyphen = thisCategory.replace(/\s/g, "-");
      if (thisCategory !== currentCategory){
        // create and append panel
        panel = $(
          '<div class="panel panel-info">' + 
            '<div class="panel-heading" role="tab" id="' + thisCategory + '">' + 
              '<h4 class="panel-title">' + 
                '<a data-toggle="collapse" href="#collapse' + c + 
                '" aria-expanded="true" aria-controls="collapse' + c + '" class="">' + 
                thisCategory + '</a>' + 
              '</h4>' + 
            '</div>' + 
            '<div id="collapse' + c + '" class="panel-collapse collapse" role="tabpanel" ' + 
            'aria-labelledby="heading' + c + '" aria-expanded="true">' + 
              '<div class="panel-body category-' + thisCategoryHyphen + '"></div>' + 
            '</div>' + 
          '</div>');
        $('#controls #attributes .panel-group').append(panel);

        // create and append option group
        group = $('<optgroup label="' + thisCategory + '" class="category-' + thisCategoryHyphen + '">');
        $('.header-attributes select').append(group);

        currentCategory = thisCategory;
      }
      
      row(d3.select('#attributes .category-' + thisCategoryHyphen), 
        attrs, cols[c].key, cols[c]);

      $('.header-attributes select').find('.category-' + thisCategoryHyphen)
        .append('<option value="' + cols[c].key + '">' + cols[c].key + '</option>');
    }

    $('.header-attributes select').select2({
      width: '25%'
    });
    attributesPlaced = true;

    // open the first panel, whatever it is
    $('#attributes .panel').first().find('.panel-collapse').collapse('show');


    // this is the magic
    colsTable.selectAll('td a').on('click', function(d, i){
      $('#collapseExamples').find('a').removeClass('active');  // un-highlight all examples
      selectAttribute(d);
      $('.header-attributes select').filter('.' + d.col.value)
        .select2().val(d.row.key);
    });

    $('.header-attributes select').on('select2:select', function(e){
      // this should not fire unless user selects attribute using the select2
      var $select = $(this);
      var ax = attrs.filter(function(d, i){ return $select.hasClass(d.value); });
      $('#collapseExamples').find('a').removeClass('active');  // un-highlight all examples
      selectAttribute({row:findAttr(e.params.data.id),col:ax[0]}, true);
    });

    function selectAttribute(d, runImmediately) {
      var runImmediately = typeof runImmediately !== 'undefined' ? runImmediately : true;
      var geo = geography;
      attributes[d.col.value] = d.row;
      colsTable.selectAll('td a.' + d.col.value)
        .classed('selected', function (other) {
          return other.row.key === d.row.key;
          });

      $('.header-attributes select').filter('.' + d.col.value)
        .select2().val(d.row.key);

      // refresh the chart (if all three dimensions have been selected)
      if (runImmediately) { 
        if (drawn){ 
          redraw();
        }
      }

      // update attribute info in chart header NOWNOWNOW
      // this is the same function as in row() so we can consolidate later TD
      $('#chartHeader .attr-info.' + d.col.value)
        .attr("data-original-title", function(){
          var name = d.row;
          var title = [name.units, name.period].filter(function(a){ return a; }).join(', ');
          if (name.source){
            return [title, name.description, ("Source: " + name.source)]
              .filter(function(a){ return a; }).join('<br><br>');
          } else {
          return [title, name.description]
              .filter(function(a){ return a; }).join('<br><br>');
          }
        }).tooltip('fixTitle')
        .text(function(){
          return $(this).attr("data-original-title") == "" ? "" : "(Hover for attribute info)";
        });      
    }

    // get statistics after everything is drawn, and then "redraw" to show statistics
    // TD this is wasteful
    setTimeout(function(){
      var geo = geography;
      options[geo].statistics = getStatistics(data, options[geo].cols);
      selectAttribute({row:findAttr(options[geo].default.x),col:attrs[0]}, false);
      selectAttribute({row:findAttr(options[geo].default.y),col:attrs[1]}, false);
      selectAttribute({row:findAttr(options[geo].default.r),col:attrs[2]}, true);
    }, 100);

    // initial configuration
    selectAttribute({row:findAttr(options[geo].default.x),col:attrs[0]}, false);
    selectAttribute({row:findAttr(options[geo].default.y),col:attrs[1]}, false);
    selectAttribute({row:findAttr(options[geo].default.r),col:attrs[2]}, true);


    // this helps us programmatically select attributes
    function findAttr(search) {
      var geo = geography;
      var lower = search.toLowerCase();
      var v = options[geo].cols.filter(function (attr) {
        return attr.key.toLowerCase().indexOf(lower) > -1;
      })[0];
      if (v){ 
        return v;
      } else {
        // variable not found
        console.log('error: variable ' + search + ' doesn\'t exist');
        d3.select('#error').text('error: variable ' + search + ' doesn\'t exist');
      }
    }

    // some examples
    $('#collapseExamples').on('click', 'a', function(e){
      e.preventDefault();
      var btn = $(this);
      $('#collapseExamples').find('a').removeClass('active');
      btn.addClass('active');
      var example = examples[geography].filter(function(o){ return o.name == btn.find('h4').text(); });
      if (example){
        selectAttribute({row:findAttr(example[0].x),col:attrs[0]}, false);
        selectAttribute({row:findAttr(example[0].y),col:attrs[1]}, false);
        selectAttribute({row:findAttr(example[0].r),col:attrs[2]}, true);
      }
      if (example[0].name == 'Reset'){
        btn.removeClass('active');
        btn.closest('#collapseExamples').collapse('hide');
      }

    });

    // Utilities for drawing the attribute table
    function row(ele, data, display, name) {
      var row = ele.append('tr');
      row.append('td').text(display)
        .attr('data-toggle', 'tooltip')
        .attr('title', function(){
          var title = [name.units, name.period].filter(function(a){ return a; }).join(', ');
          if (name.source){
            return [title, name.description, ("Source: " + name.source)]
              .filter(function(a){ return a; }).join('<br><br>');
          } else {
          return [title, name.description]
              .filter(function(a){ return a; }).join('<br><br>');
          }
        });

      row.selectAll('button.option')
          .data(function (rowData) {
            return data.map(function (colData) {
              return {  
                row: name,
                col: colData
              };
            });
          })
          .enter()
        .append('td')
          .attr('class', 'option')
        .append('a')
          .attr('href', '#')
          .attr('class', function (d) {
            return [
              name,
              d.row,
              d.col.value
            ].filter(function (d) { return typeof d === 'string'; }).join(" ");
          })
          .text(function (d) { return d.col.value })
          .on('click.preventDefault', function () { d3.event.preventDefault(); });
    }

    // Render the scatterplot
    drawn = true;
    elementsLoaded += 1;
    var colorScale = d3.scale.category20();

    // filter data
    // TD refactor to accept arbitrary filters, so we can filter along variables too
    function applyDataFilters(rawdata){
      // handle nulls by filtering
      var filteredData = rawdata.filter(function (d) {
        return typeof d[attributes.size.key] === 'number' &&
          d[attributes.size.key] !== 0 &&
          typeof d[attributes.x.key] === 'number' &&
          typeof d[attributes.y.key] === 'number';
      });

      // apply the global filters
      if (filter.length){
        filteredData = filteredData.filter(function(d){
          var keep = false;
          filter.forEach(function(f){
            if (!keep){
              f.values.some(function(v){

                // search within string
                // TD make geofilters arrays instead of delimited strings, for speed of indexOf method
                // TD geofilters should ultimately be contained in "overlap" tables in the mysql database
                if (d[f.name].indexOf(v) !== -1){
                  keep = true;
                  return true;
                }
              });
            }
          });
          return keep;
        });
      }

      // hide areas that are occupied by special institutions like jails and universities
      if (hideSpecialAreas){
        filteredData = filteredData.filter(function(d){
          return !(d['Special area']);
        });
      }

      // hide areas with small populations (numbers are arbitrary)
      // TD make numbers user's choice?
      if (hideSmallAreas){
        filteredData = filteredData.filter(function(d){
          return d['Population'] >= (
            geography == 'Community Area' ? 5000 : 
            geography == 'Census Tract' ? 1500 :
            geography == 'ZIP Code' ? 1000 : 0);
        });
      }

      // filter the map too
      var currentlyShown = [];
      filteredData.forEach(function(d){
        currentlyShown.push(d[options[geo].ID]);
      });

      // first add anything in featureRepo that should be shown
      if (currentlyShown.length){
        for (i = 0; i < featureRepo.length; i++){
          if (currentlyShown.indexOf(featureRepo[i].properties.id) !== -1){
            topoLayer.addData(featureRepo[i]);
            featureRepo[i] = null;
          }
        }

        featureRepo = featureRepo.filter(function(f){ return f !== null; });

        // now remove anything in the map that shouldn't be there
        if (mapDrawn){
          topoLayer.eachLayer(function(e){
            if (currentlyShown.indexOf(e.feature.properties.id) === -1){
              // currently shown; remove it
              featureRepo.push(e.toGeoJSON());
              topoLayer.removeLayer(e);
            }
          });

          // update styles
          topoLayer.eachLayer(function(i){

            // record the leaflet ID so we can access this feature later
            leaflet_IDs[geo.replace(" ", "_") + "_" + i.feature.properties.id] = i._leaflet_id;

            // color
            //var fillColor = mapColorScale(i.feature.properties.id).hex();

            // apply default style
            i.setStyle(defaultStyle);
            i.setStyle({
              fillColor: "transparent"
            });

            i.on({
              mouseover: enterLayer,
              mouseout: leaveLayer,
              highlight: highlightLayer,
              unhighlight: unhighlightLayer,
              dblclick: zoomToFeature
            });
            //i.bindPopup(i.feature.properties.name);
          });

          map.fitBounds(topoLayer.getBounds());
        }
      }

      return filteredData;
    }

    // download current data as CSV
    function downloadCSV(){
      var filteredData = applyDataFilters(data);
      var csvRows = [];
      csvRows.push([
        '"' + geography + '"', 
        '"' + attributes.x.key + '"', 
        '"' + attributes.y.key + '"', 
        '"' + attributes.size.key + '"'].join(','));
      csvRows.push([
        '""', 
        '"' + attributes.x.units + '"', 
        '"' + attributes.y.units + '"', 
        '"' + attributes.size.units + '"'].join());
      
      var row;

      filteredData.forEach(function(d, index){
        row = [d[options[geo].name].trim()];
        ['x', 'y', 'size'].forEach(function(a){
          row.push(d[attributes[a].key]);
        });
        csvRows.push(row.join(','));
      });


      var csvString = csvRows.length > 2 ? csvRows.join('\n') : '';
      var a = document.createElement('a');
      a.href = 'data:attachment/csv,' +  encodeURIComponent(csvString);
      a.target = '_blank';
      a.download = geography + '.csv';

      // TD bug: doesn't update "data" first time this function runs - and then it runs again
      // this bug will be a big issue once geographies have variables with the same names
      if (csvString.length > 0){
        a.click();  
      }

      return true;
    }

    var x, y, radius;
    function redraw() {

      // filter
      var filteredData = applyDataFilters(data);

      // if insufficient data, stop
      if (filteredData.length < 2){
        $('.loading-div .error').html('<b>Insufficient data.</b><br/><br/>Please change the filters in order to view this chart.');
        $('.loading-div .text').hide();
        $('.loading-div').show();
        return true;
      } else {
        if (elementsLoaded == 2 && $('.loading-div').is(':visible')){
          // hide loading screen
          $('.loading-div .error').html('');
          $('.loading-div').hide();
        }
      }

      x = d3.scale.linear();
      y = d3.scale.linear();
      radius = d3.scale.linear();
      var errors = [];
      var xRange = d3.extent(filteredData, function (d) { return d[attributes.x.key]; });
      var yRange = d3.extent(filteredData, function (d) { return d[attributes.y.key]; });
      var radiusRange = d3.extent(filteredData, function (d) { return d[attributes.size.key]; });
      
      // if there are errors, add them to [ errors ] here

      d3.select('#error').text(errors.join("<br>"));

      // label axes
      d3.select('.x.label')
        .text(attributes.x.key + (attributes.x.units ? (" (" + attributes.x.units + ")") : ""));
      d3.select('.y.label')
        .text(attributes.y.key + (attributes.y.units ? (" (" + attributes.y.units + ")") : ""));

      // set axes
      x.domain(xRange)
        .range([0, width]);
      y.domain(yRange)
        .range([height, 0]);
      radius.range(options[geo].sizeRange)
        .domain(radiusRange);
      xAxis.scale(x);
      yAxis.scale(y);
      d3.select('.x.axis').transition().duration(transitionDuration).ease(easingFunc).call(xAxis);
      d3.select('.y.axis').transition().duration(transitionDuration).ease(easingFunc).call(yAxis);

      // always show circles above the trendline
      svg.append("g").attr("id", "lines");
      svg.append("g").attr("id", "circles");

      var areas = svg.select('#circles').selectAll('.ca')
        .data(filteredData, function (d) { 
          return d[options[geo].name]; 
        });

      // put starting/permanent attributes here
      areas.enter().append('circle')
        .attr('class', 'ca')
        .attr('fill', function (d) { 
          if (currentLegend !== "random"){
            return colorScale(options[geo].regions[d[currentLegend][0]].ID); 
          } else {
            return colorScale(Math.floor(Math.random() * 24)); 
          }
        })
        .attr('r', 0)
        .on("mouseleave", mouseout)
        .on("mouseout", mouseout)
        .on("mouseover", mouseover)
        .on("click", click);

      // reset bubble highlighting, in case new bubbles have appeared
      highlightLegend();

      areas.transition().duration(transitionDuration)
        .ease(easingFunc)
        .attr('r', function (d) { 
          if (isNaN(radius(d[attributes.size.key]))){
            console.log("error: this point has no " + attributes.size.key);
            console.log(d[attributes.size.key]);
          }
          return radius(d[attributes.size.key]); })
        .attr('cx', function (d) { 
          if (isNaN(x(d[attributes.x.key]))){
            console.log("error: this point has no " + attributes.x.key);
            console.log("name: " + d[options[geo].name]);
            console.log("value: " + d[attributes.x.key]);
            console.log("translated value: " + x(d[attributes.x.key]));
          }
          return x(d[attributes.x.key]); })
        .attr('cy', function (d) { 
          if (isNaN(y(d[attributes.y.key]))){
            console.log("error: this point has no " + attributes.y.key);
            console.log(d[attributes.y.key]);
          }
          return y(d[attributes.y.key]); })
        .attr('fill', function (d) { 
          if (currentLegend !== "random"){
            return colorScale(options[geo].regions[d[currentLegend][0]].ID); 
          } else {
            return colorScale(Math.floor(Math.random() * 24)); 
          }
        });

      areas.exit()
        .transition()
        .duration(transitionDuration)
        .ease(easingFunc)
        .attr('r', 0)   // bubbles missing values will fade out, not blink out
        .remove();


      /**********************************/
      /********** TREND LINE
      /**********************************/

      // calculate trend line and correlation coefficient
      trendCalc = leastSquares(
        filteredData.map(function(d){return +d[attributes.x.key]; }), 
        filteredData.map(function(d){return +d[attributes.y.key]; })
      );

      var xSeries = filteredData.map(function(d){return +d[attributes.x.key]; });
      var ySeries = filteredData.map(function(d){return +d[attributes.y.key]; });

      // wish we could use array destructuring
      var slope = trendCalc[0];
      var intercept = trendCalc[1];
      var rSquared = trendCalc[2];
      var rXY = trendCalc[3];

      // apply the results of the least squares regression
      var x1 = d3.min(xSeries);
      var y1 = intercept + x1 * slope;
      var x2 = d3.max(xSeries);
      var y2 = y1 + slope * (x2 - x1);
      
      // truncate line if it extends above or below the chart area
      if (y1 > d3.max(ySeries)){        // left above
        y1 = d3.max(ySeries);
        x1 = (y1 - intercept) / slope;
      } else if (y2 > d3.max(ySeries)){ // right above
        y2 = d3.max(ySeries);
        x2 = (y2 - intercept) / slope;
      }
      if (y1 < d3.min(ySeries)){        // left below
        y1 = d3.min(ySeries);
        x1 = (y1 - intercept) / slope;
      } else if (y2 < d3.min(ySeries)){ // right below
        y2 = d3.min(ySeries);
        x2 = (y2 - intercept) / slope;
      }

      // create data object with position and attributes
      var trendData = [{
        'x1': x1, 
        'y1': y1, 
        'x2': x2, 
        'y2': y2,
        'slope': slope,
        'intercept': intercept,
        'rSquared': rSquared,
        'rXY': rXY
        // TD add p-value, t-statistic
      }];

      // create "shadow" for trendline (to aid in mouseover)
      // place this first so it sits underneath trend line
      var trendlineShadow = svg.select('#lines').selectAll('.trendlineShadow')
        .data(trendData);

      trendlineShadow.enter()
        .append('line')
          .attr("class", "trendlineShadow")
          .attr("stroke", "transparent")
          .attr("stroke-width", 8)
          .on("mousemove", mMove)
          .on("mouseout", mOut);

      // create trend line
      var trendline = svg.select('#lines').selectAll(".trendline")
        .data(trendData);
        
      trendline.enter()
        .append("line")
          .attr("class", "trendline")
          .attr("stroke", "black")
          .attr("stroke-width", 0)
          .on("mousemove", mMove)
          .on("mouseout", mOut);

      trendline.transition()
        .duration(transitionDuration).ease(easingFunc)
        .attr("x1", function(d) { return x(d['x1']); })
        .attr("y1", function(d) { return y(d['y1']); })
        .attr("x2", function(d) { return x(d['x2']); })
        .attr("y2", function(d) { return y(d['y2']); })
        .attr("stroke-width", Math.abs(rXY) * 2);  // vary strength with correlation coefficient

      trendlineShadow.transition()
        .duration(transitionDuration).ease(easingFunc)
        .attr("x1", function(d) { return x(d['x1']); })
        .attr("y1", function(d) { return y(d['y1']); })
        .attr("x2", function(d) { return x(d['x2']); })
        .attr("y2", function(d) { return y(d['y2']); });
      
      
      // display R-squared
      $('#chartHeader .rSquared').text("R-squared: " + myRound(rSquared, true))
        .attr("data-original-title", function(){
          return 'The R-squared indicates that ' + myRound(rSquared*100, false) + 
            '% of the variation in ' + attributes.y.key + 
            ' can be explained by ' + attributes.x.key + '.';
        }).tooltip('fixTitle');

      // update map
      $('.mapinfo h4').text(attributes.y.key);

      var mapColorScale = chroma
        .scale('GnBu').padding([0.2, 0])
        .domain(chroma.limits(ySeries, 'q', 5));

      // add y data to map layer
      // TD this would be a good place to record what data we've passed to the map layer
      // so we don't have to repeat
      if (mapDrawn){
        filteredData.forEach(function(d){
          var value = d[attributes.y.key];
          var featureID = geo.replace(" ", "_") + "_" + d[options[geo].ID];
          try {
            topoLayer.getLayer(leaflet_IDs[featureID]).setStyle({
              fillColor: mapColorScale(value).hex()
            }).feature.properties[attributes.y.key] = value;
          } catch(err) {
            console.log(featureID);
            console.log(err);
          }
        });
      }

      // update statistics for all 3 variables for the selected areas
      // doing this here lets us calculate weighted averages for the areas currently
      // visible; however, it means re-calculating for all three variables every 
      // time we re-select any one variable
      // TD make more efficient by only calculating stats for new variables

      // NOWNOWNOW
      // for each attribute
      Object.keys(attributes).forEach(function(a){
        // calculate weighted average for the bubbles that are showing
        if (attributes[a].key !== "Population"){
          var avg = getWeightedAverage(filteredData, attributes[a].key);
          $('#chartHeader .mean.' + a).text("Weighted average: " + avg);
        }
      });

      // update tooltip for all attributes to show current filtered areas
      $('#chartHeader .mean')
        .attr("data-original-title", function(){
          var str = "This is the average (weighted by 2010-2014 population) across ";
          if (filter.length == []){
            str += 'all areas.';
          } else {
            str += 'the following areas:<br><br>';
            filter.forEach(function(f){
              str += f.name + ": " + 
                f.values.map(function(v){ return v.trim(); }).join(', ') + '<br><br>';
            });
          }
          return str;
        }).tooltip('fixTitle');

    }

    // handle interaction/tooltip for bubbles
    var tip = d3.select('.tip');
    tip.on("mouseover", mouseout);

    // create text for bubble tooltips
    function mouseover(d) {
      if (d.mouseover) { return; }
      mouseout();
      d.mouseover = true;
      var dx = Math.round(x(d[attributes.x.key]));
      var dy = Math.round(y(d[attributes.y.key]));
      tip.selectAll('.ca').html(options[geo].tooltipText(d));
      ['size', 'x', 'y'].forEach(function(attr){
        var isYear = attributes[attr].key.toLowerCase().indexOf('year') !== -1 && 
          d[attributes[attr].key] < 2050 && 
          d[attributes[attr].key] > 1600;
        tip.selectAll('.' + attr + ' .name').text(attributes[attr].key);
        tip.selectAll('.' + attr + ' .value').text(myRound(d[attributes[attr].key], false, isYear));
        tip.selectAll('.' + attr + ' .units').text(attributes[attr].units ? attributes[attr].units : "");
        if (attributes[attr].units == '$'){
          $('.tip .' + attr + ' .units').after($('.' + attr + ' .value'))
            .css("font-weight", "bold");
        } else if (attributes[attr].units[0] == '%'){
          $('.tip .' + attr + ' .units').before($('.' + attr + ' .value')
            .css("padding-right", "2px"))
            .css("font-weight", "normal");
        } else {
          $('.tip .' + attr + ' .units').before($('.' + attr + ' .value')
            .css("padding-right", "5px"))
            .css("font-weight", "normal");
        }
      });
      tip.style("display", null)
          .style("top", (dy + margin.top + 95) + "px")
          .style("left", (dx + margin.left + 25) + "px");

      // highlight in map
      map._layers[getLeafletID(d[options[geo].ID], geo)].fire('highlight');
    }

    // remove bubble tooltips
    function mouseout(d) {
      d3.selectAll('circle.ca').each(function (d) { d.mouseover = false; });
      tip.style("display", "none");

      // un-highlight in map
      if (d){
        map._layers[getLeafletID(d[options[geo].ID], geo)].fire('unhighlight');
      }
    }

    // zoom to area
    function click(d){
      // highlight in map
      map._layers[getLeafletID(d[options[geo].ID], geo)].fire('dblclick');
    }

    // interaction for trendline tooltip
    function mMove(d){
      var m = d3.mouse(this);
      var ttip = d3.select('.trendlineTip');
      d3.selectAll('.trendline')
        .attr("stroke-width", Math.abs(d['rXY']) * 2 + 0.5); // get a little wider
      // ttip.select('.corr .value').text(Math.round(d['rXY']*1000)/1000);

      // scale appropriately with the variables
      var extent = d3.max(xAxis.scale().ticks()) - d3.min(xAxis.scale().ticks());
      var scale = extent > 2500000 ? [1000000, "million-unit"] : 
                  extent > 250000 ? [100000, "hundred thousand-unit"] : 
                  extent > 25000 ? [10000, "ten thousand-unit"] : 
                  extent > 2500 ? [1000, "thousand-unit"] : 
                  extent > 250 ? [100, "hundred-unit"] : 
                  extent > 25 ? [10, "ten-unit"] : 
                  extent > 2.5 ? [1, "unit"] : 
                  extent > 0.25 ? [0.1, "0.1"] : 
                  extent > 0.025 ? [0.01, "0.01"] : 
                  [0.001, "0.001"];
      ttip.select('.y.name').text(attributes.y.key);
      ttip.select('.y.direction').text(d['slope'] >= 0 ? 'increase' : 'decrease');
      ttip.select('.y.value').text(Math.abs(Math.round(d['slope']*scale[0]*1000)/1000));
      ttip.select('.y.units').text(attributes.y.units);
      ttip.select('.x.scale').text(scale[1]);
      ttip.select('.x.name').text(attributes.x.key + 
        (attributes.x.units.length ? (' (' + attributes.x.units + ')') : ''));
      ttip.style("display", null)
        .style("top", (m[1] + margin.top + 95) + "px")
        .style("left", (m[0] + margin.left + 25) + "px");
    }

    // remove trendline tooltip
    function mOut(d){
      d3.select('.trendlineTip').style('display', 'none');
      d3.selectAll('.trendline')
        .attr("stroke-width", Math.abs(d['rXY']) * 2); // original width
    }

    if (drawn){
      redrawLegend();
      redraw();
    }

    // trigger filtering
    $('#chart').on('redraw', function(){
      redraw();
    });

    $('#chart').on('redrawLegend', function(){
      redrawLegend();
      redraw();
    }); 

    $('#chart').on('downloadCSV', function(){
      downloadCSV();
    });
    
    // make it fit, heightwise
    var totalHeight = margin.top + margin.bottom + height + 60;
    d3.select("#chart svg")
      .attr('height', totalHeight);
    d3.select(self.frameElement).style("height", totalHeight + "px");
    mouseout();

    // redraw legend and bubble colors
    function redrawLegend(){
      $('#legend').empty();

      // have to refill regions object
      options[geo].regions = {};

      // count the geofilters and assign ID numbers
      currentLegend = $('.legend-select').val();

      // random coloring
      if (currentLegend == "random"){
        $('.legend-text').closest('p').hide();
        return true;  // do nothing
      }
      
      $('.legend-text').closest('p').show();
      $('.legend-text').text(currentLegend.toLowerCase());

      var key = currentLegend;

      data.forEach(function(item){

        var regions = item[key];

        // use primary region to assign to legend
        if (regions){
          if (regions[0] in options[geo].regions){
            options[geo].regions[regions[0]].count += 1;
          } else {
            // create new key
            options[geo].regions[regions[0]] = {
              ID: Object.keys(options[geo].regions).length,
              count: 1,
              name: regions[0]
            }
          }
        }
      });

      // add legend, sorted alphabetically (put N/A up top)
      var sortedRegions = [];
      for (var r in options[geo].regions){
        sortedRegions.push(options[geo].regions[r]);
      }
      sortedRegions.sort(function(a, b){ 
        if (a.name == "N/A"){
          return -1;
        } else if (a.name > b.name){ 
          return 1; 
        } else if (a.name < b.name){
          return -1;
        } else {
          return 0;
        }
      });
      sortedRegions.forEach(function(r){
        if (r.name !== "All"){
          var entry = $('<div class="col-md-4">');
          entry.append($('<table>')
            .append($('<tr data-region="' + r.name + '"><td style="background-color: ' + 
              colorScale(r.ID) + 
              ';"></td><td>' + r.name + '</td></tr>')));
          $('#legend').append(entry);
        }
      });
    }

    // add geofilters
    // get all geofilters
    var gfs = options[geo].idCols.filter(function(c){ return c.category == 'Geofilter' || c.key == options[geo].name; });

    // create a filter for each geofilter
    for (i in gfs){
      var select = $('<select class="geofilter" data-filter="' + 
        gfs[i].key + '" multiple="multiple"></select>');
      var container = $('<div class="row gf-container">')
        .append($('<h4>' + gfs[i].key + '</h4>'))
        .append($('<div class="col-md-12">')
          .append(select));
      $('#geofilters').append(container);

      // build list of the regions in each geofilter
      var optionList = data.map(function(d){ return d[gfs[i].key]; });
      var optionUnique = {};
      var optionObjects = [];
      optionList.forEach(function(o){ 
        if (typeof(o) == 'string'){
          o = o.split("|");
        }
        o.forEach(function(p){
          if (!(p in optionUnique) && p !== ''){
            optionUnique[p] = true;
            optionObjects.push({
              id: p,
              text: p
            });
          }
        });
      });

      // sort alphabetically
      optionObjects = optionObjects.sort(function(a, b){ 
        if (a.text === "N/A"){
          return -1;
        } else if (a.text > b.text){ 
          return 1; 
        } else if (a.text < b.text){
          return -1;
        } else {
          return 0;
        }
      });
      
      // initialize select2
      var select2 = select.select2({
        data: optionObjects,
        placeholder: "Click to select",
        width: '100%',
        allowClear: true
      });

      // apply default filter
      filter.forEach(function(f){
        if (f.name == gfs[i].key){
          select2.val(f.values).trigger("change");
        }
      });

    }

    // add buttons at bottom
    $('#geofilters').append('<div class="col-md-12 text-center">' + 
      '<button class="btn btn-primary gf-filter">Apply filters</button>' + 
      '<button class="btn btn-default gf-clear">Clear all</button></div>');
    
  });

  // convert incoming strings to numbers, convert blanks to null, and count variable coverage
  function clean(item) {

    d3.keys(item).forEach(function (key) {

      // process geofilters
      if (options[geo].idCols.filter(function(c){ 
        return c.key == key && c.category == 'Geofilter'; 
        }).length > 0){
        
        // split geofilter into an array
        item[key] = item[key].split("|")
          .map(function(i){ 
            return String(i); 
          });
        if (item[key][0] === ""){
          item[key] = ['N/A'];
        }

      } else if (options[geo].cols.filter(function(c){ return c.key == key; }).length > 0){

        // process numeric fields
        if (item[key] === "" || isNaN(item[key])) {
          item[key] = null;
        } else {
          item[key] = +item[key];
          coverage[key] = (coverage[key] || 0) + 1;
        }
      }
      // be aware: if not in the master table, it will not be shown in the variable table
    });

    return item;
  }

  // initialize variable tooltips once the attributes are loaded
  var initializeTooltips = setInterval(function(){
    if (attributesPlaced){
      $('td[data-toggle="tooltip"]').tooltip({
        container: 'body',
        placement: 'left',
        html: true
      });
      clearInterval(initializeTooltips);
      return;
    }
  }, 50);

  // and initialize the correlation tooltip
  $('#chartHeader .attr-info').tooltip({
    placement: 'bottom',
    html: true
  });

  $('#chartHeader .mean').tooltip({
    placement: 'bottom',
    html: true
  });

  $('#chartHeader .rSquared').tooltip({
    placement: 'bottom'
  });

  // finally, create the map
  // download topoJSON data asynchronously
  $.getJSON(options[geo].shapes)
    .done(addTopoData);

  // load the topoJSON data
  function addTopoData(topoData){  
    // don't clear featureRepo
    // TD retain existing shapes in featureRepo to quickly re-load map
    
    // add data to the empty layer
    topoLayer.addData(topoData);

    // properties for each feature
    topoLayer.eachLayer(function(i){

      // record the leaflet ID so we can access this feature later
      leaflet_IDs[geo.replace(" ", "_") + "_" + i.feature.properties.id] = i._leaflet_id;

      // apply default style
      i.setStyle(defaultStyle);
      i.setStyle({
        fillColor: "transparent",
        smoothFactor: 0.95
      });

      i.on({
        mouseover: enterLayer,
        mouseout: leaveLayer,
        highlight: highlightLayer,
        unhighlight: unhighlightLayer,
        dblclick: zoomToFeature
      });
      //i.bindPopup(i.feature.properties.name);
    });

    map.addLayer(topoLayer);
    // map.fitBounds(topoLayer.getBounds()); // not yet
    
    // show that we're done
    mapDrawn = true;
    elementsLoaded += 1;

    // now, apply the Y series and initial filters to the chart
    $('#chart').trigger('redraw');
  }

  function getWeightedAverage(data, attr){
    if (typeof attr == "undefined" || typeof data == "undefined"){
      return ''; // no attr or data
    }
    var a = []; // attribute
    var s = 0; // dot product of attr * population
    var t = 0; // sum of population
    data.forEach(function(d){
      if (d[attr] && d.Population){
        a.push(d[attr]);
        s += d[attr] * d.Population;
        t += d.Population;
      }
    });
    var smallRange = (d3.max(a) - d3.min(a) < 3);
    return myRound(s / t, smallRange);
  }
};



// launch the application
var launch = setInterval(function(){
  if (masterComplete){
    clearLaunch();
    Scatter("Community Area");
  }
}, 10);

function clearLaunch(){ clearInterval(launch); }


/***************************
********** AUXILIARY FUNCTIONS
****************************/

// compile descriptive statistics about a variable
function getStatistics(data, cols) {
  var statistics = {};
  cols.forEach(function (c) {
    statistics[c.key] = {'data': []};
  });
  data.forEach(function (d) {
    cols.forEach(function (c) {
      if (d[c.key] !== null){
        statistics[c.key]['data'].push(d[c.key]);
      }
    })
  });
  d3.keys(statistics).forEach(function (s) {
    statistics[s]['data'] = statistics[s]['data'].sort(function(a, b) {
      return a - b;
    });
    // if range is small (< 3), show more decimals
    var smallRange = (d3.max(statistics[s]['data']) - d3.min(statistics[s]['data']) < 3);
    var isYear = s.toLowerCase().indexOf('year') !== -1 && 
      d3.max(statistics[s]['data']) < 2050 && 
      d3.min(statistics[s]['data']) > 1600;
    statistics[s]['max'] = myRound(d3.max(statistics[s]['data']), smallRange, isYear);
    statistics[s]['min'] = myRound(d3.min(statistics[s]['data']), smallRange, isYear);
    statistics[s]['mean'] = myRound(d3.mean(statistics[s]['data']), smallRange, isYear);
    statistics[s]['median'] = myRound(d3.median(statistics[s]['data']), smallRange, isYear);
    statistics[s]['25'] = myRound(d3.quantile(statistics[s]['data'], 0.25), smallRange, isYear);
    statistics[s]['75'] = myRound(d3.quantile(statistics[s]['data'], 0.75), smallRange, isYear);
  });
  return statistics;
}

// helper function for intelligent rounding:
//   adds commas for large numbers
//   removes digits after the decimal if .000 or a large number
//   can include decimals if the range of values is small (smallRange = true)
function myRound(i, smallRange, year) {
  if (smallRange) {  // give 3 digits after the decimal
    return d3.format(',g')(i.toFixed(3));
  } else if (year){
    return Math.round(i);
  } else if (Math.floor(parseFloat(i.toFixed(3))) == i || Math.abs(i) >= 1000){
    return d3.format(',g')(Math.round(i));
  } else {
    return i.toFixed(1);
  }
}

// calculate slope, intercept and r-squared of the line of best fit for the points
function leastSquares(xSeries, ySeries) {
  var reduceSumFunc = function(a, b) { return a + b; };
  
  var xBar = d3.sum(xSeries) * 1.0 / xSeries.length;
  var yBar = d3.sum(ySeries) * 1.0 / ySeries.length;

  var ssXX = d3.sum(xSeries.map(function(d) { return Math.pow(d - xBar, 2); }));
  var ssYY = d3.sum(ySeries.map(function(d) { return Math.pow(d - yBar, 2); }));
  var ssXY = d3.sum(xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); }));
    
  var slope = ssXY / ssXX;
  var intercept = yBar - (xBar * slope);
  var rSquared = Math.pow(ssXY, 2) / (ssXX * ssYY);
  var rXY = ssXY / Math.pow(ssXX * ssYY, 1/2)
  
  return [slope, intercept, rSquared, rXY];
}


// a little jQuery
$(document).ready(function(){

  // avoid ugly box around panel titles when clicked
  $('table#attributes').on('click', '.panel-title a', function(){
    this.blur();
  });

  $('#controls').on('click', '#show-instructions', function(e){
    $('#collapseInstructions').collapse('show');
  });

  // tabs
  $('ul.tabs li').on('click', 'a', function(e){
    e.preventDefault();
    if ($(this).hasClass('active')){
      // do nothing
    } else {
      $('ul.tabs a').removeClass('active');
      $(this).addClass('active');
      var geo = $(this).text();
      $('span.geography-text').text(geo.toLowerCase());
      Scatter(geo);
    }
  });

  // filtering
  $('#geofilters').on('click', '.gf-clear', function(){
    $('#geofilters .geofilter').select2("val", null);
    filter = [];
    $('#chart').trigger('redraw');
  });

  // this would be much easier in SQL
  $('#geofilters').on('click', '.gf-filter', function(){
    
    filter = [];

    $('#geofilters .geofilter').each(function(index){
      if ($(this).val()){
        filter.push({
          name: $(this).data('filter'),
          values: $(this).val()
        });
      }
    });

    $('#chart').trigger('redraw');
  });

  // redraw legend
  $('.legend-select').on('select2:select', function(e){
    $('#chart').trigger('redrawLegend');
  });

  $('#specialAreas').change(function(){
    if ($(this).is(":checked")){
      hideSpecialAreas = true;
    } else {
      hideSpecialAreas = false;
    }
    $('#chart').trigger('redraw');
  });

  $('#smallAreas').change(function(){
    if ($(this).is(":checked")){
      hideSmallAreas = true;
    } else {
      hideSmallAreas = false;
    }
    $('#chart').trigger('redraw');
  });


  // legend interactions
  // on mouseover, highlight this region but don't fade the others
  $('#legend').on('mouseover', 'tr', function(){
    var region = String($(this).data('region'));
    d3.selectAll('circle').each( function(d, i){
      if(d[currentLegend].indexOf(region) !== -1 || d3.select(this).classed("highlighted")){
        d3.select(this).classed("highlighted", true);
      }
    });
  });

  // on mouseleave, reset
  $('#legend').on('mouseleave', 'tr', highlightLegend);

  // on click, update [ highlighted ], and reset
  $('#legend').on('click', 'tr', function(){
    var alreadySelected = $(this).hasClass('selected');
    if (!alreadySelected){
      highlighted.push($(this).data('region'));
    } else {
      var c = String($(this).data('region'));
      highlighted = highlighted.filter(function(h){ return String(h) !== c; });
    }
    $(this).toggleClass('selected');
    highlightLegend();
  });

  // download
  $('.download').on('click', function(){
    $('#chart').trigger('downloadCSV');
  });

});

// keep track of which regions are highlighted
var highlighted = [];

// function to highlight all bubbles belonging to a region selected in the legend
var highlightLegend = function(){
  var anyHighlighted = false;
  d3.selectAll('circle').each(function(d, i){
    var isHighlighted = false;
    highlighted.forEach(function(h){
      d[currentLegend].forEach(function(i){
        if (i == String(h)){
          isHighlighted = true;
          anyHighlighted = true;
        }
      });
    });
    d3.select(this).classed("highlighted", isHighlighted);
  });

  // if any bubbles are highlighted, then fade the others
  if (anyHighlighted){
    d3.selectAll('circle').each(function(d, i){
      d3.select(this).classed("not-highlighted", !(d3.select(this).classed("highlighted")));
    });
  } else {
    // none are highlighted - return all to normal
    d3.selectAll('circle').classed("not-highlighted", false);
  }
};

// for people who want to help
// console.log("************************************************");
// console.log("Know how to work with JavaScript and want to make a difference in community health?");
// console.log("Get in touch to help us improve this project and find other ways to get involved. You can also join us on GitHub at https://github.com/lucaluca/SDH.");
// console.log("************************************************");

