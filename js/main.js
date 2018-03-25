//execute script when window is loaded
window.onload = setMap();

//set up choropleth map
  function setMap(){
      //map frame dimensions
      var width = 960,
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
        // translate CA TopoJSON
        var countiesCA = topojson.feature(ca, ca.objects.county_CA).features;
          //console.log(error);
          //console.log(csvData); popDen data
          //console.log('here be countiesCA');
          //console.log(countiesCA);


          /////Graticule below - optional for project

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

      /////Graticule above




        var counties = map.selectAll('.counties')// create an empty selection
            .data(countiesCA)
            .enter()
            .append('path')
            .attr('class', function(d) {
              return 'County ' + d.properties.NAME
            })
            .attr('d', path);



      };
  };
