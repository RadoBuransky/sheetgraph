module.exports = function(graph, svgContainerId, svg) {
    var node = [],
        link = [],
        linkLabel = [];

    var svgContainer = $("#" + svgContainerId),
        width = svgContainer.width(),
        height = svgContainer.height();

    selectAll();

    var force = d3.layout.force()
        .size([width, height])
        .linkDistance(30) // TODO: Move to settings
        .charge(-5000) // TODO: Move to settings
        .gravity(0.5) // TODO: Move to settings
        .nodes(graph.nodes)
        .links(graph.links)
        .on("tick", onTick);

    restart();

    function restart() {
        svg.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("class", "link");

//        svg.selectAll(".link-label").data(graph.links)
//            .enter()
//            .append("text")
//            .text(linkText)
//            .attr("class", "link-label")
//            .attr("text-anchor", "middle");

        node = svg.selectAll(".node").data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("x", 0)
            .attr("y", 0)
//            .attr("id", nodeId)
            .call(force.drag);
//            .on("click", function(node) {
//                modelController.showInfo(node, model);
//                view.selectNode(node);
//            });

        var circle = node.append("circle")
            .attr("r", 50); // TODO: Settings

//        node.append("text")
//            .attr("dy", ".35em")
//            .attr("text-anchor", "middle")
//            .text(nodeText);

        selectAll();
        force.start();
    }

    function selectAll() {
        node = svg.selectAll(".node");
        link = svg.selectAll(".link");
        linkLabel = svg.selectAll(".link-label");
    }

    function onTick() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        linkLabel
            .attr("x", function(d) {
                return (d.source.x + d.target.x)/2; })
            .attr("y", function(d) {
                return (d.source.y + d.target.y)/2; });

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }
}