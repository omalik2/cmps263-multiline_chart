// Canvas: dimensions of svg that contains the elements
var canvas = {w: 960, h: 510},
    margin = {top: 20, right: 80, bottom: 40, left: 50},
    // Area for the plots
    width = canvas.w - margin.left - margin.right,
    height = canvas.h - margin.top - margin.bottom;

// Add svg element to body of html
var svg = d3.select("body").append("svg")
    // Define width and heights of svg
    .attr("class", "canvas")
    .attr("width", canvas.w )
    .attr("height", canvas.h),
    //.style.display = "block"
    //.style.margin = "auto",
    // Add a group element that will contain the actual plot 
    g = svg.append("g")
        // Align the group element so that padding is created from the top left.
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.style.display = "block";
svg.style.margin = "auto";

/* Function expression (that is not hoisted compared to the
   normal function declaration). This function parses input
   as a decimal year with century(%Y) and returns the date format
*/
var parseTime = d3.timeParse("%Y");

// The output scale of x axis is width of drawable element g
var x = d3.scaleTime().range([0,width]),
    /* The output y of y axis is height of drawable element g
       Invert 0 and height since coordinate origin is in top left
       corner with +ve y direction as down and +ve x direction as
       right. We want our y axis to begin at the bottom of the g
       element and grow upwards, hence the inversion.
     */
    y = d3.scaleLinear().range([height, 0]),
    /* Z dimension will contain the data series which are categories
       thus scaleOrdinal is use. schemeCategory set the coloring scheme
       of the data series. */
    z = d3.scaleOrdinal(d3.schemeCategory10);

/* Function expression to create a curved line from the input
   data. The x and y functions extract the scaled x and y coordinates
   from the input data for each row. */
var line = d3.line()
    .curve(d3.curveNatural)
    .x(function(d) {/* return scaled year */ return x(d.year); })
    .y(function(d) {/* return scaled energy */return y(d.energy); });

// gridlines on bottom axis with scaling of x
function make_x_gridlines() {
    return d3.axisBottom(x);
}
// gridlines on left axis with scaling of y
function make_y_gridlines() {
    return d3.axisLeft(y);
}

