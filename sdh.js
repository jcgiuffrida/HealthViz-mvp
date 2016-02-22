// some code adapted from http://bl.ocks.org/msbarry/raw/9911363/

// global vars
var margin = {top: 10, right: 30, bottom: 10, left: 80},
    width = $('#chart').width() - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    transitionDuration = 1000,
    easingFunc = 'cubic-in-out',
    geography = "Community Area",    // starting geography
    attributes = {},
    filter = [];


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
    .attr('dy', -3)
    .style('text-anchor', 'end')
    .attr('class', 'x label');

// y axis
svg.append('g')
    .attr('class', 'y axis')
    .attr("transform", "translate(-25,0)")
  .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('dy', 10)
    .style('text-anchor', 'end')
    .attr('class', 'y label');


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
      name: 'Red Hot Renter\'s Market',
      x: 'Median gross rent (2005-2009)',
      y: 'Median gross rent',
      r: 'Severely rent-burdened',
      description: 'In many places in the Chicagoland region, rent is substantially higher than it was five years ago, as shown by the numerous areas far above the diagonal line. However, the proportion of residents who are severely rent-burdened, spending more than 50% of their income on rent (shown by the size of the bubbles), is very worrisome.'
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
    ID: 'ID',                 // name of numeric ID field
    name: 'Community Area',   // name of display name field
    default: {                // default attributes for scatterplot
                              // important: these attributes must have roughly 100% coverage across ALL areas
      x: 'Hardship Index',
      y: 'Infant Mortality',
      r: 'Population',
      geofilter: 'Region'     // name of default geofilter / color coding field
    },
    tooltipText: function(d){ // function to create the name/description in the tooltip
      return d['Community Area'] + ' (' + d.ID + ')';
    },
    sizeRange: [2, 12],       // [ minimum radius, maximum radius ] for bubbles
    minCoverage: 0.5,        // minimum coverage a variable needs in the data to be included
    cols: [],                 // holds data from the master table
    idCols: [],               // just the identification (non-data) fields
    statistics: {},
    regions: {}               // auto-generated list of regions with counts and id numbers
  },
  'Census Tract': {
    data: 'census tract.csv',
    ID: 'Tract',
    name: 'Tract',
    default: {
      x: 'Household median income',
      y: 'College graduation rate',
      r: 'Population',
      geofilter: 'County'
    },
    tooltipText: function(d){ // function to create the name/description in the tooltip
      var t = 'Tract ' + String(d['Tract']).substring(5) + 
        '<br>' + d.City + ', ' + d.County;
      if (d['ZIP Code'].length){
        t += ' (' + d['ZIP Code'].split('|')[0] + ')';
      }
      return t;
    },
    sizeRange: [1, 10],
    minCoverage: 0.3,
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
  }
});



/************************
***** CREATE THE CHART ****
*************************/

