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
    $.each(graph.nodes, function(i, graphNode) {
        // For all references
        $.each(graphNode.node.refs, function(j, ref) {
            var targetNodeIndex = nodeGraphIndex(ref.targetNode);

            var link = {
                source: graphNode,
                target: graph.nodes[targetNodeIndex],
                label: ref.label
            };
            graph.links.push(link);
        });
    });

    function nodeGraphIndex(node) {
        var result = -1;
        $.each(graph.nodes, function(i, graphNode) {
            if (graphNode.node == node) {
                result = i;
                return false;
            }
        });
        return result;
    }

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