// Open the preprocessed BRICSU csv
d3.csv("BRICSdata.csv", type, function(error, data) {
    if (error) throw error;
    
    /* Create 2D array from the 1D array of countries (= columns.slice(1))
       with the first element, 'id' as the country and 2nd element 'values' as
       as a *function* which maps each row in 'data' to an array of year and energy
       that is returned to 'values' */
    var countries = data.columns.slice(1).map(function(id) {
        return {
            id: id,
            values: data.map(function(d) {
                return {year: d.year, energy: d[id]};
            })
        };
    });

    /* Define the input domain of the time scale that is of length 'width'. 
       The input domain depends on the data and here it the range of maximum
       year to minimum year (2010 to 2000). The unnamed function defines which
       value to look at in each row of data. */
    x.domain(d3.extent(data, function(d) { return d.year; }));
    
    /* Define the input domain of the linear scale the is of length 'height'.
       The input domain will be used for the left axis and so varies from the
       minimum energy value detected in the input data to the maximum energy
       value. The values are stored in the country map */
    y.domain([
        d3.min(countries, function(c) { return d3.min(c.values, function(d) { return d.energy; }); }),
        d3.max(countries, function(c) { return d3.max(c.values, function(d) { return d.energy; }); })
    ]);
    
    /* The domain for the data series are the country names */
    z.domain(countries.map(function(c) { return c.id; }));
    
    // Adding new group that is x axis with axis title
    g.append("g")
        .attr("class", "axis axis--x")
        // Move the axis to the bottom of the container 'g'
        .attr("transform", "translate(0," + height + ")")
        // Create the axis with the scaling declared by x
        .call(d3.axisBottom(x))
        // Add text element
        .append("text")
            .attr("text-anchor", "middle") // Center text
            .attr("x", width/2)            // translate to middle of x-axis
            .attr("y", margin.bottom)      // move it below x-axis
            .attr("fill", "#000")          // Color it black
            .attr("font-weight", "bold")   // Bold text
            .text("Year");                 // Set text to display
    
    // Adding new group that is the y axis with axis title
    g.append("g")
        .attr("class", "axis axis--y")
        // Create the axis with the scaling declared by yy
        .call(d3.axisLeft(y))
        // Add text element
        .append("text")
            .attr("text-anchor", "middle")      // Center text
            .attr("x", -height/2)               // Place in middle of y-axis
            .attr("y", -margin.left*4/5)        // Place behind y-axis
            .attr("transform", "rotate(270)")   // Vertical text
            .attr("fill", "#000")               // Text color is black
            .attr("font-weight", "bold")        // Bold font
            .text("Million BTUs Per Person");   // Text content

    // add new group that is the X gridlines
    g.append("g")
        .attr("class", "grid")
        // Move the grid lines so that they brought down to x axis
        .attr("transform", "translate(0," + height + ")")
        // Make the gridlines
        .call(make_x_gridlines()
              // x.ticks().length returns number of ticks in x-axis data
              // Do not want clutter so use half number of ticks
              .ticks(x.ticks().length/2)
              // The length of the grid lines. Want them to stretch to top
              .tickSize(-height)
              // Defined tick format to be nothing, as we already have axis
              // supplying the ticks and the tick labels.
              // If removed, adds another set of axis labels (i.e. 2000,2002)
              // will be added to the graph
              .tickFormat("")
             )
    
    // add the Y gridlines
    g.append("g")
        .attr("class", "grid")
        // Make the gridlines
        .call(make_y_gridlines()
              // y.ticks().length returns number of ticks in y-axis data
              // Do not want clutter so use half number of ticks
              .ticks(y.ticks().length/2)
              // The length of the grid lines. Want them to stretch to the right
              .tickSize(-width)
              // Defined tick format to be nothing, as we already have axis
              // supplying the ticks and the tick labels.
              // If removed, adds another set of axis labels (i.e. 2000,2002)
              // will be added to the graph
              .tickFormat("")
             )
    
    var country = g.selectAll(".country")
        .data(countries)
        // Create placeholder for each country in countries and append group
        .enter().append("g")
        // define class of each group created
        .attr("class", "country");    
    
    // Add a the svg element path to the group: country
    var path = country.append("path")
        .attr("class", "line")
        // 'd' is the draw attribute of path and takes coordinates 
        .attr("d", function(d) {
            return line(d.values); 
        })
        // stroke style is defined by the z scale, which assigns
        // each data series with an color specific to that ordinal
        .style("stroke", function(d) { return z(d.id); });
    
    path
        // Length of the dashed line. We want 1 long dash
        .attr("stroke-dasharray", function() {
            return path.node().getTotalLength();
        })
        // Length of the space between dashed lines. This has to be equal to
        // length of dashed line if we want a growing effect from left to right 
        .attr("stroke-dashoffset", function(){
            return path.node().getTotalLength();
        })
        .transition()   // Animate with transitiontran
            .duration(2000)         // Duration of transition
            .ease(d3.easeLinear)    // Constant speed of animation
            .attr("stroke-dashoffset", 0);  // When to stop 
    
    // Add text the country group
    country.append("text")
        // Set the bound data on this element. No need to .data as label is static
        .datum(function(d) { 
            return {id: d.id, value: d.values[d.values.length - 1]};
        })
        // Move element to appropriate location on chart 
        .attr("transform", function(d) {
            return "translate(" + x(d.value.year) + "," + y(d.value.energy) + ")";
        })
        // Shift element further to the right so that there is no overlap
        .attr("x", 3)
        // Shift element down so that it is centered with line
        .attr("dy", "0.35em")
        // Set font style
        .style("font", "10px sans-serif")
        // Add text (which country it is) to label
        .text(function(d) { return d.id; });
});

// Type function to declare formatting of each input row 'd'. Used with .csv import
function type(d, _, columns) {
    d.year = parseTime(d.year); // Parse year as time
    for (var i = 1, n = columns.length; i < n; ++i){
        // For each column other than year, parse the (energy) values as numerical
        d[columns[i]] = +d[columns[i]];  
    }
    // Return the formatted row
    return d;
}