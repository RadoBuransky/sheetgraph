module.exports = function(model, updateGraph) {
    initNodeVisibility(model.nodeGroups);

    function initNodeVisibility(nodeGroups) {
        // Create visibility checkboxes
        var e = $("#d3sheet-node-visibility");
        $.each(nodeGroups.items, function(i, nodeGroup) {
            var eId = nodeVisiblityCheckboxId(nodeGroup);

            // Create checkbox
            e.append("<div class=\"checkbox\"><label>" +
                "<input type=\"checkbox\" id=\"" + eId + "\" checked=\"checked\">" + nodeGroup.name + "</label></div>");

            // Add click handler
            $("#" + eId).click(function() {
                updateView();
            });
        });
    }

    function updateView() {
        updateGraph(new ViewOptions(getNodeVisibility(model.nodeGroups)));
    }

    function getNodeVisibility(nodeGroups) {
        var result = {};
        $.each(nodeGroups.items, function(i, nodeGroup) {
            var isVisible = $("#" + nodeVisiblityCheckboxId(nodeGroup)).is(":checked");
            result[nodeGroup.name] = isVisible;
        });
        return result;
    }

    function nodeVisiblityCheckboxId(nodeGroup) {
        return "d3sheet-node-visibility-" + nodeGroup.name;
    }
}

function ViewOptions(nodeVisibility) {
    this.nodeVisibility = nodeVisibility;
    return this;
}