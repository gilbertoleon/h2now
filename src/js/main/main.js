windowReady.ready(function () {
  let urls = {
    main: "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/main-stem",
    north:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/north-branch",
    south:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/south-branch",
    estimatedFCMain:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/main-stem/fc/calculated",
    estimatedFCNorth:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/north-branch/fc/calculated",
    estimatedFCSouth:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/south-branch/fc/calculated",
    manualFCMain:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/main-stem/fc",
    manualFCNorth:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/north-branch/fc",
    manualFCSouth:
      "https://dvlzjowx88.execute-api.us-west-2.amazonaws.com/h2now/data/south-branch/fc",
  };

  let attributes = [
    "turbidity",
    "cdom",
    "temperature",
    "tryptophan",
    "spec_conductivity",
  ];

  let weeks = 3;
  let dates = [];

  let data = {
    north: {
      key: "north",
      name: "North Branch",
      shortname: "North",
      estimatedFCAttribute: "north_branch_fecal_coliform",
    },
    south: {
      key: "south",
      name: "South Branch",
      shortname: "South",
      estimatedFCAttribute: "south_branch_fecal_coliform",
    },
    main: {
      key: "main",
      name: "Main Stem",
      shortname: "Main",
      estimatedFCAttribute: "main_stem_fecal_coliform",
    },
  };

  function setup() {
    d3.selectAll(".wrapper").classed("loading", true);
    d3.select("body").classed("loading", true);
    let max = Date.now();
    let min = max - weeks * 7 * 24 * 60 * 60 * 1000;
    dates = [min, max];
    let sensorsFlag = url.getParameter("sensors") || true;
    switch (sensorsFlag) {
      case true:
        getData();
        break;
      default:
        formatData([[], [], [], [], [], [], [], [], []]);
        break;
    }
  }

  function getData() {
    let urlArray = [
      urls.main,
      urls.north,
      urls.south,
      urls.estimatedFCMain,
      urls.estimatedFCNorth,
      urls.estimatedFCSouth,
      urls.manualFCMain,
      urls.manualFCNorth,
      urls.manualFCSouth,
    ];
    let promises = [];
    urlArray.forEach(function (url) {
      promises.push(d3.json(url));
    });
    Promise.all(promises).then(formatData);
  }

  function formatData(array) {
    d3.select("p.loading").remove();
    let rawData = {
      main: array[0].Items || [],
      north: array[1].Items || [],
      south: array[2].Items || [],
    };
    let estimatedFCData = {
      main: array[3].Items || [],
      north: array[4].Items || [],
      south: array[5].Items || [],
    };
    let manualFCData = {
      main: array[6].Items || [],
      north: array[7].Items || [],
      south: array[8].Items || [],
    };
    let dataKeys = Object.keys(data);
    dataKeys.forEach(function (key) {
      attributes.forEach(function (attribute) {
        data[key][attribute] = getValues(rawData[key], attribute);
      });
      data[key].estimatedFC = getEstimatedFCValues(
        estimatedFCData[key],
        data[key].estimatedFCAttribute
      );
      data[key].manualFC = getManualFCValues(manualFCData[key], "fc");
    });
    let excludeKeys = url.getParameter("exclude") || null;
    if (excludeKeys !== null) {
      let attribute = null;
      excludeKeys = excludeKeys.split(",");
      excludeKeys = excludeKeys.filter((item) => item);
      excludeKeys.forEach(function (key) {
        if (data.hasOwnProperty(key)) {
          for (attribute in data[key]) {
            if (Array.isArray(data[key][attribute])) {
              data[key][attribute] = [];
            }
          }
        }
      });
    }
    main();
  }

  function getManualFCValues(values, attribute) {
    let array = [];
    values.forEach(function (value) {
      value[attribute] = value[attribute] || null;
      if (value[attribute] !== null) {
        let date = new Date(+value.time_key.N);
        array.push({
          date: date,
          value: +value[attribute].N,
          epoch: date.getTime(),
          tooltipValue: parseInt(+value[attribute].N * 10) / 10,
        });
      }
    });
    return filterArray(array);
  }

  function getEstimatedFCValues(values, attribute) {
    let array = [];
    values.forEach(function (value) {
      value[attribute] = value[attribute] || null;
      if (value[attribute] !== null) {
        let date = new Date(value.time_key);
        array.push({
          date: date,
          value: +value[attribute],
          epoch: date.getTime(),
          tooltipValue: parseInt(+value[attribute] * 10) / 10,
        });
      }
    });
    return filterArray(array);
  }

  function getValues(values, attribute) {
    let array = [];
    values.forEach(function (value) {
      value[attribute] = value[attribute] || null;
      if (value[attribute] !== null) {
        let date = new Date(value.sample_time.S);
        array.push({
          date: date,
          value: +value[attribute].N,
          epoch: date.getTime(),
          tooltipValue: parseInt(+value[attribute].N * 10) / 10,
        });
      }
    });
    return filterArray(array);
  }

  function filterArray(array) {
    array = array.sort((a, b) => a.epoch - b.epoch);
    array = array.filter(function (reading) {
      return reading.epoch >= dates[0];
    });
    return array;
  }

  function main() {
    let pymChild = new pym.Child();
    d3.selectAll(".wrapper").classed("loading", false).each(getChart);
    d3.select("body").classed("loading", false);
    pymChild.sendHeight();
    console.log("I sent height");
  }

  function getChart(d, i) {
    let wrapper = d3.select(this);
    let chartType = wrapper.attr("data-chart-type");
    generateChart(wrapper, i, chartType);
  }

  function generateChart(wrapper, i, chartType) {
    let branches = [];
    let domain = [new Date(dates[0]), new Date(dates[1])];
    switch (chartType) {
      case "temperature":
        branches = [
          {
            key: data.main.key,
            name: data.main.name,
            values: data.main.temperature,
          },
          {
            key: data.north.key,
            name: data.north.name,
            values: data.north.temperature,
          },
          {
            key: data.south.key,
            name: data.south.name,
            values: data.south.temperature,
          },
        ];
        new Temperature(wrapper, i, branches, domain);
        break;
      case "turbidity":
        branches = [
          {
            key: data.main.key,
            name: data.main.name,
            values: data.main.turbidity,
          },
          {
            key: data.north.key,
            name: data.north.name,
            values: data.north.turbidity,
          },
          {
            key: data.south.key,
            name: data.south.name,
            values: data.south.turbidity,
          },
        ];
        new Turbidity(wrapper, i, branches, domain);
        break;
      case "cdom":
        branches = [
          {
            key: data.main.key,
            name: data.main.name,
            values: data.main.cdom,
          },
          {
            key: data.north.key,
            name: data.north.name,
            values: data.north.cdom,
          },
          {
            key: data.south.key,
            name: data.south.name,
            values: data.south.cdom,
          },
        ];
        new CDOM(wrapper, i, branches, domain);
        break;
      case "spec_conductivity":
        branches = [
          {
            key: data.main.key,
            name: data.main.name,
            values: data.main.spec_conductivity,
          },
          {
            key: data.north.key,
            name: data.north.name,
            values: data.north.spec_conductivity,
          },
          {
            key: data.south.key,
            name: data.south.name,
            values: data.south.spec_conductivity,
          },
        ];
        new Conductivity(wrapper, i, branches, domain);
        break;
      case "tlf":
        branches = [
          {
            key: data.main.key,
            name: data.main.name,
            values: data.main.tryptophan,
          },
          {
            key: data.north.key,
            name: data.north.name,
            values: data.north.tryptophan,
          },
          {
            key: data.south.key,
            name: data.south.name,
            values: data.south.tryptophan,
          },
        ];
        new TLF(wrapper, i, branches, domain);
        break;
      case "coliforms":
        branches = [
          {
            key: data.main.key,
            name: data.main.name,
            values: data.main.estimatedFC,
            occurences: data.main.manualFC,
          },
          {
            key: data.north.key,
            name: data.north.name,
            values: data.north.estimatedFC,
            occurences: data.north.manualFC,
          },
          {
            key: data.south.key,
            name: data.south.name,
            values: data.south.estimatedFC,
            occurences: data.south.manualFC,
          },
        ];
        new Coliforms(wrapper, i, branches, domain);
        break;
      default:
        break;
    }
  }

  setup();
});
