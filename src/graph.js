module.exports = function(model) {
    var graph = new Graph();

    // For all sheets
    $.each(model.nodeGroups, function(i, nodeGroup) {
        // For all nodes
        $.each(nodeGroup.nodes, function(j, node) {
            // Add node to graph
            var graphNode = new GraphNode(node, nodeGroup.label, nodeGroup.name);
            graph.nodes.push(graphNode);
        });
    });

    // Create links
    $.each(model.nodeGroups, function(i, nodeGroup) {
        // For all nodes
        $.each(nodeGroup.nodes, function(j, node) {
            // For all linked nodeGroups
            $.each(nodeGroup.linkedNodeGroups, function(k, linkedSheet) {
                if (node.links[linkedSheet.name] == null)
                    return;

                // For all target nodes
                var graphTargetIndexes = [];
                $.each(node.links[linkedSheet.name], function(l, targetIndex) {
                    var link = {
                        source: node.graphIndex,
                        target: model.nodeGroups[linkedSheet.name].nodes[targetIndex].graphIndex,
                        label: linkedSheet.label
                    };
                    graphTargetIndexes.push(link.target);
                    graph.links.push(link);
                });

                // Replace model indexes with graph indexes
                node.links[linkedSheet.name] = graphTargetIndexes;
            });
        });
    });

    return graph;
}

function Graph() {
    this.nodes = [];
    this.links = [];
    return this;
}

function GraphNode(node, labelProperty, nodeGroupName) {
    this.node = node;
    this.labelProperty = labelProperty;
    this.label = node.value(labelProperty);
    this.nodeGroupName = nodeGroupName;
    return this;
}