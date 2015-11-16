var init = require("./init");

!function() {
    checkRequirements();

    var d3sheet = {
        ver: "1.0.0"
    };

    module.exports = d3sheet;

    // Initialize D3 sheet
    d3sheet.init = function(containerId) {
        if (containerId == null) {
            // Use default
            d3sheet.containerId = "d3sheet-container";
        }
        else {
            d3sheet.containerId = containerId;
        }

        d3.select("#d3sheet-container")
            .append("svg:svg");
    }

    function checkRequirements() {
        if (typeof d3 === "undefined")
            throw new Error("D3 library not found!");
        if (typeof $ === "undefined")
            throw new Error("jQuery not found!");
    }
}();