// some code adapted from http://bl.ocks.org/msbarry/raw/9911363/

// global vars
var margin = {top: 10, right: 30, bottom: 10, left: 80},
    width = $('#chart').width() - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    transitionDuration = 1000,
    maxRadius = 12,
    minRadius = 2,
    minCoverage = 0.5,  // minimum coverage a variable needs in the data to be included
    geography = "Community Area";

// create svg using global vars
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add filters
var defs = svg.append("defs");
var filter = defs.append("filter")
    .attr("id", "glow")
    .attr('x', '-40%')
    .attr('y', '-40%')
    .attr('height', '200%')
    .attr('width', '200%');
filter.append("feGaussianBlur")
    .attr("stdDeviation", 2)
    .attr("result", "coloredBlur");

var feMerge = filter.append("feMerge");
feMerge.append("feMergeNode")
    .attr("in", "coloredBlur")
feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");


// examples
var examples = [
  { 
    name: 'Divergence in Outcomes',
    x: 'Hardship Index',
    y: 'Years of Potential Life Lost',
    r: 'Population',
    geography: "Community Area",
    description: "The Hardship Index tends to predict poor health outcomes (shown as Years of Potential Life Lost, or YPLL) fairly well, but there is a clear divergence among community areas. Some score highly on the Hardship Index without suffering higher YPLL."
  }, {
    name: 'A Hispanic Paradox', 
    x: 'Hardship Index',
    y: 'Years of Potential Life Lost',
    r: 'Latino',
    geography: "Community Area",
    description: "By making the size of each bubble represent that community area's Latino population, we see that community areas that are majority Latino tend not to suffer worse health outcomes even when life is hard. Change the Y axis to different variables under Mortality, below, to see what diseases are causing this divergence in health outcomes."
  }, {
    name: 'Obesity Among the Uninsured', 
    x: 'Uninsured',
    y: 'Obesity Prevalence Estimate',
    r: 'Population',
    geography: "Community Area",
    description: "We've long known that lack of health insurance is correlated with many adverse health indicators. Here we see that community areas with higher uninsurance rates also tend to have higher rates of obesity. (The sizes of bubbles are proportional to population.)"
  }, {
    name: 'What Makes Armour Square Different?',
    x: 'Uninsured',
    y: 'Obesity Prevalence Estimate',
    r: 'Asian, Non-Hispanic',
    geography: "Community Area",
    description: "The clear outlier in the preceding graph is Armour Square, which has a high uninsured population but little obesity. By setting the size of bubbles proportional to their Asian, Non-Hispanic population, we find a possible explanation."
  }, {
    name: 'A Determinant of Infant Mortality', 
    x: 'Foreclosure Rate',
    y: 'Infant Mortality',
    r: 'Population',
    geography: "Community Area",
    description: "Community areas with higher foreclosure rates are more likely to also have worse child health outcomes, especially infant mortality rates, which can increase by a factor of 10 in neighborhoods hard-hit by the foreclosure crisis."
  }, {
    name: 'Reset',
    x: 'Hardship Index',
    y: 'Infant Mortality',
    r: 'Population',
    geography: "Community Area",
    description: ""
  }
];

loadExamples(examples.filter(function(e){ return e.geography == geography; }));

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
// load the master table
// NOTE: the master table needs to conform to these requirements:
//   - non-data variables have the category "Identification" or "Geofilter"
//   - the master table is sorted by Geography (all similar geographies are listed together)
//   - the non-data variables come first within each geography

var master;
var cols = [];
var nonNumeric = [];
Papa.parse("master.csv",{
    download: true,
    header: true,
    complete: function(results) {
      master = results.data;
      for (row in master){
        if (master[row].geography == geography){
          // distinguish between the data columns and the ID columns
          if (master[row].category == "Identification" || master[row].category == "Geofilter"){
            nonNumeric.push(master[row].key);
          } else { // right geography, but actual data
            cols.push(master[row]);
          }
        }
      }
  }
});

/************************
***** CREATE THE CHART ****
*************************/

var coverage = {};
var attributesPlaced = false;

