module.exports = function(model) {
    var graph = {
        nodes: [],
        links: []
    };

    // For all sheets
    $.each(model.sheets, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // Add node to graph
            node.graphIndex = graph.nodes.push(node) - 1;
            node.label = node.properties[sheet.label];
            node.sheetName = sheet.name;
        });
    });

    // Create links
    $.each(model.sheets, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // For all link names
            $.each(sheet.linkNames, function(k, linkName) {
                // For all target nodes
                var graphTargetIndexes = [];
                $.each(node.links[linkName], function(l, targetIndex) {
                    var link = {
                        source: node.graphIndex,
                        target: model.sheets[linkName].nodes[targetIndex].graphIndex
                    };
                    graphTargetIndexes.push(link.target);
                    graph.links.push(link);
                });

                // Replace model indexes with graph indexes
                node.links[linkName] = graphTargetIndexes;
            });
        });
    });

    return graph;
}