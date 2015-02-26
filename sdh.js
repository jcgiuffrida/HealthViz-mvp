// code adapted from http://bl.ocks.org/msbarry/raw/9911363/

var margin = {top: 10, right: 10, bottom: 10, left: 60},
    width = Math.round(0.59 * 940) - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    transitionDuration = 1000,
    maxRadius = 10,
    minRadius = 2;

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

/////////// Read in and format the data
d3.csv("SDH ii.csv", clean, function(data) {
  var drawn = false;
  var cols = getColumns(data);


  var form = d3.select('#controls');

  /////////// Draw the interpolation functions
  var funcs = [
    {value: 'linear'},
    {value: 'cubic'},
    {value: 'sin'}, 
    {value: 'exp'}
  ];
  var func;
  // header('Interpolation Function');
  var funcTable = table(funcs, 'interpolations');
  // row(funcTable, funcs, '', 'interp-func');
  funcTable.selectAll('a').on('click', selectFunc);
  function selectFunc(d) {
    func = d.col.value;
    funcTable.selectAll('a').classed('selected', function (other) {
      return other.col.value === func;
    });
  }
  selectFunc({col:funcs[1]});

  /////////// Draw the interpolation modes
  var modes = [
    {value: 'in'},
    {value: 'out'},
    {value: 'in-out'}
  ];
  var mode;
  // header('Interpolation Mode');
  var modeTable = table(modes, 'modes');
  // row(modeTable, modes, '', 'interp-mode');
  modeTable.selectAll('a').on('click', selectMode);
  function selectMode(d) {
    mode = d.col.value;
    modeTable.selectAll('a').classed('selected', function (other) {
      return other.col.value === mode;
    });
  }
  selectMode({col:modes[2]});





  /////////// Draw the scales
  var scales = [
    {value: 'linear', scale: function () { return d3.scale.linear(); } },
    // {value: 'pow(2)', scale: function () { return d3.scale.pow().exponent(2); } },
    // {value: 'sqrt', scale: function () { return d3.scale.sqrt(); } },
    {value: 'log', scale: function () { return d3.scale.log(); } },
  ];
  var scale = {};
  header('Axis Scale');
  var scaleTable = table(scales, 'scales');
  row(scaleTable, scales, 'X', 'x-scale');
  row(scaleTable, scales, 'Y', 'y-scale');
  row(scaleTable, scales, 'Size', 'size-scale');
  scaleTable.selectAll('a').on('click', selectScale);
  function selectScale(d) {
    scale[d.row] = d.col;
    scaleTable.selectAll('a.' + d.row)
      .classed('selected', function (other) {
        return other.col.value === d.col.value;
      });
    redraw();
  }
  selectScale({col:scales[0],row:'x-scale'});
  selectScale({col:scales[0],row:'y-scale'});
  selectScale({col:scales[0],row:'size-scale'});

  /////////// Draw the attribute mappings
  var attrs = [
    {value: 'x'},
    {value: 'y'},
    {value: 'radius'}
  ];
  var attributes = {};
  header('Variables');
  var colsTable = table(attrs, 'attributes');
  cols.forEach(function (col) {
    row(colsTable, attrs, col.name, col);
  });

  // this is the magic
  colsTable.selectAll('a').on('click', selectAttribute);
  function selectAttribute(d) {
    attributes[d.col.value] = d.row;
    colsTable.selectAll('a.' + d.col.value)
      .classed('selected', function (other) {
        return other.row.name === d.row.name;
      });
    redraw();
  }

  selectAttribute({row:findAttr('Hardship Index 2012'),col:attrs[0]});
  selectAttribute({row:findAttr('Infant Mortality'),col:attrs[1]});
  selectAttribute({row:findAttr('Population'),col:attrs[2]});
  function findAttr(search) {
    var lower = search.toLowerCase();
    return cols.filter(function (attr) {
      return attr.name.toLowerCase().indexOf(lower) > -1;
    })[0];
  }

  /////////// Utilities
  function header(text) {
    form.append('div').text(text).attr('class', 'header');
  }
  function table(data, tableID) {
    var table = form.append('table').attr('id', tableID);
    return table;
  }
  function row(table, data, display, name) {
    var row = table.append('tr');
    row.append('td').text(display);

    row.selectAll('td.option')
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

  /////////// Render the scatterplot
  drawn = true;
  var colorScale = d3.scale.category10();

  var xAxis = d3.svg.axis()
    .tickFormat(function(d) {
      if(d3.formatPrefix(d).symbol == "m" && d >= 0.1) {
          return d;
      } else {
          return d3.format(",s")(d);
      }
    })
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .tickFormat(function(d) {
      if(d3.formatPrefix(d).symbol == "m" && d >= 0.1) {
          return d;
      } else {
          return d3.format(",s")(d);
      }
    })
    .orient("left");

  svg.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(0," + (height+25) + ")")
    .append('text') 
      .attr('x', width)
      .attr('dy', -3)
      .style('text-anchor', 'end')
      .attr('class', 'x label');

  svg.append('g')
      .attr('class', 'y axis')
      .attr("transform", "translate(-25,0)")
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('dy', 10)
      .style('text-anchor', 'end')
      .attr('class', 'y label');




  function place(selection) {
    selection
      .attr('r', function (d) { return radius(d[attributes.radius.key]); })
      .attr('cx', function (d) { 
        console.log(x(d[attributes.x.key]));
        return x(d[attributes.x.key]); 
      })
      .attr('cy', function (d) { return y(d[attributes.y.key]); });
  }

  var x, y, radius;
  function redraw() {
    if (drawn) {
      var easingFunc = func + '-' + mode;
      x = scale['x-scale'].scale();
      y = scale['y-scale'].scale();
      radius = scale['size-scale'].scale();
      var errors = [];
      var xRange = d3.extent(data, function (d) { return d[attributes.x.key]; });
      var yRange = d3.extent(data, function (d) { return d[attributes.y.key]; });
      var radiusRange = d3.extent(data, function (d) { return d[attributes.radius.key]; });
      var xLogNotAllowed = Math.sign(xRange[0]) !== Math.sign(xRange[1]);
      var yLogNotAllowed = Math.sign(yRange[0]) !== Math.sign(yRange[1]);
      var radiusLogNotAllowed = Math.sign(radiusRange[0]) !== Math.sign(radiusRange[1]);
      if (xLogNotAllowed && scale['x-scale'].value === 'log') {
        errors.push("Can't use log scale with x-axis for '" + attributes.x.name + 
          "' since it has positive and negative values.");
        x = scales[0].scale();
      }
      if (yLogNotAllowed && scale['y-scale'].value === 'log') {
        errors.push("Can't use log scale with y-axis for '" + attributes.y.name + 
          "' since it has positive and negative values.");
        y = scales[0].scale();
      }
      if (radiusLogNotAllowed && scale['size-scale'].value === 'log') {
        errors.push("Can't use log scale with radius for '" + attributes.radius.name + 
          "' since it has positive and negative values.");
        radius = scales[0].scale();
      }
      d3.select('#error').text(errors.join("<br>"));

      d3.select('.x.label').text(attributes.x.key.replace(/_/g, ' '));
      d3.select('.y.label').text(attributes.y.key.replace(/_/g, ' '));
      x.domain(xRange)
      x.range([0, width]);
      y.domain(yRange)
      y.range([height, 0]);
      radius.range([minRadius, maxRadius]);
      xAxis.scale(x);
      yAxis.scale(y);
      radius.domain(radiusRange);
      d3.select('.x.axis').transition().duration(transitionDuration).ease(easingFunc).call(xAxis);
      d3.select('.y.axis').transition().duration(transitionDuration).ease(easingFunc).call(yAxis);
      var filteredData = data.filter(function (d) {
        return typeof d[attributes.radius.key] === 'number' &&
          d[attributes.radius.key] !== 0 &&
          typeof d[attributes.x.key] === 'number' &&
          typeof d[attributes.y.key] === 'number';
      });
      var areas = svg.selectAll('.ca').data(filteredData, function (d) { return d.CommunityArea; });
      areas.transition().duration(transitionDuration)
        .ease(easingFunc)
        .call(place);
      areas.enter().append('circle')
          //.attr('class', 'ca')
          .attr('class', function (d) {
            return d.Region === 0 ? 'chicago ca' : 'ca'; })
          .attr('fill', function (d) { return colorScale(d.Region); })
          .on("mouseleave", mouseout)
          .on("mouseout", mouseout)
          .on("mouseover", mouseover)
          .call(place);
      areas.exit()
        .transition()
        .duration(transitionDuration)
        .ease(easingFunc)
        .remove();

      // trend line

      // utilities for trend line
      var xScale = d3.scale.ordinal()
        .rangeRoundBands([margin.left, width], .1);
        
      var yScale = d3.scale.linear()
        .range([height, 0]);

      
    }
  }

  /////////// handle interaction/tooltip
  var tip = d3.select('.tip');
  tip.on("mouseover", mouseout);

  function mouseover(d) {
    if (d.mouseover) { return; }
    mouseout();
    d.mouseover = true;
    var dx = Math.round(x(d[attributes.x.key]));
    var dy = Math.round(y(d[attributes.y.key]));
    tip.selectAll('.ca').text(d.CommunityArea);
    tip.selectAll('.rd .name').text(attributes.radius.name);
    tip.selectAll('.rd .value').text(d[attributes.radius.key]);
    tip.selectAll('.rd .units').text(attributes.radius.units ? attributes.radius.units : "");
    tip.selectAll('.x .name').text(attributes.x.name);
    tip.selectAll('.x .value').text(d[attributes.x.key]);
    tip.selectAll('.x .units').text(attributes.x.units ? attributes.x.units : "");
    tip.selectAll('.y .name').text(attributes.y.name);
    tip.selectAll('.y .value').text(d[attributes.y.key]);
    tip.selectAll('.y .units').text(attributes.y.units ? attributes.y.units : "");
    tip.style("display", null)
        .style("top", (dy + margin.top + 10) + "px")
        .style("left", (dx + margin.left + 10) + "px");
  }

  function mouseout(d) {
    d3.selectAll('circle.ca').each(function (d) { d.mouseover = false; });
    tip.style("display", "none");
  }


  // // linear trend line
  // // get the x and y values for least squares
  // var xSeries = d3.range(1, xLabels.length + 1);
  // var ySeries = data.map(function(d) { return parseFloat(d['rate']); });
  
  // var leastSquaresCoeff = leastSquares(xSeries, ySeries);
  
  // // apply the reults of the least squares regression
  // var x1 = xLabels[0];
  // var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
  // var x2 = xLabels[xLabels.length - 1];
  // var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
  // var trendData = [[x1,y1,x2,y2]];
  
  // var trendline = svg.selectAll(".trendline")
  //   .data(trendData);
    
  // trendline.enter()
  //   .append("line")
  //   .attr("class", "trendline")
  //   .attr("x1", function(d) { return xScale(d[0]); })
  //   .attr("y1", function(d) { return yScale(d[1]); })
  //   .attr("x2", function(d) { return xScale(d[2]); })
  //   .attr("y2", function(d) { return yScale(d[3]); })
  //   .attr("stroke", "black")
  //   .attr("stroke-width", 1);
  
  // // display equation on the chart
  // svg.append("text")
  //   .text("eq: " + decimalFormat(leastSquaresCoeff[0]) + "x + " + 
  //     decimalFormat(leastSquaresCoeff[1]))
  //   .attr("class", "text-label")
  //   .attr("x", function(d) {return xScale(x2) - 60;})
  //   .attr("y", function(d) {return yScale(y2) - 30;});
  
  // // display r-square on the chart
  // svg.append("text")
  //   .text("r-sq: " + decimalFormat(leastSquaresCoeff[2]))
  //   .attr("class", "text-label")
  //   .attr("x", function(d) {return xScale(x2) - 60;})
  //   .attr("y", function(d) {return yScale(y2) - 10;})
  
  



  redraw();

  // make it fit
  var totalHeight = margin.top + margin.bottom + height + 60;
  d3.select("#chart svg")
    .attr('height', totalHeight);
  d3.select(self.frameElement).style("height", totalHeight + "px");
  mouseout();
});

// Extract columns of interest from the dataset.  Columns of interest are the top N
// with highest coverage.
function getColumns(data) {
  var items = {};
  data.forEach(function (d) {
    d3.keys(d).forEach(function (k) {
      if (d[k]) { items[k] = (items[k] || 0) + 1; }
    });
  });
  return d3.keys(items).map(function (col) {
    // extract name and units from column name and normalize
    // units are whatever is in parentheses
    var name = col
      .replace(/(_|\(.*?\))/g, " ")
      .replace(/\s+/g, " ")
      .replace(/(^\s*|\s*$)/g, "");
    var units = /\((.*?)\)/.exec(col)
    return {
      key: col,
      name: name,
      units: units && units[1]
    };
  }).filter(function (col) {
    // omit Community Area, Region, and any variable with <50% coverage
    return items[col.key] > 0.5 * data.length &&
      col.name !== "CommunityArea" &&
      col.name !== "Region";
  });
}

// convert incoming strings to numbers
function clean(item) {
  d3.keys(item).forEach(function (key) {
    if (key === 'CommunityArea') {
      // do nothing
    } else if (item[key] === "") {
      item[key] = null;
    } else {
      item[key] = +item[key];
    }
  });
  return item;
}

// returns slope, intercept and r-square of the line
function leastSquares(xSeries, ySeries) {
  var reduceSumFunc = function(prev, cur) { return prev + cur; };
  
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
  var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
  
  return [slope, intercept, rSquare];
}


// the following is a workaround to put the variables into collapsible panels
// using jquery because of time constraints
var attrsTable = $('table#attributes');



