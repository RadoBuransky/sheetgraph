(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.d3sheet = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
!function() {
    checkRequirements();

    var d3sheet = {
        ver: "1.0.0",
        svgContainerId: "",
        infoContainerId: "",
        svg: {},
        spreadsheet: {},
        model: {}
    };

    module.exports = d3sheet;

    /**
    * Initialize D3 sheet.
    * @param {string} containerId - identifier of the main DIV.
    **/
    d3sheet.init = function(svgContainerId, infoContainerId) {
        if (svgContainerId == null)
            svgContainerId = "d3sheet-svg";
        d3sheet.svgContainerId = svgContainerId;

        if (infoContainerId == null)
            infoContainerId = "d3sheet-info";
        d3sheet.infoContainerId = infoContainerId;

        var svgContainer = $("#" + svgContainerId),
            width = svgContainer.width(),
            height = svgContainer.height();

        // Create SVG element
        d3sheet.svg = d3.select("#" + svgContainerId)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr('viewBox', "0 0 " + width + " " + height);

        // Create info panel
        d3.select("#" + infoContainerId)
            .append("div");

        return d3sheet;
    }

    /**
    * Load data from spreadsheet.
    **/
    d3sheet.load = function(spreadsheetKey) {
        // Load spreadsheet
        var spreadsheet = require("./spreadsheet");
        spreadsheet(spreadsheetKey, function(spreadsheet) {
            d3sheet.spreadsheet = spreadsheet;

            // Initialize document
            document.title = spreadsheet.title;

            // Initialize info section
            var infoModule = require("./info");
            var info = infoModule(d3sheet.infoContainerId, spreadsheet.title);

            // Create model from spreadsheet
            var modelModule = require("./model");
            d3sheet.model = modelModule(d3sheet.spreadsheet);

            // Create graph from model
            var graphModule = require("./graph");
            d3sheet.graph = graphModule(d3sheet.model);

            // Create D3 force layout from graph
            var forceModule = require("./force");
            var force = forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info, spreadsheet.settings);

            // Initialize view options
//            var viewModule = require("./view");
//            viewModule(d3sheet.model, force.updateGraph);

            // Apply CSS style
            applyCss(spreadsheet.settings.css);
        });
    }

    function applyCss(css) {
        if (css == null)
            return;

        // Get all element selectors
        var selectors = Object.keys(css);
        $.each(selectors, function(i, selector) {
            var elements = {};
            if (selector.slice(0, 1) == "#")
                // It is an identifier
                elements = $(selector);
            else
                // Is is a class
                elements = $("." + selector);

            // Get all style properties
            var properties = Object.keys(css[selector]);
            $.each(properties, function(j, property) {
                elements.css(property, css[selector][property]);
            });
        });
    }

    function checkRequirements() {
        if (typeof d3 === "undefined")
            throw new Error("D3 library not found!");
        if (typeof $ === "undefined")
            throw new Error("jQuery not found!");
    }
}();
},{"./force":2,"./graph":3,"./info":4,"./model":5,"./spreadsheet":6}],2:[function(require,module,exports){
module.exports = function(graph, svgContainerId, svg, info) {
    var node = [],
        nodeLabel = [],
        link = [],
        linkLabel = [],
        colors = d3.scale.category20();

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

    function restart(viewOptions) {
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

        svg.selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", 30) // TODO: Settings
            .attr("x", 0)
            .attr("y", 0)
            .attr("fill", nodeFillColor)
            .call(force.drag)
            .on("click", nodeClick);

        svg.selectAll(".node-label")
            .data(graph.nodes)
            .enter()
            .append("text")
            .attr("class", "node-label")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(n) { return n.label; })
            .call(force.drag)
            .on("click", nodeClick);

        selectAll();
        force.start();
    }

    function nodeClick(node) {
        info.showNode(node, graph.nodes, nodeFillColor(node));
    }

    function nodeFillColor(node) {
        return colors(node.sheetName);
    }

    function selectAll() {
        node = svg.selectAll(".node");
        nodeLabel = svg.selectAll(".node-label");
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

        nodeLabel
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    }

    return this;
}
},{}],3:[function(require,module,exports){
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
            node.labelProperty = sheet.label;
            node.label = node.properties[node.labelProperty];
            node.sheetName = sheet.name;
        });
    });

    // Create links
    $.each(model.sheets, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // For all linked sheets
            $.each(sheet.linkedSheets, function(k, linkedSheet) {
                if (node.links[linkedSheet.name] == null)
                    return;

                // For all target nodes
                var graphTargetIndexes = [];
                $.each(node.links[linkedSheet.name], function(l, targetIndex) {
                    var link = {
                        source: node.graphIndex,
                        target: model.sheets[linkedSheet.name].nodes[targetIndex].graphIndex,
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
},{}],4:[function(require,module,exports){
module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node, nodes, fillColor) {
        $("#d3sheet-node-info h2").text(node.label);
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.sheetName);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        var propertyNames = Object.keys(node.properties);
        $.each(propertyNames, function(i, propertyName) {
            if (propertyName != node.labelProperty)
                addProperty(propertyName, node.properties[propertyName]);
        });

        // Show node links
        var linkNames = Object.keys(node.links);
        $.each(linkNames, function(i, linkName) {
            var targetNames = "";
            $.each(node.links[linkName], function(i, targetIndex) {
                if (targetNames != "")
                    targetNames = targetNames + ", ";
                targetNames = targetNames + nodes[targetIndex].label;
            });
            addProperty(linkName, targetNames);
        });

        function addProperty(name, value) {
            ul.append("<li><span class=\"d3sheet-node-property-name\">" + name +
                ":</span> <span class=\"d3sheet-node-property-value\">" + formatValue(value) + "</span></li>");
        }

        function formatValue(value) {
            if (value.slice(0, "4").toLowerCase() == "http")
                return "<a href=\"" + value + "\">" + value + "</a>"

            return value;
        }
    }

    return this;
}
},{}],5:[function(require,module,exports){
module.exports = function(spreadsheet) {
    var model = {
        sheets: {},
        settings: {}
    };

    var sheetTypes = getSheetTypes(spreadsheet);
    model.sheets = getGraph(spreadsheet, sheetTypes.nodesSheetNames);
    if (sheetTypes.settingsSheetName != null)
        model.settings = spreadsheet.sheets[sheetTypes.settingsSheetName];

    function getGraph(spreadsheet, nodeSheetNames) {
        // Create nodes with properties
        var sheets = {};
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            sheets[nodeSheetName] = getNodes(spreadsheet.sheets[nodeSheetName], nodeSheetName);
        });

        // Create link names
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinkNames(sheets, spreadsheet.sheets[nodeSheetName], nodeSheetName);
        });

        // Create links from node sheets
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinks(sheets, spreadsheet.sheets[nodeSheetName], nodeSheetName);
        });

        // TODO: Create links from link sheets

        function createLinks(sheets, nodeSheet, nodeSheetName) {
            var source = sheets[nodeSheetName];

            // For all sheet rows
            $.each(nodeSheet.rows, function(i, row) {
                // For all sheet columns
                var colNames = Object.keys(row);
                $.each(colNames, function(j, colName) {
                    // If this is a link column
                    var linkTarget = parseColumnLinkName(colName, sheets);
                    if (linkTarget != null) {
                        // Find index of the target node
                        $.each(sheets[linkTarget.sheetName].nodes, function(k, targetNode) {
                            // If target node property value matches
                            if (row[colName].indexOf(targetNode.properties[linkTarget.propertyName]) > -1) {
                                if (source.nodes[i].links[linkTarget.sheetName] == null)
                                    source.nodes[i].links[linkTarget.sheetName] = [];

                                // Add index of the target node to the source node
                                source.nodes[i].links[linkTarget.sheetName].push(k);
                            }
                        });
                    }
                });
            });
        }

        function createLinkNames(sheets, nodeSheet, nodeSheetName) {
            var source = sheets[nodeSheetName];

            // Get link names
            $.each(nodeSheet.header, function(i, propertyName) {
                var linkTarget = parseColumnLinkName(propertyName, sheets);
                if (linkTarget != null)
                    source.linkedSheets.push({
                        name: linkTarget.sheetName,
                        label: linkTarget.label
                    });
            });
        }

        function getNodes(nodeSheet, nodeSheetName) {
            var result = {
                name: nodeSheetName,
                label: nodeSheet.header[0],
                propertyNames: [],
                linkedSheets: [],
                nodes: []
            };

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                result.nodes.push({
                    properties: getNodeProperties(row),
                    links: {}
                });
            });

            // Get property names
            $.each(nodeSheet.header, function(i, colName) {
                var linkTarget = colName.split(".");
                if (linkTarget.length == 1)
                    result.propertyNames.push(colName);
            });

            return result;
        }

        function getNodeProperties(row) {
            var nodeProperties = {};
            var colNames = Object.keys(row);
            $.each(colNames, function(i, colName) {
                if (colName.indexOf(".") == -1)
                    nodeProperties[colName] = row[colName];
            });
            return nodeProperties;
        }

        return sheets;
    }

    function getSheetTypes(spreadsheet) {
        var sheetTypes = {
            nodesSheetNames: [],
            linkSheetNames: [],
            settingsSheetName: null
        };
        var sheetNames = Object.keys(spreadsheet.sheets);
        $.each(sheetNames, function(i, sheetName) {
            if (sheetName == "settings") {
                sheetTypes.settingsSheetName = sheetName;
                return;
            }

            if (sheetName.slice(0, 1) == "#")
                return;

            var linkSheet = parseLinkSheetName(sheetName)
            if ((linkSheet != null) &&
                (sheetNames.indexOf(linkSheet.source) > -1) &&
                (sheetNames.indexOf(linkSheet.target) > -1)) {
                sheetTypes.linkSheetNames.push(sheetName)
                return;
            }

            sheetTypes.nodesSheetNames.push(sheetName);
        });

        return sheetTypes;
    }

    function parseColumnLinkName(colName, sheets) {
        var linkNames = colName.split(".");
        if ((linkNames.length >= 2) &&
            (sheets[linkNames[0]] != null) &&
            (sheets[linkNames[0]].propertyNames.indexOf(linkNames[1]) > -1)) {
            var result = {
                sheetName: linkNames[0],
                propertyName: linkNames[1]
            }

            if (linkNames.length == 3)
                result.label = linkNames[2];

            return result;
        }

        return null;
    }

    function parseLinkSheetName(sheetName) {
        var nodeNames = sheetName.split("-");
        if (nodeNames.length == 2) {
            return {
                source: nodeNames[0],
                target: nodeNames[1]
            };
        }

        return null;
    }

    return model;
}
},{}],6:[function(require,module,exports){
module.exports = function(spreadsheetKey, onLoaded) {
    // Get sheet count
    getSpreadsheetInfo(spreadsheetKey, function onSuccess(info) {
        // Load all sheets
        loadSheets(spreadsheetKey, info);
    });

    function loadSheets(spreadsheetKey, info) {
        var spreadsheet = new Spreadsheet(spreadsheetKey, info.title);
        var loadedSheetCount = 0;
        for (i = 1; i <= info.sheetCount; i++) {
            loadSheet(spreadsheet, spreadsheetKey, i).then(function() {
                loadedSheetCount += 1;
                if (loadedSheetCount == info.sheetCount) {
                    console.log(spreadsheet);
                    onLoaded(spreadsheet);
                }
            })
        }
    }

    function loadSheet(spreadsheet, spreadsheetKey, sheetIndex) {
        return getSheet(spreadsheetKey, sheetIndex, function(response) {
            if (response.feed.title.$t == "settings") {
                loadSettingsSheet(response, spreadsheet);
                return;
            }

            var sheet = spreadsheet.sheets[response.feed.title.$t] = new Sheet();

            $.each(response.feed.entry, function(i, e) {
                if (e.gs$cell.row == 1) {
                    sheet.header[e.gs$cell.col - 1] = e.content.$t;
                }
                else {
                    var index = e.gs$cell.row - 2;
                    if (sheet.rows[index] == null) {
                        sheet.rows[index] = {};
                    }
                    sheet.rows[index][sheet.header[e.gs$cell.col - 1]] = e.content.$t;
                }
            });
        });
    }

    function loadSettingsSheet(settingsSheet, spreadsheet) {
        // Map cells to list
        var settingsList = {};
        $.each(settingsSheet.feed.entry, function(i, e) {
            if (settingsList[e.gs$cell.row] == null)
                settingsList[e.gs$cell.row] = {};

            if (e.gs$cell.col == 1)
                settingsList[e.gs$cell.row].key = e.content.$t;
            else
                if (e.gs$cell.col == 2)
                    settingsList[e.gs$cell.row].value = e.content.$t;
        });

        // Map list to object
        $.each(settingsList, function(i, s) {
            if ((s.key == null) || (s.value == null))
                return;

            // Create inner objects
            var path = s.key.split(".");
            var current = spreadsheet.settings;
            $.each(path, function(j, k) {
                if (current[k] == null) {
                    if (j == path.length - 1)
                        current[k] = s.value;
                    else
                        current[k] = {};
                }
                current = current[k];
            });
        });
    }

    function getSheet(spreadsheetKey, sheetIndex, onSuccess) {
        return $.ajax({
            url: "https://spreadsheets.google.com/feeds/cells/" + spreadsheetKey + "/" + sheetIndex + "/public/values?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: onSuccess
        });
    }

    function getSpreadsheetInfo(spreadsheetKey, onSuccess) {
        $.ajax({
            url: "https://spreadsheets.google.com/feeds/worksheets/" + spreadsheetKey + "/public/full?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: function(response) {
                var info = {
                    sheetCount: response.feed.entry.length,
                    title: response.feed.title.$t
                };
                onSuccess(info);
            }
        });
    }

    function Spreadsheet(spreadsheetKey, title) {
        this.key = spreadsheetKey;
        this.title = title;
        this.sheets = new Sheets();
        this.settings = new SettingsSheet();

        return this;
    }

    function Sheets() {
        return this;
    }

    function Sheet() {
        this.header = [];
        this.rows = [];
        return this;
    }

    function SettingsSheet() {
        this.css = {};
        return this;
    }
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XHJcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xyXG5cclxuICAgIHZhciBkM3NoZWV0ID0ge1xyXG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxyXG4gICAgICAgIHN2Z0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIGluZm9Db250YWluZXJJZDogXCJcIixcclxuICAgICAgICBzdmc6IHt9LFxyXG4gICAgICAgIHNwcmVhZHNoZWV0OiB7fSxcclxuICAgICAgICBtb2RlbDoge31cclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkM3NoZWV0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBJbml0aWFsaXplIEQzIHNoZWV0LlxyXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cclxuICAgICoqL1xyXG4gICAgZDNzaGVldC5pbml0ID0gZnVuY3Rpb24oc3ZnQ29udGFpbmVySWQsIGluZm9Db250YWluZXJJZCkge1xyXG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcclxuICAgICAgICBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkID0gc3ZnQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgaW5mb0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LWluZm9cIjtcclxuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcclxuXHJcbiAgICAgICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXHJcbiAgICAgICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIFNWRyBlbGVtZW50XHJcbiAgICAgICAgZDNzaGVldC5zdmcgPSBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcclxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoJ3ZpZXdCb3gnLCBcIjAgMCBcIiArIHdpZHRoICsgXCIgXCIgKyBoZWlnaHQpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgaW5mbyBwYW5lbFxyXG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIGluZm9Db250YWluZXJJZClcclxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGQzc2hlZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xyXG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcclxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcclxuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICAgICAgZDNzaGVldC5zcHJlYWRzaGVldCA9IHNwcmVhZHNoZWV0O1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBkb2N1bWVudC50aXRsZSA9IHNwcmVhZHNoZWV0LnRpdGxlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cclxuICAgICAgICAgICAgdmFyIGluZm9Nb2R1bGUgPSByZXF1aXJlKFwiLi9pbmZvXCIpO1xyXG4gICAgICAgICAgICB2YXIgaW5mbyA9IGluZm9Nb2R1bGUoZDNzaGVldC5pbmZvQ29udGFpbmVySWQsIHNwcmVhZHNoZWV0LnRpdGxlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgICAgIHZhciBtb2RlbE1vZHVsZSA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxyXG4gICAgICAgICAgICB2YXIgZ3JhcGhNb2R1bGUgPSByZXF1aXJlKFwiLi9ncmFwaFwiKTtcclxuICAgICAgICAgICAgZDNzaGVldC5ncmFwaCA9IGdyYXBoTW9kdWxlKGQzc2hlZXQubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBmb3JjZU1vZHVsZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xyXG4gICAgICAgICAgICB2YXIgZm9yY2UgPSBmb3JjZU1vZHVsZShkM3NoZWV0LmdyYXBoLCBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkLCBkM3NoZWV0LnN2ZywgaW5mbywgc3ByZWFkc2hlZXQuc2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB2aWV3IG9wdGlvbnNcclxuLy8gICAgICAgICAgICB2YXIgdmlld01vZHVsZSA9IHJlcXVpcmUoXCIuL3ZpZXdcIik7XHJcbi8vICAgICAgICAgICAgdmlld01vZHVsZShkM3NoZWV0Lm1vZGVsLCBmb3JjZS51cGRhdGVHcmFwaCk7XHJcblxyXG4gICAgICAgICAgICAvLyBBcHBseSBDU1Mgc3R5bGVcclxuICAgICAgICAgICAgYXBwbHlDc3Moc3ByZWFkc2hlZXQuc2V0dGluZ3MuY3NzKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseUNzcyhjc3MpIHtcclxuICAgICAgICBpZiAoY3NzID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gR2V0IGFsbCBlbGVtZW50IHNlbGVjdG9yc1xyXG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSBPYmplY3Qua2V5cyhjc3MpO1xyXG4gICAgICAgICQuZWFjaChzZWxlY3RvcnMsIGZ1bmN0aW9uKGksIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHt9O1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3Iuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICAvLyBJdCBpcyBhbiBpZGVudGlmaWVyXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAvLyBJcyBpcyBhIGNsYXNzXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoXCIuXCIgKyBzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIHN0eWxlIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhjc3Nbc2VsZWN0b3JdKTtcclxuICAgICAgICAgICAgJC5lYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uKGosIHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5jc3MocHJvcGVydHksIGNzc1tzZWxlY3Rvcl1bcHJvcGVydHldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlbWVudHMoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBkMyA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgJCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IG5vdCBmb3VuZCFcIik7XHJcbiAgICB9XHJcbn0oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdyYXBoLCBzdmdDb250YWluZXJJZCwgc3ZnLCBpbmZvKSB7XHJcbiAgICB2YXIgbm9kZSA9IFtdLFxyXG4gICAgICAgIG5vZGVMYWJlbCA9IFtdLFxyXG4gICAgICAgIGxpbmsgPSBbXSxcclxuICAgICAgICBsaW5rTGFiZWwgPSBbXSxcclxuICAgICAgICBjb2xvcnMgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XHJcblxyXG4gICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXHJcbiAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgc2VsZWN0QWxsKCk7XHJcblxyXG4gICAgdmFyIGZvcmNlID0gZDMubGF5b3V0LmZvcmNlKClcclxuICAgICAgICAuc2l6ZShbd2lkdGgsIGhlaWdodF0pXHJcbiAgICAgICAgLmxpbmtEaXN0YW5jZSgzMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5jaGFyZ2UoLTUwMDApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuZ3Jhdml0eSgwLjUpIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgIC5vbihcInRpY2tcIiwgb25UaWNrKTtcclxuXHJcbiAgICByZXN0YXJ0KCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVzdGFydCh2aWV3T3B0aW9ucykge1xyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIik7XHJcblxyXG4vLyAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpLmRhdGEoZ3JhcGgubGlua3MpXHJcbi8vICAgICAgICAgICAgLmVudGVyKClcclxuLy8gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4vLyAgICAgICAgICAgIC50ZXh0KGxpbmtUZXh0KVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCAzMCkgLy8gVE9ETzogU2V0dGluZ3NcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAwKVxyXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgbm9kZUZpbGxDb2xvcilcclxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcclxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihuKSB7IHJldHVybiBuLmxhYmVsOyB9KVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxyXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xyXG5cclxuICAgICAgICBzZWxlY3RBbGwoKTtcclxuICAgICAgICBmb3JjZS5zdGFydCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVDbGljayhub2RlKSB7XHJcbiAgICAgICAgaW5mby5zaG93Tm9kZShub2RlLCBncmFwaC5ub2Rlcywgbm9kZUZpbGxDb2xvcihub2RlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9kZUZpbGxDb2xvcihub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIGNvbG9ycyhub2RlLnNoZWV0TmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2VsZWN0QWxsKCkge1xyXG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XHJcbiAgICAgICAgbm9kZUxhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpO1xyXG4gICAgICAgIGxpbmsgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIik7XHJcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcclxuICAgICAgICBsaW5rLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLnk7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC55OyB9KTtcclxuXHJcbiAgICAgICAgbGlua0xhYmVsXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnggKyBkLnRhcmdldC54KS8yOyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkvMjsgfSk7XHJcblxyXG4gICAgICAgIG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5vZGVMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcclxuICAgIHZhciBncmFwaCA9IHtcclxuICAgICAgICBub2RlczogW10sXHJcbiAgICAgICAgbGlua3M6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZvciBhbGwgc2hlZXRzXHJcbiAgICAkLmVhY2gobW9kZWwuc2hlZXRzLCBmdW5jdGlvbihpLCBzaGVldCkge1xyXG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcclxuICAgICAgICAkLmVhY2goc2hlZXQubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcclxuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcclxuICAgICAgICAgICAgbm9kZS5ncmFwaEluZGV4ID0gZ3JhcGgubm9kZXMucHVzaChub2RlKSAtIDE7XHJcbiAgICAgICAgICAgIG5vZGUubGFiZWxQcm9wZXJ0eSA9IHNoZWV0LmxhYmVsO1xyXG4gICAgICAgICAgICBub2RlLmxhYmVsID0gbm9kZS5wcm9wZXJ0aWVzW25vZGUubGFiZWxQcm9wZXJ0eV07XHJcbiAgICAgICAgICAgIG5vZGUuc2hlZXROYW1lID0gc2hlZXQubmFtZTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBsaW5rc1xyXG4gICAgJC5lYWNoKG1vZGVsLnNoZWV0cywgZnVuY3Rpb24oaSwgc2hlZXQpIHtcclxuICAgICAgICAvLyBGb3IgYWxsIG5vZGVzXHJcbiAgICAgICAgJC5lYWNoKHNoZWV0Lm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEZvciBhbGwgbGlua2VkIHNoZWV0c1xyXG4gICAgICAgICAgICAkLmVhY2goc2hlZXQubGlua2VkU2hlZXRzLCBmdW5jdGlvbihrLCBsaW5rZWRTaGVldCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubGlua3NbbGlua2VkU2hlZXQubmFtZV0gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCB0YXJnZXQgbm9kZXNcclxuICAgICAgICAgICAgICAgIHZhciBncmFwaFRhcmdldEluZGV4ZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChub2RlLmxpbmtzW2xpbmtlZFNoZWV0Lm5hbWVdLCBmdW5jdGlvbihsLCB0YXJnZXRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGUuZ3JhcGhJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBtb2RlbC5zaGVldHNbbGlua2VkU2hlZXQubmFtZV0ubm9kZXNbdGFyZ2V0SW5kZXhdLmdyYXBoSW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsaW5rZWRTaGVldC5sYWJlbFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhUYXJnZXRJbmRleGVzLnB1c2gobGluay50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoLmxpbmtzLnB1c2gobGluayk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZXBsYWNlIG1vZGVsIGluZGV4ZXMgd2l0aCBncmFwaCBpbmRleGVzXHJcbiAgICAgICAgICAgICAgICBub2RlLmxpbmtzW2xpbmtlZFNoZWV0Lm5hbWVdID0gZ3JhcGhUYXJnZXRJbmRleGVzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBncmFwaDtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5mb0NvbnRhaW5lcklkLCB0aXRsZSkge1xyXG4gICAgLy8gU2V0IGhlYWRpbmdcclxuICAgICQoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQgKyBcIiBoMVwiKS50ZXh0KHRpdGxlKTtcclxuXHJcbiAgICB0aGlzLnNob3dOb2RlID0gZnVuY3Rpb24obm9kZSwgbm9kZXMsIGZpbGxDb2xvcikge1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmxhYmVsKTtcclxuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1pbmZvIGhlYWRlclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGZpbGxDb2xvcik7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtc2hlZXQtbmFtZVwiKS50ZXh0KG5vZGUuc2hlZXROYW1lKTtcclxuXHJcbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcclxuICAgICAgICB1bC5lbXB0eSgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBwcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmtleXMobm9kZS5wcm9wZXJ0aWVzKTtcclxuICAgICAgICAkLmVhY2gocHJvcGVydHlOYW1lcywgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5hbWUgIT0gbm9kZS5sYWJlbFByb3BlcnR5KVxyXG4gICAgICAgICAgICAgICAgYWRkUHJvcGVydHkocHJvcGVydHlOYW1lLCBub2RlLnByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNob3cgbm9kZSBsaW5rc1xyXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhub2RlLmxpbmtzKTtcclxuICAgICAgICAkLmVhY2gobGlua05hbWVzLCBmdW5jdGlvbihpLCBsaW5rTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0TmFtZXMgPSBcIlwiO1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZS5saW5rc1tsaW5rTmFtZV0sIGZ1bmN0aW9uKGksIHRhcmdldEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0TmFtZXMgIT0gXCJcIilcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lcyA9IHRhcmdldE5hbWVzICsgXCIsIFwiO1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0TmFtZXMgPSB0YXJnZXROYW1lcyArIG5vZGVzW3RhcmdldEluZGV4XS5sYWJlbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFkZFByb3BlcnR5KGxpbmtOYW1lLCB0YXJnZXROYW1lcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZFByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHVsLmFwcGVuZChcIjxsaT48c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LW5hbWVcXFwiPlwiICsgbmFtZSArXHJcbiAgICAgICAgICAgICAgICBcIjo8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktdmFsdWVcXFwiPlwiICsgZm9ybWF0VmFsdWUodmFsdWUpICsgXCI8L3NwYW4+PC9saT5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UoMCwgXCI0XCIpLnRvTG93ZXJDYXNlKCkgPT0gXCJodHRwXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCI8YSBocmVmPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiPlwiICsgdmFsdWUgKyBcIjwvYT5cIlxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgIHZhciBtb2RlbCA9IHtcclxuICAgICAgICBzaGVldHM6IHt9LFxyXG4gICAgICAgIHNldHRpbmdzOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgc2hlZXRUeXBlcyA9IGdldFNoZWV0VHlwZXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgbW9kZWwuc2hlZXRzID0gZ2V0R3JhcGgoc3ByZWFkc2hlZXQsIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzKTtcclxuICAgIGlmIChzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lICE9IG51bGwpXHJcbiAgICAgICAgbW9kZWwuc2V0dGluZ3MgPSBzcHJlYWRzaGVldC5zaGVldHNbc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZV07XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0R3JhcGgoc3ByZWFkc2hlZXQsIG5vZGVTaGVldE5hbWVzKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIG5vZGVzIHdpdGggcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBzaGVldHMgPSB7fTtcclxuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgc2hlZXRzW25vZGVTaGVldE5hbWVdID0gZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmsgbmFtZXNcclxuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua05hbWVzKHNoZWV0cywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmtzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua3Moc2hlZXRzLCBzcHJlYWRzaGVldC5zaGVldHNbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBDcmVhdGUgbGlua3MgZnJvbSBsaW5rIHNoZWV0c1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVMaW5rcyhzaGVldHMsIG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVTaGVldE5hbWVdO1xyXG5cclxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IGNvbHVtbnNcclxuICAgICAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IE9iamVjdC5rZXlzKHJvdyk7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goY29sTmFtZXMsIGZ1bmN0aW9uKGosIGNvbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgbGluayBjb2x1bW5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgc2hlZXRzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChzaGVldHNbbGlua1RhcmdldC5zaGVldE5hbWVdLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm93W2NvbE5hbWVdLmluZGV4T2YodGFyZ2V0Tm9kZS5wcm9wZXJ0aWVzW2xpbmtUYXJnZXQucHJvcGVydHlOYW1lXSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2Uubm9kZXNbaV0ubGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ub2Rlc1tpXS5saW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZSB0byB0aGUgc291cmNlIG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2Uubm9kZXNbaV0ubGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtOYW1lcyhzaGVldHMsIG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVTaGVldE5hbWVdO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGxpbmsgbmFtZXNcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBwYXJzZUNvbHVtbkxpbmtOYW1lKHByb3BlcnR5TmFtZSwgc2hlZXRzKTtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlLmxpbmtlZFNoZWV0cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbGlua1RhcmdldC5zaGVldE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsaW5rVGFyZ2V0LmxhYmVsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZXMobm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBub2RlU2hlZXROYW1lLFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6IG5vZGVTaGVldC5oZWFkZXJbMF0sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGxpbmtlZFNoZWV0czogW10sXHJcbiAgICAgICAgICAgICAgICBub2RlczogW11cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IGdldE5vZGVQcm9wZXJ0aWVzKHJvdyksXHJcbiAgICAgICAgICAgICAgICAgICAgbGlua3M6IHt9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgcHJvcGVydHkgbmFtZXNcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIGNvbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gY29sTmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldC5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHJvcGVydHlOYW1lcy5wdXNoKGNvbE5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3cpIHtcclxuICAgICAgICAgICAgdmFyIG5vZGVQcm9wZXJ0aWVzID0ge307XHJcbiAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IE9iamVjdC5rZXlzKHJvdyk7XHJcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaSwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbE5hbWUuaW5kZXhPZihcIi5cIikgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZVByb3BlcnRpZXNbY29sTmFtZV0gPSByb3dbY29sTmFtZV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZVByb3BlcnRpZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2hlZXRzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFNoZWV0VHlwZXMoc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICB2YXIgc2hlZXRUeXBlcyA9IHtcclxuICAgICAgICAgICAgbm9kZXNTaGVldE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgbGlua1NoZWV0TmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBzZXR0aW5nc1NoZWV0TmFtZTogbnVsbFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHNoZWV0TmFtZXMgPSBPYmplY3Qua2V5cyhzcHJlYWRzaGVldC5zaGVldHMpO1xyXG4gICAgICAgICQuZWFjaChzaGVldE5hbWVzLCBmdW5jdGlvbihpLCBzaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWUgPSBzaGVldE5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgbGlua1NoZWV0ID0gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSlcclxuICAgICAgICAgICAgaWYgKChsaW5rU2hlZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnNvdXJjZSkgPiAtMSkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnRhcmdldCkgPiAtMSkpIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMubGlua1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHNoZWV0VHlwZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBzaGVldHMpIHtcclxuICAgICAgICB2YXIgbGlua05hbWVzID0gY29sTmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgaWYgKChsaW5rTmFtZXMubGVuZ3RoID49IDIpICYmXHJcbiAgICAgICAgICAgIChzaGVldHNbbGlua05hbWVzWzBdXSAhPSBudWxsKSAmJlxyXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0ucHJvcGVydHlOYW1lcy5pbmRleE9mKGxpbmtOYW1lc1sxXSkgPiAtMSkpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgIHNoZWV0TmFtZTogbGlua05hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiBsaW5rTmFtZXNbMV1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGxpbmtOYW1lcy5sZW5ndGggPT0gMylcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5sYWJlbCA9IGxpbmtOYW1lc1syXTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUxpbmtTaGVldE5hbWUoc2hlZXROYW1lKSB7XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lcyA9IHNoZWV0TmFtZS5zcGxpdChcIi1cIik7XHJcbiAgICAgICAgaWYgKG5vZGVOYW1lcy5sZW5ndGggPT0gMikge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc291cmNlOiBub2RlTmFtZXNbMF0sXHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IG5vZGVOYW1lc1sxXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1vZGVsO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcclxuICAgIC8vIEdldCBzaGVldCBjb3VudFxyXG4gICAgZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3MoaW5mbykge1xyXG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xyXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbykge1xyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IG5ldyBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgaW5mby50aXRsZSk7XHJcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gaW5mby5zaGVldENvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2FkZWRTaGVldENvdW50ID09IGluZm8uc2hlZXRDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAgICAgICAgICAgICBvbkxvYWRlZChzcHJlYWRzaGVldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5mZWVkLnRpdGxlLiR0ID09IFwic2V0dGluZ3NcIikge1xyXG4gICAgICAgICAgICAgICAgbG9hZFNldHRpbmdzU2hlZXQocmVzcG9uc2UsIHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXQuc2hlZXRzW3Jlc3BvbnNlLmZlZWQudGl0bGUuJHRdID0gbmV3IFNoZWV0KCk7XHJcblxyXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5yb3cgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV0gPSBlLmNvbnRlbnQuJHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XVtzaGVldC5oZWFkZXJbZS5ncyRjZWxsLmNvbCAtIDFdXSA9IGUuY29udGVudC4kdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNldHRpbmdzU2hlZXQoc2V0dGluZ3NTaGVldCwgc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICAvLyBNYXAgY2VsbHMgdG8gbGlzdFxyXG4gICAgICAgIHZhciBzZXR0aW5nc0xpc3QgPSB7fTtcclxuICAgICAgICAkLmVhY2goc2V0dGluZ3NTaGVldC5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XHJcbiAgICAgICAgICAgIGlmIChzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XSA9IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5jb2wgPT0gMSlcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XS5rZXkgPSBlLmNvbnRlbnQuJHQ7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGlmIChlLmdzJGNlbGwuY29sID09IDIpXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddLnZhbHVlID0gZS5jb250ZW50LiR0O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBNYXAgbGlzdCB0byBvYmplY3RcclxuICAgICAgICAkLmVhY2goc2V0dGluZ3NMaXN0LCBmdW5jdGlvbihpLCBzKSB7XHJcbiAgICAgICAgICAgIGlmICgocy5rZXkgPT0gbnVsbCkgfHwgKHMudmFsdWUgPT0gbnVsbCkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaW5uZXIgb2JqZWN0c1xyXG4gICAgICAgICAgICB2YXIgcGF0aCA9IHMua2V5LnNwbGl0KFwiLlwiKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBzcHJlYWRzaGVldC5zZXR0aW5ncztcclxuICAgICAgICAgICAgJC5lYWNoKHBhdGgsIGZ1bmN0aW9uKGosIGspIHtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50W2tdID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaiA9PSBwYXRoLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSBzLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRba107XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICByZXR1cm4gJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvY2VsbHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL1wiICsgc2hlZXRJbmRleCArIFwiL3B1YmxpYy92YWx1ZXM/YWx0PWpzb24taW4tc2NyaXB0XCIsXHJcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IG9uU3VjY2Vzc1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvcHVibGljL2Z1bGw/YWx0PWpzb24taW4tc2NyaXB0XCIsXHJcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzaGVldENvdW50OiByZXNwb25zZS5mZWVkLmVudHJ5Lmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogcmVzcG9uc2UuZmVlZC50aXRsZS4kdFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhpbmZvKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCB0aXRsZSkge1xyXG4gICAgICAgIHRoaXMua2V5ID0gc3ByZWFkc2hlZXRLZXk7XHJcbiAgICAgICAgdGhpcy50aXRsZSA9IHRpdGxlO1xyXG4gICAgICAgIHRoaXMuc2hlZXRzID0gbmV3IFNoZWV0cygpO1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3NTaGVldCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBTaGVldHMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gU2hlZXQoKSB7XHJcbiAgICAgICAgdGhpcy5oZWFkZXIgPSBbXTtcclxuICAgICAgICB0aGlzLnJvd3MgPSBbXTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBTZXR0aW5nc1NoZWV0KCkge1xyXG4gICAgICAgIHRoaXMuY3NzID0ge307XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn0iXX0=