// Main function
function Scatter(geo){
  // show loading screen
  $('#chart .loading-div').text('Loading...');
  $('#chart .loading-div').show();

  var coverage = {};
  var attributesPlaced = false;
  attributes = {};              // clear attributes from previous scatterplot
  filter = [];

  geography = geo;              // tell everyone we're doing this geography
  options[geo].regions = {};
  $('#collapseExamples .list-group').empty();
  loadExamples(examples[geo]);  // fill out the examples panel
  $('#collapseExamples').collapse('hide');

  $('#legend').empty();


  // Read in, clean, and format the data
  d3.csv(options[geo].data, clean, function(data) {
    
    /**********************
    ********* INITIALIZE
    **********************/

    var drawn = false; // has it been drawn yet?

    // create attributes table
    var colsTable = d3.select('#controls #attributes');
    colsTable.selectAll("*").remove();

    $('#controls #attributes').append('<div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">');
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
              '<div class="panel-body category-' + thisCategory.replace(/\s/g, "-") + '"></div>' + 
            '</div>' + 
          '</div>');
        $('#controls #attributes .panel-group').append(panel);
        currentCategory = thisCategory;
      }
      
      row(d3.select('#attributes .category-' + thisCategory.replace(/\s/g, "-")), 
        attrs, cols[c].key, cols[c]);
    }

    attributesPlaced = true;

    // open the first panel, whatever it is
    $('#attributes .panel').first().find('.panel-collapse').collapse('show');


    // this is the magic
    colsTable.selectAll('td a').on('click', selectAttribute);
    function selectAttribute(d, runImmediately) {
      var runImmediately = typeof runImmediately !== 'undefined' ? runImmediately : true;
      var geo = geography;
      attributes[d.col.value] = d.row;
      colsTable.selectAll('td a.' + d.col.value)
        .classed('selected', function (other) {
          return other.row.key === d.row.key;
          });

      // refresh the chart (if all three dimensions have been selected)
      if (runImmediately) { 
        if (drawn){ 
          redraw();
        }
      }
      
      // refresh statistics
      if (Object.keys(options[geo].statistics).length) {
        var stats = ['mean', 'median', 'min', '25', '75', 'max'];
        var table = $('.statistics table');
        table.find('thead .' + d.col.value).html('<h5>' + d.row.key + '<br/>' + 
          '<small>' + (d.row.units ? d.row.units : '') + '</small></h5>');
        // prettier stats number formats
        stats.forEach(function (s) {
          table.find('.' + s + ' .' + d.col.value).text(
            options[geo].statistics[d.row.key][s]);
        });
      }
      
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
    var colorScale = d3.scale.category20();

    var x, y, radius;
    function redraw() {

      // handle nulls by filtering
      var filteredData = data.filter(function (d) {
        return typeof d[attributes.size.key] === 'number' &&
          d[attributes.size.key] !== 0 &&
          typeof d[attributes.x.key] === 'number' &&
          typeof d[attributes.y.key] === 'number';
      });

      if (filter.length){
        filteredData = filteredData.filter(function(d){
          var keep = false;
          filter.forEach(function(f){
            if (!keep){
              f.values.some(function(v){
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

      // TD make all geofilters arrays instead of delimited strings, for speed of indexOf method

      // if insufficient data, stop
      if (filteredData.length < 2){
        $('#chart .loading-div').html('<b>Insufficient data.</b><br/><br/>Please change the filters in order to view this chart.');
        $('#chart .loading-div').show();
        return true;
      } else {
        if ($('#chart .loading-div').is(':visible')){
          // hide loading screen
          $('#chart .loading-div').html('Loading...');
          $('#chart .loading-div').hide();
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
      d3.select('.x.label').text(attributes.x.key + (attributes.x.units ? (" (" + attributes.x.units + ")") : ""));
      d3.select('.y.label').text(attributes.y.key + (attributes.y.units ? (" (" + attributes.y.units + ")") : ""));

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

      var areas = svg.select('#circles').selectAll('.ca').data(filteredData, function (d) { return d[options[geo].name]; });

      areas.enter().append('circle')
        .attr('class', 'ca')
        .attr('region', function(d){
          return options[geo].regions[d[options[geo].default.geofilter]].ID; })
        .attr('fill', function (d) { 
          return colorScale(options[geo].regions[d[options[geo].default.geofilter]].ID); })
        .attr('r', 0)
        .on("mouseleave", mouseout)
        .on("mouseout", mouseout)
        .on("mouseover", mouseover);
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
          return y(d[attributes.y.key]); });
      areas.exit()
        .transition()
        .duration(transitionDuration)
        .ease(easingFunc)
        .attr('r', 0)   // bubbles missing values will fade out, not blink out
        .remove();

      // trend line
      // calculate trend line and correlation coefficient
      trendCalc = leastSquares(
        filteredData.map(function(d){return +d[attributes.x.key]; }), 
        filteredData.map(function(d){return +d[attributes.y.key]; })
      );
      // console.log("calculations: " + trendCalc.map(function(d) { return " " + Math.floor(d * 100) / 100; }));

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

      var trendData = [[x1,y1,x2,y2]];
      // console.log("points: " + trendData[0].map(function(d) { return " " + Math.floor(d * 100) / 100; }));

      var trendline = svg.select('#lines').selectAll(".trendline")
        .data(trendData);
        
      trendline.enter()
        .append("line")
        .attr("class", "trendline")
        .attr("stroke", "black")
        .attr("stroke-width", 0);

      trendline.transition()
        .duration(transitionDuration).ease(easingFunc)
        .attr("x1", function(d) { return x(d[0]); })
        .attr("y1", function(d) { return y(d[1]); })
        .attr("x2", function(d) { return x(d[2]); })
        .attr("y2", function(d) { return y(d[3]); })
        .attr("stroke-width", Math.abs(rXY) * 2);  // vary strength with correlation coefficient
      
      
      // display R-squared
      $('#chartHeader .rSquared').text("R-squared: " + myRound(rSquared, true))
        .attr("data-original-title", function(){
          return 'The R-squared measures the percentage of variation in ' + attributes.y.key + 
            ' that is explained by ' + attributes.x.key + 
            '. It ranges from 0 to 1, where 1 means that the relationship is perfect. ';
        }).tooltip('fixTitle');
    }

    // handle interaction/tooltip
    var tip = d3.select('.tip');
    tip.on("mouseover", mouseout);

    // create text for tooltip
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
          .style("top", (dy + margin.top + 55) + "px")
          .style("left", (dx + margin.left + 15) + "px");
    }

    function mouseout(d) {
      d3.selectAll('circle.ca').each(function (d) { d.mouseover = false; });
      tip.style("display", "none");
    }

    // remove any existing scatterplots
    svg.selectAll("#circles").remove();
    svg.selectAll("#lines").remove();

    if (drawn){
      redraw();
    }

    // trigger filtering
    $('#chart').on('redraw', function(){
      redraw();
    });
    
    // make it fit, heightwise
    var totalHeight = margin.top + margin.bottom + height + 60;
    d3.select("#chart svg")
      .attr('height', totalHeight);
    d3.select(self.frameElement).style("height", totalHeight + "px");
    mouseout();

    // add legend
    var sortedRegions = [];
    for (var r in options[geo].regions){
      sortedRegions.push(options[geo].regions[r]);
      sortedRegions.sort(function(a, b) {return b.count - a.count});
    }
    sortedRegions.forEach(function(r){
      if (r.name !== "All"){
        var entry = $('<div class="col-md-4">');
        entry.append($('<table>')
          .append($('<tr data-region="' + r.ID + '"><td style="background-color: ' + 
            colorScale(r.ID) + 
            ';"></td><td>' + r.name + '</td></tr>')));
        $('#legend').append(entry);
      }
    });

    // add geofilters
    $('#geofilters').empty();
    var gfs = options[geo].idCols.filter(function(c){ return c.category == 'Geofilter'; });
    for (i in gfs){
      var select = $('<select class="geofilter" data-filter="' + 
        gfs[i].key + '" multiple="multiple"></select>');
      var container = $('<div class="row gf-container">')
        .append($('<h4>' + gfs[i].key + '</h4>'))
        .append($('<div class="col-md-12">')
          .append(select));
      $('#geofilters').append(container);

      // build list of the regions
      var optionList = data.map(function(d){ return d[gfs[i].key]; });
      var optionUnique = {};
      var optionObjects = [];
      optionList.forEach(function(o){ 
        o.split('|').forEach(function(p){
          if (!(p in optionUnique)){
            optionUnique[p] = true;
            optionObjects.push({
              id: p,
              text: p
            });
          }
        });
      });

      // sort
      optionObjects = optionObjects.sort(function(a, b){ 
        if (a.text > b.text){ 
          return 1; 
        } else if (a.text < b.text){
          return -1;
        } else {
          return 0;
        }
      });
      
      select.select2({
        data: optionObjects,
        placeholder: "Click to select",
        width: '100%',
        allowClear: true
      });

    }

    $('#geofilters').append('<div class="col-md-12 text-center">' + 
      '<button class="btn btn-primary gf-filter">Apply filters</button>' + 
      '<button class="btn btn-default gf-clear">Clear all</button></div>');

    // hide loading screen
    $('#chart .loading-div').hide();
    
  });

  // convert incoming strings to numbers, convert blanks to null, and count variable coverage
  function clean(item) {
    d3.keys(item).forEach(function (key) {
      if (options[geo].idCols.filter(function(c){ return c.key == key; }).length > 0) {
        if (key == options[geo].default.geofilter) {
          // count the geofilters and assign ID numbers
          if (item[key] in options[geo].regions){
            options[geo].regions[item[key]].count += 1;
          } else {
            // create new key
            options[geo].regions[item[key]] = {
              ID: Object.keys(options[geo].regions).length,
              count: 1,
              name: item[key]
            }
          }
        }
      } else {
        if (item[key] === "" || isNaN(item[key])) {
          item[key] = null;
        } else {
          item[key] = +item[key];
          coverage[key] = (coverage[key] || 0) + 1;
        }
      }
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

  // and finally, initialize the correlation tooltip
  $('#chartHeader div').tooltip({
    placement: 'bottom'
  });
};

// launch the application
Scatter("Community Area");



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


  // legend
  $('#legend').on('mouseover', 'tr', function(){
    var region = $(this).data('region');
    d3.selectAll('circle').each( function(d, i){
      if(d3.select(this).attr("region") == region){
        d3.select(this).classed("highlighted", true);
      } else if (d3.select(this).attr("region") != highlighted) {
        d3.select(this).classed("highlighted", false);
      }
    });
  });

  var highlighted = -1;
  
  $('#legend').on('mouseleave', 'tr', function(){
    var region = $(this).data('region');
    d3.selectAll('circle').each( function(d, i){
      if(d3.select(this).attr("region") == region && highlighted != region){
        d3.select(this).classed("highlighted", false);
      }
    });
  });

  $('#legend').on('click', 'tr', function(){
    var region = $(this).data('region');
    if (highlighted != region){
      $(this).closest('.row').find('#legend tr').removeClass('selected');
      $(this).addClass('selected');
      highlighted = region;
      d3.selectAll('circle').each( function(d, i){
        if(d3.select(this).attr("region") == region){
          d3.select(this).classed("highlighted", true);
          d3.select(this).classed("not-highlighted", false);
        } else {
          d3.select(this).classed("highlighted", false);
          d3.select(this).classed("not-highlighted", true);
        }
      });
    } else {
      $(this).removeClass('selected');
      highlighted = -1;
      d3.selectAll('circle').each( function(d, i){
        if(d3.select(this).attr("region") == region){
          d3.select(this).classed("highlighted", false);
        } else {
          // turn all highlighting off
          d3.select(this).classed("not-highlighted", false);
        }
      });
    }
  });

});

// for people who want to help
console.log("************************************************");
console.log("Know how to work with JavaScript and want to make a difference in community health?");
console.log("Get in touch to help us improve this project and find other ways to get involved. You can also join us on GitHub at https://github.com/lucaluca/SDH.");
console.log("************************************************");

/*




*/
