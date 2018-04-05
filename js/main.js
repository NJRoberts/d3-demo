(function(){

//pseudo-global variables
var attrArray = ["d1860","d1890","d1920","d1950","d1980","d2010"];
var expressed = attrArray[0]; //initial attribute

//console.log(expressed);

//execute script when window is loaded
window.onload = setMap();

//set up choropleth map
  function setMap(){
      //map frame dimensions
      var width = window.innerWidth * 0.5,
          height = 460;

      //create new svg container for the map
      var map = d3.select('body')
          .append('svg')
          .attr('class', 'map')
          .attr('width', width)
          .attr('height', height);

      //create California Albers conic equal area projection
      var projection = d3.geoConicEqualArea()
          .center([4.20, 37.40])
          .parallels([34, 40.5])
          .rotate([120, 0])
          .scale(2600)
          .translate([width / 2, height / 2]);

      var path = d3.geoPath()
          .projection(projection);


      //use d3.queue to parallelize asynchronous data loading
      d3.queue()
          .defer(d3.csv, 'data/CA_hist_pop.csv') //load attributes from csv
          //.defer(d3.json, ) //load background spatial data
          .defer(d3.json, 'data/county_CA.topojson') //load choropleth spatial data
          .await(callback);


      function callback(error, csvData, ca){

        //place graticule on the map --optional uncomment function to use
        setGraticule(map, path);

        // translate CA TopoJSON
        var countiesCA = topojson.feature(ca, ca.objects.county_CA).features;
          //console.log(error);
          //console.log(csvData); //popDen data
          //console.log('here be countiesCA');
          //console.log(countiesCA);


            //join csv data to GeoJSON enumeration units
            countiesCA = joinData(countiesCA, csvData);

            //create the color scale
            var colorScale = makeColorScale(csvData);

            //add enumeration units to the map
            setEnumerationUnits(countiesCA, map, path, colorScale);

            //add coordinated visualization to the map
            setChart(csvData, colorScale);

            //add dropdown
            createDropdown(csvData, colorScale);

            //based on dropdown selection
            changeAttribute(attribute, csvData);


      };
  }; //end of setMap

  //function to create coordinated bar chart
  function setChart(csvData, colorScale){
      //chart frame dimensions
      var chartWidth = window.innerWidth * 0.425,
          chartHeight = 473;
          leftPadding = 25,
          rightPadding = 2,
          topBottomPadding = 5,
          chartInnerWidth = chartWidth - leftPadding - rightPadding,
          chartInnerHeight = chartHeight - topBottomPadding * 2,
          translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

      //create a second svg element to hold the bar chart
      var chart = d3.select("body")
          .append("svg")
          .attr("width", chartWidth)
          .attr("height", chartHeight)
          .attr("class", "chart");


      //create a rectangle for chart background fill
      var chartBackground = chart.append("rect")
          .attr("class", "chartBackground")
          .attr("width", chartInnerWidth)
          .attr("height", chartInnerHeight)
          .attr("transform", translate);


      //create a scale to size bars proportionally to frame
      var yScale = d3.scaleLinear()
           .range([463, 0]) //bar height - adjust data to improve presentation
           .domain([0, 100]);

      //set bars for each county
      var bars = chart.selectAll(".bar")
          .data(csvData)
          .enter()
          .append("rect")
          .sort(function(a, b){
             return b[expressed]-a[expressed] //reversed for biggest to small..
          })
          .attr("class", function(d){
              return "bar " + d.GEOID;
          })
          .attr("width", chartInnerWidth / csvData.length - 1)
          .attr("x", function(d, i){
              return i * (chartWidth / csvData.length) + leftPadding;
          })
          .attr("height", function(d, i){
              return 463 - yScale(parseFloat(d[expressed]));
          })
          .attr("y", function(d, i){
              return yScale(parseFloat(d[expressed])) + topBottomPadding;
          })
          //Applying the color scale
          .style("fill", function(d){
              return choropleth(d, colorScale);
            });


       //create a text element for the chart title
       var chartTitle = chart.append("text")
           .attr("x", 40)
           .attr("y", 40)
           .attr("class", "chartTitle")
           .text("Population Density " + expressed[3] + " in each County");

      //create vertical axis generator
      var yAxis = d3.axisLeft()
          .scale(yScale)


      //place axis
      var axis = chart.append("g")
          .attr("class", "axis")
          .attr("transform", translate)
          .call(yAxis);

      //create frame for chart border
      var chartFrame = chart.append("rect")
          .attr("class", "chartFrame")
          .attr("width", chartInnerWidth)
          .attr("height", chartInnerHeight)
          .attr("transform", translate);


  };



  //Graticule below - optional for project
  function setGraticule(map, path){

  //create graticule generator ..drawing order matters
  var graticule = d3.geoGraticule()
  .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

  //create graticule background
  var gratBackground = map.append("path")
      .datum(graticule.outline()) //bind graticule background
      .attr("class", "gratBackground") //assign class for styling
      .attr("d", path) //project graticule

  //create graticule lines
  var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
      .data(graticule.lines()) //bind graticule lines to each element to be created
      .enter() //create an element for each datum
      .append("path") //append each element to the svg as a path element
      .attr("class", "gratLines") //assign class for styling
      .attr("d", path); //project graticule lines

  };


  function joinData(countiesCA, csvData){
    //...DATA JOIN LOOPS

    for (var i=0; i<csvData.length; i++){
      var csvCounty = csvData[i]; //the current county_CA
      var csvKey = csvCounty.GEOID; // the csv primary key
      //console.log (csvKey);
      //loop through gejson counties to find correct county
      for (var a=0; a<countiesCA.length; a++){

        var geojsonProps = countiesCA[a].properties; //the current coutnty geojson properties
        var geojsonKey = geojsonProps.GEOID; //the geojson primary key
        //console.log(geojsonProps);
        //console.log(geojsonKey);
        //where primary keys match, transfer csv data to geojson properties object
        if (geojsonKey == csvKey) {

         //assign all attributes and values
         attrArray.forEach(function(attr){
           var val = parseFloat(csvCounty[attr]); //get csv attribute values
           geojsonProps[attr] = val; //assign attribute and value to geojson properties


         });
        }

      }

    }

    return countiesCA;
};


function setEnumerationUnits(countiesCA, map, path, colorScale){
    //...REGIONS BLOCK FROM PREVIOUS MODULE
    var counties = map.selectAll('.counties')// create an empty selection
        .data(countiesCA)
        .enter()
        .append('path')
        .attr('class', function(d) {
          return 'County ' + d.properties.NAME
        })
        .attr('d', path)
        .style("fill", function(d){
            return colorScale(d.properties[expressed]);

        });
};


//function to create color scale generator
function makeColorScale(data){
// Quantile color scale. Check that this scale works for Natural Breaks
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    //console.log(clusters);
    return colorScale;

};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};


//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
          });

    //add initial option - disabled so not clickable
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;
    //console.log(attribute);

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var counties = d3.selectAll(".counties")
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });


    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });


};

})(); //last line of main.js
