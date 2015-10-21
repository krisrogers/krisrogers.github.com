/**
 * Timeline visualisation for RUBI interaction metadata.
 */
function Timeline (data) {

    // Dimensional constants
    var WIDTH = 1200,
        HEIGHT = 580,
        STREAM_HEIGHT = 50,
        MAX_CLIP_LENGTH = 7200;

    var earliestStart = null,
        latestEnd = null;
    (function marshallData () {
        // streams data
        data.streams.forEach(function (stream, i) {
            stream.start_time = new Date(Date.parse(stream.start_time));
            stream.end_time = new Date(stream.start_time.getTime() + stream.duration * 1000);
            if (!earliestStart) {
                earliestStart = stream.start_time;
                latestEnd = stream.end_time;
            } else {
                earliestStart = new Date(Math.min(earliestStart, stream.start_time));
                latestEnd = new Date(Math.max(latestEnd, stream.end_time));
            }
            stream.colourIndex = i;
        });
        data.streams.sort(function (s1, s2) {
            return s1.start_time.getTime() - s2.start_time.getTime();
        });
        // speech data
        data.speech.forEach(function (s, i) {
            s.start = new Date(s.start);
            s.end = new Date(s.end);
            s.type = parseInt(s.type, 10);
            if (s.type === 3) {
                s.colourIndex = data.streams.length + 0;
            } else if (s.type === 4) {
                s.colourIndex = data.streams.length + 1;
            } else if (s.type === 5) {
                s.colourIndex = data.streams.length + 2;
            } else if (s.type === 16) {
                s.colourIndex = data.streams.length + 3;
            }
        });
        data.speech.sort(function (s1, s2) {
            return s1.type - s2.type;
        });
        // eye movement data
        var lastEye = null;
        data.eyes.forEach(function (e) {
            e.time = new Date(e.time);
            e.prev = lastEye;
            earliestStart = new Date(Math.min(earliestStart, e.time));
            latestEnd = new Date(Math.max(latestEnd, e.time));
            lastEye = e;
        });
    }());

    var streamIds = d3.set(data.streams.map(function (stream) { return stream.folder; })).values(),
        yPosScale = d3.scale.ordinal().domain(streamIds).rangeBands([STREAM_HEIGHT, (streamIds.length + 1) * STREAM_HEIGHT * 1.5]),
        timeScale = d3.time.scale().domain([earliestStart, new Date(latestEnd.getTime() + 500000)]).range([0, WIDTH]).nice(),
        secondsPerPixel = (latestEnd - earliestStart) / WIDTH / 1000,
        maxStreamY = yPosScale.range().slice(-1)[0],
        speechY = maxStreamY + STREAM_HEIGHT * 2,
        eyesY = speechY + STREAM_HEIGHT * 1.5,
        maxY = maxStreamY + STREAM_HEIGHT * 5.5 + 75,
        xAxis;

    var svg = d3.select(".content").append("svg")
            .attr("class", function (d) { return data.videoComposition ? "video-composition" : null; })
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .on("mousedown", function () {
                svg.style("cursor", "move");
            })
            .on("mouseup", function () {
                svg.style("cursor", null);
            }),
        background = svg.append("rect")
            .attr("fill", "transparent")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", WIDTH)
            .attr("height", HEIGHT);
    d3.select(".content").append("h3").text(data.streams[0].start_time.toDateString());
    var zoom = d3.behavior.zoom()
        .x(timeScale)
        .scaleExtent([1, 50])
        .translate([50, 0])
        .on("zoom", function zoomed() {
            svg.selectAll("line.speech-indicator").remove();
            redraw();
            xAxis.tickFormat( timeScale.invert(10) - timeScale.invert(0) <= 4000 ? d3.time.format("%H:%M:%S") : d3.time.format("%H:%M"));
            svg.select(".x-axis").call(xAxis);
        });
    svg.call(zoom);
    
    function redraw () {
        // Draw the video streams, each as its own row.
        (function drawStreams () {
            svg.selectAll("g.stream").remove();
            var streamRows = svg.selectAll("g.stream").data(data.streams).enter().append("g")
                .attr("class", "stream")
                .attr("transform", function (d) {
                    return "translate(" + (d.x = timeScale(d.start_time)) + "," + (d.y = yPosScale(d.folder)) + ")";
                })
                .each(util.registerStreamTooltip);
            streamRows.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", function (d) { return (d.width = timeScale(d.end_time) - timeScale(d.start_time)); })
                .attr("height", STREAM_HEIGHT)
                .attr("class", function (d) { return "qual-" + d.colourIndex; });
            streamRows.append("text")
                .attr("x", function (d) {
                    if (d.width <= WIDTH) { 
                        return d.width / 2; 
                    } else if (d.x + d.width < WIDTH) { 
                        return WIDTH / 2 - (WIDTH - (d.x + d.width)) - d.x;
                    } else if (d.x < 0) {
                        return WIDTH / 2 - d.x;
                    } else {
                        return WIDTH / 2;
                    }
                })
                .attr("y", STREAM_HEIGHT / 2)
                .text(function (d) { return d.folder; });
            
        }());

        // Draw the speech as a single row
        (function drawSpeech () {
            svg.selectAll("g.speech").remove();
            var speechRow = svg.append("g").attr("class", "speech"),
                speechSegments = speechRow.selectAll("g.speech-segment").data(data.speech).enter()
                    .append("g").attr("class", "speech-segment");
            speechSegments.attr("transform", function (d) {
                return "translate(" + timeScale(d.start) + "," + speechY + ")";
            })
            .on("mouseover", function (d) {
                // Draw lines to indicate speech resource share
                svg.selectAll("line.speech-indicator").remove();
                svg.append("line")
                    .attr("class", "speech-indicator")
                    .attr("x1", timeScale(d.start))
                    .attr("x2", timeScale(d.start))
                    .attr("y1", maxY + 10)
                    .attr("y2", 0);
                svg.append("line")
                    .attr("class", "speech-indicator")
                    .attr("x1", timeScale(d.end))
                    .attr("x2", timeScale(d.end))
                    .attr("y1", maxY + 10)
                    .attr("y2", 0);
            }).on("mouseout", function (d) {
                svg.selectAll("line.speech-indicator").remove();
            }).each(util.registerSpeechTooltip);
            speechSegments.append("rect")
                .attr("x", 0)
                .attr("y", function (d) { return d.type === 1 ? 0 : 2; })
                .attr("width", function (d) { return (d.width = timeScale(d.end) - timeScale(d.start.getTime())); })
                .attr("height", function (d) { return STREAM_HEIGHT - (d.type === 1 ? 0 : 4); })
                .attr("class", function (d) { return  d.type === 1 ? "full-interaction" : "qual-" + d.colourIndex; });

        }());

        // Draw a representation of eye movement as average positions within 5 second buckets.
        (function drawEyeMovement () {
            svg.selectAll("g.eyes").remove();
            var eyesRow = svg.append("g").attr("class", "eyes"),
                zoomScale = timeScale.invert(10) - timeScale.invert(0) <= 7000 ? true : false;

            // Background
            eyesRow.append("rect")
                .attr("x", timeScale(earliestStart))
                .attr("y", yPosScale.range().slice(-1)[0] + STREAM_HEIGHT * 4.5)
                .attr("width", timeScale(latestEnd) - timeScale(earliestStart))
                .attr("height", STREAM_HEIGHT)
                .attr("class", "qual-9");

            var eyeSegments = eyesRow.selectAll("g.eyes-segment").data(data.eyes).enter().append("g")
                .each(function (d) {
                    d.x = timeScale(d.time);
                    d.y = yPosScale.range().slice(-1)[0] + STREAM_HEIGHT * 4.5;
                    d.width = timeScale(new Date(d.time.getTime() + EYE_BUCKET_MILLIS)) - d.x;
                    d.x2 = (d.pos[0] + 3) / 6 * d.width;
                    d.y2 = (-d.pos[1] + 3) / 6 * STREAM_HEIGHT;
                })
                .attr("class", "eye-segment")
                .attr("transform", function (d, i) { return "translate(" + d.x + "," + d.y + ")"; });

            if (zoomScale) {
                // Grid for data point
                eyeSegments.append("rect")
                    .attr("class", "eye-grid")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", function (d) { return d.width; })
                    .attr("height", STREAM_HEIGHT);
                eyeSegments.append("line")
                    .attr("class", "eye-grid")
                    .attr("x1", function (d) { return d.width / 2; })
                    .attr("x2", function (d) { return d.width / 2; })
                    .attr("y1", function (d) { return 0; })
                    .attr("y2", function (d) { return STREAM_HEIGHT; });
                eyeSegments.append("line")
                    .attr("class", "eye-grid")
                    .attr("x1", function (d) { return 0; })
                    .attr("x2", function (d) { return d.width; })
                    .attr("y1", function (d) { return STREAM_HEIGHT / 2; })
                    .attr("y2", function (d) { return STREAM_HEIGHT / 2; });

                // Vector path for prev -> current data point
                eyeSegments.append("path")
                    .attr("class", "eye-vector")
                    .attr("d", function (d) { 
                        if (d.prev) {
                            return "M " + d.prev.x2 + ", " + d.prev.y2 + " L " + d.x2 + ", " + d.y2;
                        }
                        return null;
                    });
            }

            // Plot coordinates as circle in grid square
            eyeSegments.append("circle")
                .attr("class", "eye-marker")
                .attr("cx", function (d) { return d.x2; })
                .attr("cy", function (d) { return d.y2; })
                .attr("r", function () { return zoomScale ? 3 : 2; })
                .each(util.registerEyeTooltip);
        }());

        // Side borders
        svg.append("line")
            .attr("x1", 1)
            .attr("x2", 1)
            .attr("y1", 0)
            .attr("y2", maxY + 10)
            .style("stroke", "black")
            .style("stroke-width", 2);
        svg.append("line")
            .attr("x1", WIDTH - 1)
            .attr("x2", WIDTH - 1)
            .attr("y1", 0)
            .attr("y2", maxY + 10)
            .style("stroke", "black")
            .style("stroke-width", 2);
    }
    redraw();

    // Draw the axes and labels
    (function drawAxes () {
        // X-axis (time)
        xAxis = d3.svg.axis()
            .scale(timeScale)
            .orient('bottom')
            .innerTickSize(8)
            .outerTickSize(2)
            .tickPadding(8)
            .tickFormat(d3.time.format("%H:%M"));
        svg.append("g")
            .attr("class", "x-axis")
            .attr('transform', 'translate(0, ' + (maxY + 10) + ')')
            .call(xAxis);

        var svgTop = svg.node().getBoundingClientRect().top;
        d3.select(".content").append("div")
            .attr("class", "axis-label")
            .text("Video Streams")
            .style("top", svgTop + STREAM_HEIGHT * 1.4 + "px");
        d3.select(".content").append("div")
            .attr("class", "axis-label")
            .text("Speech Events")
            .style("top", svgTop + speechY + STREAM_HEIGHT * 0.4 + "px");
        d3.select(".content").append("div")
            .attr("class", "axis-label")
            .text("Eye Movements")
            .style("top", svgTop + eyesY + STREAM_HEIGHT * 1.3 + "px");
    }());


    // Initialise video composition features
    if (data.videoComposition) {
        var drag = d3.behavior.drag()
            .on('dragstart', function() {
              svg.selectAll("rect.select-area").remove();
              var mouse = d3.mouse(svg.node());
              svg.append("rect")
                .attr("class", "select-area")
                .attr("x", Math.max(mouse[0], timeScale(earliestStart)))
                .attr("y", 25)
                .attr("height", maxY + 20);
            })
            .on('drag', function() {
                var mouse = d3.mouse(svg.node()),
                    selectArea = svg.select("rect.select-area"),
                    width = mouse[0] - selectArea.attr("x");
                width = Math.min(width, MAX_CLIP_LENGTH / secondsPerPixel);
                if (width > 0) {
                    selectArea.attr("width", width);
                } else {
                    selectArea.attr("width", 0);
                }
            })
            .on('dragend', function (e) {
                var selectArea = svg.select("rect.select-area"),
                    width = selectArea.attr("width");
                if (width > 0) {
                    Server.selectClip((timeScale.invert(selectArea.attr("x")) - earliestStart) / 1000, width * secondsPerPixel);
                    svg.select("rect.select-area").remove();
                }
            });
        background.call(drag);
        svg.selectAll("g.speech-segment")
            .on("click", function (d) {
                Server.selectClip((d.start - earliestStart) / 1000, (d.end - d.start) / 1000);
            });
    }
}