// Read in, clean, and format the data
d3.csv("SDH ii.csv", clean, function(data) {
  var drawn = false; // has it been drawn?

  // drop columns without full coverage
  cols = cols.filter(function(c){
    return coverage[c.key] * 1.0 / data.length >= minCoverage;
  });
  
  var statistics = false;


  // create attributes table
  var colsTable = d3.select('#controls #attributes');
  $('#controls #attributes').append('<div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">');
  var attrs = [
    {value: 'x'},
    {value: 'y'},
    {value: 'size'}
  ];
  var attributes = {};

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
  function selectAttribute(d) {
    attributes[d.col.value] = d.row;
    colsTable.selectAll('td a.' + d.col.value)
      .classed('selected', function (other) {
        return other.row.key === d.row.key;
    });

    // refresh the chart (if all three dimensions have been selected)
    if (Object.keys(attributes).length == 3) { 
      redraw();
    
      // refresh statistics
      if (statistics) {
        var stats = ['mean', 'median', 'min', '25', '75', 'max'];
        var table = $('.statistics table');
        table.find('thead .' + d.col.value).html('<h5>' + d.row.key + '<br/>' + 
          '<small>' + (d.row.units ? d.row.units : '') + '</small></h5>');
        // prettier stats number formats
        stats.forEach(function (s) {
          table.find('.' + s + ' .' + d.col.value).text(
            statistics[d.row.key][s] > 999 ? d3.format(',g')(statistics[d.row.key][s]) : 
            statistics[d.row.key][s]);
        });
      }
    }
    
  }

  // get statistics after everything is drawn, and then "redraw" to show statistics
  setTimeout(function(){
    statistics = getStatistics(data, cols);
    selectAttribute({row:findAttr('Hardship Index'),col:attrs[0]});
    selectAttribute({row:findAttr('Infant Mortality'),col:attrs[1]});
    selectAttribute({row:findAttr('Population'),col:attrs[2]});
  }, 100);




  selectAttribute({row:findAttr('Hardship Index'),col:attrs[0]});
  selectAttribute({row:findAttr('Infant Mortality'),col:attrs[1]});
  selectAttribute({row:findAttr('Population'),col:attrs[2]});


  // this helps us programmatically select attributes
  function findAttr(search) {
    var lower = search.toLowerCase();
    var v = cols.filter(function (attr) {
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
    var example = examples.filter(function(o){ return o.name == btn.find('h4').text(); });
    if (example){
      selectAttribute({row:findAttr(example[0].x),col:attrs[0]});
      selectAttribute({row:findAttr(example[0].y),col:attrs[1]});
      selectAttribute({row:findAttr(example[0].r),col:attrs[2]});
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
            .filter(function(a){ return a; }).join('<br>');
        } else {
        return [title, name.description]
            .filter(function(a){ return a; }).join('<br>');
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
  var colorScale = d3.scale.category10();
  var colorConversion = ['#2f2f2f', '#d62728', '#2ca02c', '#9467bd', 
    '#5091C8', '#A57D55', '#17becf', '#DBDB4A', '#e377c2', '#ff7f0e'];

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




  var x, y, radius;
  function redraw() {
    if (drawn) {
      var easingFunc = 'cubic-in-out';
      x = d3.scale.linear();
      y = d3.scale.linear();
      radius = d3.scale.linear();
      var errors = [];
      var xRange = d3.extent(data, function (d) { return d[attributes.x.key]; });
      var yRange = d3.extent(data, function (d) { return d[attributes.y.key]; });
      var radiusRange = d3.extent(data, function (d) { return d[attributes.size.key]; });
      
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
      radius.range([minRadius, maxRadius])
        .domain(radiusRange);
      xAxis.scale(x);
      yAxis.scale(y);
      d3.select('.x.axis').transition().duration(transitionDuration).ease(easingFunc).call(xAxis);
      d3.select('.y.axis').transition().duration(transitionDuration).ease(easingFunc).call(yAxis);

      // handle nulls by filtering
      var filteredData = data.filter(function (d) {
        return typeof d[attributes.size.key] === 'number' &&
          d[attributes.size.key] !== 0 &&
          typeof d[attributes.x.key] === 'number' &&
          typeof d[attributes.y.key] === 'number';
      });

      // always show circles above the trendline
      svg.append("g").attr("id", "lines");
      svg.append("g").attr("id", "circles");

      var areas = svg.select('#circles').selectAll('.ca').data(filteredData, function (d) { return d['Community Area']; });

      areas.enter().append('circle')
        .attr('class', function (d) {
          return d.Region === 0 ? 'chicago ca' : 'ca'; })
        .attr('fill', function (d) { return colorConversion[d.Region]; })
        .attr('region', function(d) { return d.Region; })
        .attr('r', 0)
        .on("mouseleave", mouseout)
        .on("mouseout", mouseout)
        .on("mouseover", mouseover);
      areas.transition().duration(transitionDuration)
        .ease(easingFunc)
        .attr('r', function (d) { return radius(d[attributes.size.key]); })
        .attr('cx', function (d) { return x(d[attributes.x.key]); })
        .attr('cy', function (d) { return y(d[attributes.y.key]); });
      areas.exit()
        .transition()
        .duration(transitionDuration)
        .ease(easingFunc)
        .remove();

      // trend line
      // calculate trend line and correlation coefficient
      trendCalc = leastSquares(
        filteredData.map(function(d){return d[attributes.x.key]; }), 
        filteredData.map(function(d){return d[attributes.y.key]; })
      );
      // console.log("calculations: " + trendCalc.map(function(d) { return " " + Math.floor(d * 100) / 100; }));

      var xSeries = filteredData.map(function(d){return d[attributes.x.key]; });
      var ySeries = filteredData.map(function(d){return d[attributes.y.key]; });

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
      
      
      // display correlation coefficient on the chart
      // svg.selectAll("text.text-label").remove();
      // svg.append("text")
      //   .transition()
      //   .duration(transitionDuration).ease(easingFunc)
      //   .text("Correlation: " + Math.floor(rXY * 100) / 100)
      //   .attr("class", "text-label")
      //   .attr("x", function(d) {return x(x2) - 80;})
      //   .attr("y", function(d) {return y(y2) - 5;});
      
  
    }
  }

  // handle interaction/tooltip
  var tip = d3.select('.tip');
  tip.on("mouseover", mouseout);

  function d3Round(d){
    return d > 999 ? d3.format(',g')(d) : d;
  }

  // create text for tooltip
  function mouseover(d) {
    if (d.mouseover) { return; }
    mouseout();
    d.mouseover = true;
    var dx = Math.round(x(d[attributes.x.key]));
    var dy = Math.round(y(d[attributes.y.key]));
    tip.selectAll('.ca').text((d['Community Area'] + ' (' + d['ID'] + ')'));
    tip.selectAll('.rd .name').text(attributes.size.key);
    tip.selectAll('.rd .value').text(d3Round(d[attributes.size.key]));
    tip.selectAll('.rd .units').text(attributes.size.units ? attributes.size.units : "");
    tip.selectAll('.x .name').text(attributes.x.key);
    tip.selectAll('.x .value').text(d3Round(d[attributes.x.key]));
    tip.selectAll('.x .units').text(attributes.x.units ? attributes.x.units : "");
    tip.selectAll('.y .name').text(attributes.y.key);
    tip.selectAll('.y .value').text(d3Round(d[attributes.y.key]));
    tip.selectAll('.y .units').text(attributes.y.units ? attributes.y.units : "");
    tip.style("display", null)
        .style("top", (dy + margin.top + 10) + "px")
        .style("left", (dx + margin.left + 10) + "px");
  }

  function mouseout(d) {
    d3.selectAll('circle.ca').each(function (d) { d.mouseover = false; });
    tip.style("display", "none");
  }

  redraw();

  // make it fit, heightwise
  var totalHeight = margin.top + margin.bottom + height + 60;
  d3.select("#chart svg")
    .attr('height', totalHeight);
  d3.select(self.frameElement).style("height", totalHeight + "px");
  mouseout();

});



/***************************
********** AUXILIARY FUNCTIONS
****************************/

// convert incoming strings to numbers, convert blanks to null, and count variable coverage
function clean(item) {
  d3.keys(item).forEach(function (key) {
    if (nonNumeric.indexOf(key) !== -1) {
      // do nothing: not a data field
    } else {
      if (item[key] === "") {
        item[key] = null;
      } else {
        item[key] = +item[key];
        coverage[key] = (coverage[key] || 0) + 1;
      }
    }
  });
  return item;
}


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
    statistics[s]['max'] = myRound(d3.max(statistics[s]['data']), smallRange);
    statistics[s]['min'] = myRound(d3.min(statistics[s]['data']), smallRange);
    statistics[s]['mean'] = myRound(d3.mean(statistics[s]['data']), smallRange);
    statistics[s]['median'] = myRound(d3.median(statistics[s]['data']), smallRange);
    statistics[s]['25'] = myRound(d3.quantile(statistics[s]['data'], 0.25), smallRange);
    statistics[s]['75'] = myRound(d3.quantile(statistics[s]['data'], 0.75), smallRange);
  });
  return statistics;
}

// helper function to remove digits after the decimal if .00 or a large number
function myRound(i, smallRange) {
  if (smallRange) {
    return i.toFixed(3);
  } else if (Math.floor(parseFloat(i.toFixed(3))) == i || i >= 10000){
    return d3.format(',g')(Math.round(i));
  } else {
    return i.toFixed(1);
  }
}

// calculate slope, intercept and r-squared of the line of best fit for the points
function leastSquares(xSeries, ySeries) {
  var reduceSumFunc = function(a, b) { return a + b; };
  
  var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
  var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

  var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
    .reduce(reduceSumFunc);
  
  var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
    .reduce(reduceSumFunc);
    
  var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
    .reduce(reduceSumFunc);
    
  var slope = ssXY / ssXX;
  var intercept = yBar - (xBar * slope);
  var rSquared = Math.pow(ssXY, 2) / (ssXX * ssYY);
  var rXY = ssXY / Math.pow(ssXX * ssYY, 1/2)
  
  return [slope, intercept, rSquared, rXY];
}


// a little jQuery
$(document).ready(function(){

  $('table#attributes').on('click', '.panel-title a', function(){
    this.blur();
  });

  $('#controls').on('click', '#show-instructions', function(e){
    $('#collapseInstructions').collapse('show');
  });

  // legend
  $('.legend').on('mouseover', 'tr', function(){
    var region = $(this).data('region');
    d3.selectAll('circle').each( function(d, i){
      if(d.Region == region){
        d3.select(this).classed("highlighted", true);
      } else if (d.Region != highlighted) {
        d3.select(this).classed("highlighted", false);
      }
    });
  });

  var highlighted = 0;
  
  $('.legend').on('mouseleave', 'tr', function(){
    var region = $(this).data('region');
    d3.selectAll('circle').each( function(d, i){
      if(d.Region == region & highlighted != region){
        d3.select(this).classed("highlighted", false);
      }
    });
  });

  $('.legend').on('click', 'tr', function(){
    var region = $(this).data('region');
    if (highlighted !== region){
      $(this).closest('.row').find('.legend tr').removeClass('selected');
      $(this).addClass('selected');
      highlighted = region;
      d3.selectAll('circle').each( function(d, i){
        if(d.Region == region){
          d3.select(this).classed("highlighted", true);
        } else {
          d3.select(this).classed("highlighted", false);
        }
      });
    } else {
      $(this).removeClass('selected');
      highlighted = 0;
      d3.selectAll('circle').each( function(d, i){
        if(d.Region == region){
          d3.select(this).classed("highlighted", false);
        }
      });
    }
  });

  // initialize variable tooltips once the attributes are loaded
  var initializeTooltips = setInterval(function(){
    if (attributesPlaced){
      $('[data-toggle="tooltip"]').tooltip({
        container: 'body',
        placement: 'left',
        html: true
      });
      clearInterval(initializeTooltips);
      return;
    }
  }, 50);

});

// for people who want to help
console.log("************************************************");
console.log("Know how to work with JavaScript and want to make a difference in community health?");
console.log("Get in touch to help us improve this project and find other ways to get involved. You can also join us on GitHub at https://github.com/lucaluca/SDH.");
console.log("************************************************");