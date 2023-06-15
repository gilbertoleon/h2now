var Coliforms = function (wrapper, i, branches, domain) {
  var debug = false;

  var horizontalPadding = 5;
  var debounceTime = 100;
  var minSize = 300 + 2 * horizontalPadding;

  var svgBox = null;
  var titleBox = null;
  var xAxisBox = null;
  var mainBox = null;

  var tooltip = null;
  var transitionTime = 400;

  var svg = null;
  var gMain = null;
  var gMarkers = null;
  var gXAxis = null;
  var gYAxis = null;
  var gTitle = null;
  var gText = null;
  var eventsRect = null;
  var clipRect = null;
  var tooltipCircle = null;
  var tooltipCircleRadius = 10;

  var lineGenerator = d3.line().x(calculateXValue).y(calculateYValue);
  var xScale = d3.scaleTime().domain(domain);
  var yScale = d3.scaleLinear().domain([0, 1000]);

  var xAxis = d3
    .axisBottom(xScale)
    .tickSizeOuter(0)
    .tickSizeInner(9)
    .tickFormat(xTickFormat);
  //var yAxis = d3.axisRight(yScale).ticks(6).tickFormat(yTickFormat);
  var yAxis = d3
    .axisRight(yScale)
    .tickValues([0, 100, 200, 400, 600, 800, 1000])
    .tickFormat(yTickFormat);

  var activeBranch = null;

  var colors = { marker: "#E26239", coliform: "#00578A" };

  var thresholdValues = [
    { value: 100, label: "Good", color: "#CCDEE8" },
    { value: 200, label: "Low caution", color: "#669BB9" },
    { value: 1000, label: "High caution", color: "#00588B" },
  ];

  var flagData = false;

  var fullText =
    "Fecal coliforms (FC) are a group of bacteria found in natural waters, often counted in colony forming units per 100 milliliters (CFU/100 mL). On this plot, the individual data points are the Tecta PDS FC test results of the samples collected by the H2NOW team. The continuous line is the FC estimate generated by the model. Both of the datasets are used for the real-time water quality assessment. We qualify water quality conditions as Good if FCs are below 200 CFU/100 mL, advise Low Caution when FC levels are between 200 and 1,000 CFU/100 mL, and High Caution if FC levels are above 1,000 CFU/100mL. For more detailed information, please see the FAQ page.";
  var textYOffset = 60;
  var textXOffset = 50;
  var wrappedTextYOffset = 0;

  function setup() {
    wrapper.selectAll("svg").remove();
    tooltip = wrapper.select(".tooltip");
    svg = wrapper.append("svg");
    var defs = svg.append("defs");
    var clip = defs.append("clipPath").attr("id", `clip-${i}`);
    clipRect = clip.append("rect");
    svg = svg.append("g");
    gYAxis = svg.append("g");
    gMain = svg.append("g").attr("clip-path", `url(#clip-${i})`);
    eventsRect = gMain.append("rect").attr("fill", "transparent");
    tooltipCircle = gMain
      .append("circle")
      .attr("r", 10)
      .attr("stroke", "currentColor")
      .attr("stroke-width", "1px")
      .attr("fill", "transparent")
      .style("opacity", 0)
      .style("pointer-events", "none");
    gMarkers = gMain.append("g");
    gXAxis = svg.append("g");
    gTitle = svg.append("g");
    gText = svg.append("g");

    resetChart();
    setActiveBranch();
    window.addEventListener("resize", debounce(resetChart));
    main();
  }

  function resetChart() {
    resetBoxes();
    resetGroups();
    debugGroups();
    resetTitle();
    resetText();
    resetScales();
    resetAxis();
    if (flagData) {
      updateXAxis();
      updateClipRect();
      updateEventRects();
      updateLine();
      createMarkers();
    }
  }

  function setActiveBranch(key) {
    key = key || d3.select("#branch").property("value");
    activeBranch = branches.find(matchKey, { key: key }) || branches[0];
    resetTitle();
    resetText();
    if (flagData) {
      updateXAxis(true);
      updateClipRect();
      updateEventRects();
      updateLine(true);
      createMarkers();
    }
  }

  function matchKey(obj) {
    return obj.key == this.key;
  }

  function getFullTextHeight(width) {
    var text = wrapper
      .select("svg")
      .append("text")
      .attr("class", "remove")
      .attr("fill", "currentColor")
      .attr("y", 0)
      .attr("dy", "0.71em")
      .attr("font-size", "16px")
      .text(fullText)
      .call(wrap, width - textXOffset * 2);

    var box = text.node().getBBox();
    wrapper.select("svg").select("text.remove").remove();
    return Math.ceil(box.height + 40);
  }

  function resetBoxes() {
    var wrapperBBox = wrapper.node().getBoundingClientRect();
    var width = d3.max([minSize, wrapperBBox.width]);
    var contentWidth = width - 2 * horizontalPadding;
    wrappedTextYOffset = getFullTextHeight(contentWidth);

    svgBox = new Box({
      content: { width: contentWidth, height: 388 },
      padding: { left: horizontalPadding, right: horizontalPadding },
    });

    titleBox = new Box({
      content: { width: svgBox.content.width, height: 81 },
    });

    xAxisBox = new Box({
      content: { width: svgBox.content.width, height: 26 },
    });

    mainBox = new Box({
      content: {
        width: svgBox.content.width,
        height:
          svgBox.content.height -
          (titleBox.outer.height + xAxisBox.outer.height),
      },
    });
  }

  function resetGroups() {
    wrapper
      .select("svg")
      .attr("width", svgBox.outer.width)
      .attr("height", svgBox.outer.height + wrappedTextYOffset)
      .attr(
        "viewBox",
        `0 0 ${svgBox.outer.width} ${svgBox.outer.height + wrappedTextYOffset}`
      );
    svg.attr(
      "transform",
      "translate(" + svgBox.padding.left + "," + svgBox.padding.top + ")"
    );
    gMain.attr(
      "transform",
      "translate(0," + (titleBox.outer.height + wrappedTextYOffset) + ")"
    );
    gXAxis.attr(
      "transform",
      "translate(0," +
        (titleBox.outer.height + mainBox.outer.height + wrappedTextYOffset) +
        ")"
    );
    gYAxis.attr(
      "transform",
      "translate(0," + (titleBox.outer.height + wrappedTextYOffset) + ")"
    );
  }

  function debugGroups() {
    if (debug === true) {
      gMain.selectAll("rect.debug").remove();
      gXAxis.selectAll("rect.debug").remove();
      gTitle.selectAll("rect.debug").remove();
      gText.selectAll("rect.debug").remove();
      gMain
        .append("rect")
        .attr("class", "debug")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", mainBox.outer.width)
        .attr("height", mainBox.outer.height)
        .attr("fill", "blue")
        .attr("opacity", 0.3);
      gXAxis
        .append("rect")
        .attr("class", "debug")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", xAxisBox.outer.width)
        .attr("height", xAxisBox.outer.height)
        .attr("fill", "red")
        .attr("opacity", 0.3);
      gTitle
        .append("rect")
        .attr("class", "debug")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", titleBox.outer.width)
        .attr("height", titleBox.outer.height)
        .attr("fill", "yellow")
        .attr("opacity", 0.3);
      gText
        .append("rect")
        .attr("class", "debug")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", titleBox.outer.width)
        .attr("height", titleBox.outer.height)
        .attr("fill", "purple")
        .attr("opacity", 0.3);
    }
  }

  function resetTitle() {
    var title = [];

    if (activeBranch !== null) {
      title.push(activeBranch.name);
    }
    title.push("Fecal Coliforms");
    title.push("(CFU/100 mL)");

    gTitle.select("g").remove();
    var g = gTitle
      .append("g")
      .attr("transform", "translate(" + titleBox.content.width / 2 + ",0)")
      .attr("text-anchor", "middle");
    var text = g
      .append("text")
      .attr("fill", "currentColor")
      .attr("y", 1)
      .attr("dy", "0.71em")
      .attr("font-weight", "bold")
      .attr("font-size", "20px")
      .text(title.join(" "));
    g.append("rect")
      .attr("fill", colors.marker)
      .attr("transform", "translate(-118,26) rotate(45)")
      .attr("width", 12)
      .attr("height", 12);
    g.append("text")
      .attr("fill", "currentColor")
      .attr("x", 20)
      .attr("y", 30)
      .attr("dy", "0.71em")
      .attr("font-weight", "bold")
      .attr("font-size", "16px")
      .text("Tecta PDS Fecal Coliform Results");

    var box = gTitle.node().getBBox();
    if (box.width > svgBox.inner.width) {
      title.pop();
      text.text(title.join(" "));
    }
  }

  function resetText() {
    gText.select("text").remove();
    gText
      .attr("text-anchor", "start")
      .attr("transform", "translate(" + textXOffset + "," + textYOffset + ")");

    gText
      .append("text")
      .attr("fill", "currentColor")
      .attr("y", 1)
      .attr("dy", "0.71em")
      .attr("font-size", "16px")
      .text(fullText);

    gText.selectAll("text").call(wrap, svgBox.inner.width - textXOffset * 2);
  }

  function resetScales() {
    xScale.range([0, mainBox.content.width]);
    yScale.range([mainBox.content.height, 0]);
  }

  function resetAxis() {
    yAxis.tickSize(mainBox.content.width);
    gYAxis.call(yAxis);
    gYAxis.select(".domain").remove();
    var values = thresholdValues.map(function (d) {
      return d.value;
    });
    var customAxis = gYAxis.selectAll("g.tick").filter(function (d) {
      return values.indexOf(d) >= 0;
    });
    customAxis
      .select("line")
      .attr("stroke", function (d) {
        var obj = thresholdValues.find(function (v) {
          return d == v.value;
        });
        return obj.color;
      })
      .attr("stroke-width", "2px");
    customAxis.select("text").text(function (d) {
      var obj = thresholdValues.find(function (v) {
        return d == v.value;
      });
      return d + " (" + obj.label + ")";
    });
  }

  function xTickFormat(date) {
    d3.select(this).attr("dy", "1.1em").attr("font-size", "13px");
    var formatDate = d3.timeFormat("%B %-d");
    var array = formatDate(date).split(" ");
    if (array[0].length > 4) {
      array[0] = array[0].substring(0, 3);
    }
    return array.join(" ").toUpperCase();
  }

  function yTickFormat(value) {
    d3.select(this).attr("dy", "-0.4em").attr("x", 2).attr("font-size", "14px");
    return value.toLocaleString("en-US");
  }

  function main(objects) {
    objects = objects || null;
    updateXAxis();
    updateClipRect();
    updateEventRects();
    createLine();
    updateLine(true);
    createMarkers();
    registerObservers();
    flagData = true;
  }

  function registerObservers() {
    d3.select("#branch").on("change.coliforms", updateBranch);
  }

  function updateBranch(ev) {
    var branch = d3.select(this).property("value");
    setActiveBranch(branch);
  }

  function updateXAxis(flagTransition) {
    flagTransition = flagTransition || false;
    xAxis.tickValues(getTicksFromDomain(xScale.domain()));
    if (flagTransition) {
      gXAxis.transition().duration(transitionTime).call(xAxis);
    } else {
      gXAxis.call(xAxis);
    }
  }

  function updateLine(flagTransition) {
    flagTransition = flagTransition || false;
    if (flagTransition) {
      gMain
        .select("path")
        .transition()
        .duration(transitionTime)
        .attr("d", lineGenerator(activeBranch.values));
    } else {
      gMain.select("path").attr("d", lineGenerator(activeBranch.values));
    }
  }

  function getTicksFromDomain(domain) {
    var startDate = domain[0];
    var endDate = domain[1];
    startDate = Date.UTC(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    endDate = Date.UTC(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    var daysBetweenDates = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );
    var days = daysBetweenDates + 1;
    var ticks = d3.min([Math.floor(svgBox.content.width / 100), 9]) + 1;
    var daysOffset = Math.ceil(daysBetweenDates / ticks + 2);
    daysOffset = Math.ceil(days / ticks);
    var array = [];
    var date = null;
    for (i = 1; i <= ticks; i++) {
      date = new Date(
        domain[0].getFullYear(),
        domain[0].getMonth(),
        domain[0].getDate()
      );
      date.setDate(date.getDate() + i * daysOffset);
      if (date < endDate) {
        array.push(date);
      }
    }
    return array;
  }

  function updateClipRect() {
    clipRect
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", mainBox.outer.width)
      .attr("height", mainBox.outer.height);
  }

  function updateEventRects() {
    var startDate = domain[0];
    var endDate = domain[1];
    var width = xScale(endDate) - xScale(startDate) + 2 * tooltipCircleRadius;
    eventsRect
      .attr("x", xScale(startDate) - tooltipCircleRadius)
      .attr("width", width)
      .attr("height", mainBox.outer.height)
      .on("mousemove", function (ev) {
        var coordinates = d3.pointer(ev);
        var x = coordinates[0];
        var date = xScale.invert(x);
        if (activeBranch.values.length > 0) {
          var d = activeBranch.values.reduce(function (prev, curr) {
            return Math.abs(curr.date - date) < Math.abs(prev.date - date)
              ? curr
              : prev;
          });
          showTooltip(d);
        }
      })
      .on("mouseleave", hideTooltip);
  }

  function createLine() {
    var values = activeBranch.values.map(mapValuesToZero);
    gMain
      .append("path")
      .attr("d", lineGenerator(values))
      .attr("fill", "none")
      .attr("stroke", "#00578E")
      .attr("stroke-width", "3px")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .style("pointer-events", "none");
  }

  function mapValuesToZero(obj) {
    return { date: obj.date, value: 0 };
  }

  function calculateXValue(d) {
    return xScale(d.date);
  }

  function calculateYValue(d) {
    var domain = yScale.domain();
    var max = domain[1];
    return Math.max(yScale(d.value), yScale(max * 100));
  }

  function showTooltip(d) {
    tooltip.classed("overflow", false);
    tooltip
      .select('[data-tooltip-role="title"]')
      .text("Estimated Fecal Coliform")
      .style("color", null);
    tooltip
      .select('[data-tooltip-role="value"]')
      .text(`${d.tooltipValue}/100 mL`);
    tooltip
      .select('[data-tooltip-role="date"]')
      .text(`${d.date.toLocaleString("en-US")}`);

    let yD = yScale(d.value);
    let yMax = yScale(yScale.domain()[1]);
    tooltipCircle.attr("cx", xScale(d.date)).attr("cy", yScale(d.value));
    if (yD < yMax) {
      tooltip.classed("overflow", true);
      tooltipCircle.attr("cy", yScale(yScale.domain()[1]));
      tooltipCircle.style("opacity", 0);
    } else {
      tooltipCircle.style("opacity", 1);
    }

    var position = tooltipCircle.node().getBoundingClientRect();

    var x = window.pageXOffset + position.x + position.width / 2;
    var y = window.pageYOffset + position.y;

    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    );

    tooltip.style("opacity", 1);
  }

  function showTooltipCSO(ev, d, i) {
    tooltip
      .select('[data-tooltip-role="title"]')
      .text("Manual Fecal Coliform")
      .style("color", colors.marker);
    tooltip
      .select('[data-tooltip-role="value"]')
      .text(`${d.tooltipValue}/100 mL`);
    tooltip
      .select('[data-tooltip-role="date"]')
      .text(`${d.date.toLocaleString("en-US")}`);

    var position = d3.select(this).node().getBoundingClientRect();
    var x = window.pageXOffset + position.x + position.width / 2;
    var y = window.pageYOffset + position.y;

    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    );

    tooltip.style("opacity", 1);
  }

  function hideTooltip(ev) {
    tooltip.style("opacity", 0);
    tooltipCircle.style("opacity", 0);
  }

  function createMarkers() {
    let markerWidth = 10;

    gMarkers.selectAll("g").data([]).exit().remove();

    var groups = gMarkers.selectAll("g").data(activeBranch.occurences);

    var groupsEnter = groups
      .enter()
      .append("g")
      .on("mouseenter", showTooltipCSO)
      .on("mouseleave", hideTooltip);

    groupsEnter
      .append("rect")
      .attr("fill", colors.marker)
      .attr("transform", function (d) {
        let x = xScale(d.date) + markerWidth / 2;
        let y = yScale(d.value) + markerWidth / 2;
        return `translate(-${
          markerWidth / 2
        }, -${markerWidth / 2}) rotate(45 ${x} ${y})`;
      })
      .attr("width", markerWidth)
      .attr("height", markerWidth)
      .attr("x", function (d) {
        return xScale(d.date);
      })
      .attr("y", function (d) {
        return yScale(d.value);
      });

    groupsEnter
      .append("line")
      .attr("stroke", colors.marker)
      .attr("stroke", colors.marker)
      .attr("y1", function (d) {
        return yScale(d.value);
      })
      .attr("y2", yScale(0))
      .attr("x1", function (d) {
        return xScale(d.date);
      })
      .attr("x2", function (d) {
        return xScale(d.date);
      });
  }

  function debounce(func) {
    var timer;
    return function (event) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(func, debounceTime, event);
    };
  }

  setup();

  function wrap(text, width) {
    text.each(function () {
      let text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")) || 0,
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr(
              "dy",
              Math.max(++lineNumber * lineHeight, lineHeight) + dy + "em"
            )
            .text(word);
        }
      }
    });
  }
};
