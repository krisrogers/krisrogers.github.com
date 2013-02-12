var diagonal, root, tree, vis, i = 0;

function initTree () {

    var m = [20, 120, 20, 120],
        w = 900 - m[1] - m[3],
        h = 600 - m[0] - m[2];
    
    tree = d3.layout.tree().size([h, w]);
    
    diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });
    
    // Create the svg
    vis = d3.select("#vis").append("svg:svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
    
    root = JSON;
    root.x0 = h / 2;
    root.y0 = 0;

    // Expand only some of the nodes
    root.children.forEach(toggleAll);
    toggle(root.children[0]);
    toggle(root.children[1]);
    toggle(root.children[2]);
    toggle(root.children[3]);
    toggle(root.children[4]);
    
    update(root);
}

function toggleAll(d) {
    if (d.children) {
        d.children.forEach(toggleAll);
        toggle(d);
    }
}

// Draw the tree
function update(source) {
    
    var duration = 1000;
  
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse();
  
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 190; });
  
    // Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });
  
    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
  
    nodeEnter.append("svg:circle")
        .attr("class", function (d) { return d.children || d._children ? "branch" : "leaf"})
        .attr("r", 1e-6)
        .attr("cursor", function (d) { return d.depth == 0 ? "default" : "pointer"})
        .on("click", function(d) { if (d.depth == 0) { return; } toggle(d); update(d); })
        .style("fill", function(d) {
            return d.depth == 0 ? "#999" : d.children ? "white" : "lightsteelblue";
        })
        .style("stroke", function (d) { return d.depth == 0 ? '#5A5A9E' : 'steelblue'});
  
    nodeEnter.append("svg:text")
        .attr("class", function (d) { return d.popup ? "popup" : (d.target || d.email ? "link" : null); })
        .attr("x", function(d) { return d.children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) { return d.depth == 0 ? '' : d.name; })
        .attr("fill-opacity", 1e-6)
        .attr("font-size", function (d) { return 1 - (.1 * d.depth) + "em"})
        .on("click", function(d) {
            if (d.target) {
                window.open(d.target);
            }
            else if (d.email) {
                window.location.href = "mailto:"+d.email;
            }
            else if (d.popup) {
                $('#' + d.popup).bPopup({closeClass: 'popup-close-link-exp'});
            }
        });
  
    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
  
    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d.depth == 0 ? "#999" : d.children ? "white" : "lightsteelblue"; })
        .style("stroke", function (d) { return d.depth == 0 ? '#5A5A9E' : 'steelblue'});
  
    nodeUpdate.select("text").style("fill-opacity", 1);
  
    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();
  
    nodeExit.select("circle")
        .attr("r", 1e-6);
  
    nodeExit.select("text")
        .style("fill-opacity", 1e-6);
  
    // Update the links…
    var link = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.target.id; });
  
    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        })
      .transition()
        .duration(duration)
        .attr("d", diagonal);
  
    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);
  
    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();
  
    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
}

// Toggle children.
function toggle(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    }
    else {
      d.children = d._children;
      d._children = null;
    }
}

// Vis data
var JSON = {
    name: "Resume",
    children: [{
        name: "Contact Details",
        children: [
            {name: "Brisbane, Australia"},
            {name: "E: kris.rogers.01@gmail.com", email: "kris.rogers.01@gmail.com"},
            {name: "M: 0402 698 626"}
        ]
    }, {
        name: "Skills",
        children: [
            {name: 'Java, JavaScript, Python'},
            {name: 'Information Visualisation'},
            {name: 'Text Analytics'},
            {name: 'UI Design'},
            {name: 'Desktop Deployment [Windows, Mac, Linux]'},
            {name: 'Server Deployment [Linux, Amazon EC2]'},
            {name: 'Oracle, MySQL, MongoDB'},
            {name: 'System Testing'},
            {name: 'Web Crawling'}
        ]
    }, {
        name: "Experience",
        children: [{
            name: "Leximancer",
            popup: "experience-leximancer"
        }, {
            name: "Daesim Technologies",
            popup: "experience-daesim"
        }]
    }, {
        name: "Education",
        children: [{
            name: "Bachelor of Engineering",
            children: [
                {name: 'Software Engineering (Hons)'},
                {name: "Univeristy of Queensland", target: "http://www.uq.edu.au/"},
                {name: "2002 - 2006"},
                {name: "Algorithm Design"},
                {name: "Operating Systems"},
                {name: "Embedded Systems"},
                {name: "SDLC"},
                {name: "Aritificial Neural Networks"}
            ]
        }]
    }, {
        name: "Interests",
        children: [
            {name: "Cooking"},
            {name: "Drums"},
            {name: "Philosophy, Metaphysics"},
            {name: "Learning"}
        ]
    }]
};