module.exports = function(model, updateGraph) {
    initNodeVisibility(model.sheets);

    function initNodeVisibility(sheets) {
        // Create visibility checkboxes
        var e = $("#d3sheet-node-visibility");
        var sheetNames = Object.keys(sheets);
        $.each(sheetNames, function(i, sheetName) {
            var eId = nodeVisiblityCheckboxId(sheetName);

            // Create checkbox
            e.append("<div class=\"checkbox\"><label>" +
                "<input type=\"checkbox\" id=\"" + eId + "\" checked=\"checked\">" + sheetName + "</label></div>");

            // Add click handler
            $("#" + eId).click(function() {
                updateView();
            });
        });
    }

    function updateView() {
        var viewOptions = {
            nodeVisibility: getNodeVisibility(model.sheets)
        }

        updateGraph(viewOptions);
    }

    function getNodeVisibility(sheets) {
        var result = {};
        var sheetNames = Object.keys(sheets);
        $.each(sheetNames, function(i, sheetName) {
            var isVisible = $("#" + nodeVisiblityCheckboxId(sheetName)).is(":checked");
            result[sheetName] = isVisible;
        });
        return result;
    }

    function nodeVisiblityCheckboxId(sheetName) {
        return "d3sheet-node-visibility-" + sheetName;
    }
}