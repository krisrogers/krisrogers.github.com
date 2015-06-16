// Initialisation
(function initData () {
    var data = JSON.parse(document.getElementById("data").textContent);
    draw(data["HISTORY"], data["TOTAL_YEARS"], data["COLOURS"]);
}());


// Main draw routine
function draw(HISTORY, TOTAL_YEARS, COLOURS) {
    var container = d3.select(".container"),
        svg = container.select("svg"),
        width = parseInt(container.style("width"), 10),
        height = parseInt(container.style("height"), 10),
        segmentTickHeight = 15,
        dummySegmentWidth = 40,
        lineGenerator = d3.svg.line(),
        arcTickGenerator = d3.svg.symbol().type("triangle-down").size(100),
        axisY = Math.round(height * 0.6),
        axis,
        axisLabels,
        backgroundSections,
        outerArcs,
        middleArcs,
        innerArcs;

    // Add dummy sections
    HISTORY.unshift({
        "_dummy": true
    });
    HISTORY.push({
        "_dummy": true,
        "startYear": HISTORY[HISTORY.length - 1].endYear
    });

    (function calculatePositions () {
        var availableWidth = width - dummySegmentWidth * 2,
            x = 0,
            i = 0;
        HISTORY.forEach(function (h) {
            if (h._dummy) {
                h.segmentWidth = dummySegmentWidth;
                h.x = x;
                x += h.segmentWidth;
            } else {
                h.colour = COLOURS[i++];
                h.segmentWidth = h._dummy ? dummySegmentWidth : Math.floor(h.years / TOTAL_YEARS * availableWidth);
                h.x = x;
                x += h.segmentWidth;

                // Setup arc properties
                var r0 = h.segmentWidth * 0.4,
                    r1 = r0 * 0.5,
                    r2 = r1 * 0.7,
                    r3 = 0;
                h.outerArcGenerator = d3.svg.arc().innerRadius(r1).outerRadius(r0);
                h.middleArcGenerator = d3.svg.arc().innerRadius(r2).outerRadius(r1);
                h.innerArcGenerator = d3.svg.arc().innerRadius(r3).outerRadius(r2);
                h.startAngle = 270 * (Math.PI / 180);
                h.endAngle = h.startAngle;  // real end angle will be set via tweening
            }
        });
    }());

    // Axis
    (function drawAxis () {
        var y = axisY;
        // Draw background sections
        backgroundSections = svg.selectAll(".axis-background").data(HISTORY).enter().append("rect")
            .attr("class", "axis-background")
            .attr("x", function (d) { return d.x; })
            .attr("width", function (d) { return d.segmentWidth; })
            .attr("y", y)
            .attr("height", height - y)
            .style("fill", function (d, i) { 
                return d._dummy ? "url(#g0)" : "url(#g" + i + ")";
            });

        // Draw axis segments
        axis = svg.selectAll(".axis-segment").data(HISTORY).enter().append("path")
            .attr("class", "axis-segment")
            .attr("d", function(d, i) {
                var segmentWidth = width;
                var points = [
                    [d.x, y],
                    [d.x + d.segmentWidth, y]                    
                ];
                if (!d._dummy) {
                    points.unshift([d.x, y + segmentTickHeight]);
                    points.push([d.x + d.segmentWidth, y + segmentTickHeight]);
                }
                return lineGenerator(points);
            });

        axisLabels = svg.selectAll(".axis-label").data(HISTORY.filter(function (d) { return d.startYear; }))
        .enter().append("text")
            .attr("class", "axis-label")
            .attr("x", function (d) { return d.x; })
            .attr("y", function (d) { return y + segmentTickHeight * 2; })
            .text(function (d) { return d.startYear; })
            .style("text-anchor", "middle")
            .each(function (d) {
                var bb = this.getBBox();
                svg.append("rect")
                    .attr("class", "axis-label-background")
                    .attr("x", bb.x - 2)
                    .attr("width", bb.width + 5)
                    .attr("y", bb.y - 2)
                    .attr("height", bb.height + 5)
                    .attr("rx", 2)
                    .attr("ry", 2)
            })
            .moveToFront();
        // Spacer beneath axis
        /*svg.append("rect")
            .attr("class", "axis-spacer")
            .attr("x", 0)
            .attr("width", width)
            .attr("y", y - segmentTickHeight)
            .attr("height", segmentTickHeight);*/
    }());

    (function drawArcs () {
        var y = axisY - segmentTickHeight,
            data = HISTORY.filter(function (h) {
                return !h._dummy;
            });
        outerArcs = svg.selectAll("arc-outer").data(data).enter().append("path")
            .attr("class", "arc-outer")
            .attr("d", function (d) {
                return d.outerArcGenerator(d);
            })
            .attr("transform", function (d) {
                return "translate(" + (d.x + d.segmentWidth / 2) + "," + y + ")";
            })
            .style("fill", function (d, i) { 
                return d.colour;
            })
            .transition().duration(750).call(arcTween, 450 * (Math.PI / 180), "outerArcGenerator");
        middleArcs = svg.selectAll("arc-middle").data(data).enter().append("path")
            .attr("class", "arc-middle")
            .attr("d", function (d) {
                return d.middleArcGenerator(d);
            })
            .attr("transform", function (d) {
                return "translate(" + (d.x + d.segmentWidth / 2) + "," + y + ")";
            })
            .transition().duration(750).call(arcTween, 450 * (Math.PI / 180), "middleArcGenerator");
        innerArcs = svg.selectAll("arc-inner").data(data).enter().append("path")
            .attr("class", "arc-inner")
            .attr("d", function (d) {
                return d.innerArcGenerator(d);
            })
            .attr("transform", function (d) {
                return "translate(" + (d.x + d.segmentWidth / 2) + "," + y + ")";
            })
            .style("fill", function (d, i) { 
                return d.colour;
            })
            .transition().duration(750).call(arcTween, 450 * (Math.PI / 180), "innerArcGenerator");
        // Arc ticks
        svg.selectAll(".arc-tick").data(data).enter().append("path")
            .attr("class", "arc-tick")
            .attr("d", arcTickGenerator)
            .attr("transform", function (d) {
                return "translate(" + (d.x + d.segmentWidth / 2) + "," + (y + 3) + ")";
            })
            .transition().duration(750)
            .style("fill", function (d) {
                return d.colour;
            });
    }());

    (function drawHistoryDescriptions () {
        var data = HISTORY.filter(function (h) {
            return !h._dummy;
        }),
        marginLeft = container.node().offsetLeft;
        container.selectAll(".history-description").data(data).enter().append("div")
            .attr("class", "history-description")
            .html(function (d) {
                return "<p class='history-company'>" + d.company + "</p>"
                    + "<span class='history-role' style='color:" + d.colour + "''>" + d.role + "</span>"
                    + "<p class='history-summary'>" + d.summary + "</p>";
            })
            .style({
                "left": function (d) {
                    return d.x + marginLeft + dummySegmentWidth;
                },
                "top": axisY + 60,
                "width": function (d) {
                    return d.segmentWidth - dummySegmentWidth;
                }
            });
    }());
}