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
            console.log(spreadsheet);

            d3sheet.spreadsheet = spreadsheet;

            // Initialize document
            document.title = spreadsheet.title;

            // Initialize info section
            var infoModule = require("./info");
            var info = infoModule(d3sheet.infoContainerId, spreadsheet.title);

            // Create model from spreadsheet
            var modelModule = require("./model");
            d3sheet.model = modelModule(d3sheet.spreadsheet);

            console.log(d3sheet.model);

            // Create graph from model
            var graphModule = require("./graph");
            d3sheet.graph = graphModule(d3sheet.model);

            console.log(d3sheet.graph);

            // Create D3 force layout from graph
            var forceModule = require("./force");
            var force = forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info, spreadsheet.settings);

            // Initialize view options
//            var viewModule = require("./view");
//            viewModule(d3sheet.model, force.updateGraph);

            // Apply CSS style
            applyCss(d3sheet.model.settings.css);
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
    var graph = new Graph();

    // For all sheets
    $.each(model.nodeGroups, function(i, sheet) {
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
    $.each(model.nodeGroups, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // For all linked nodeGroups
            $.each(sheet.linkedNodeGroups, function(k, linkedSheet) {
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
    var model = new Model();

    var nodeGroupTypes = getNodeGroupTypes(spreadsheet);
    model.nodeGroups = getNodeGroups(spreadsheet, nodeGroupTypes.nodeGroupNames);
    if (nodeGroupTypes.settingsGroupName != null)
        model.settings = spreadsheet.sheets[nodeGroupTypes.settingsGroupName];

    function getNodeGroups(spreadsheet, nodeGroupNames) {
        // Create nodes with properties
        var nodeGroups = new NodeGroups();
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            nodeGroups[nodeGroupName] = getNodes(spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // Create link names
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            createLinkNames(nodeGroups, spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // Create links from node sheets
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            createLinks(nodeGroups, spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // TODO: Create links from link sheets

        function createLinks(nodeGroups, nodeSheet, nodeGroupName) {
            var nodeGroup = nodeGroups[nodeGroupName];
            var colNames = nodeSheet.header();

            // For all sheet rows
            $.each(nodeSheet.rows, function(i, row) {
                if (i == 0)
                    return;

                // For all sheet columns
                $.each(colNames, function(j, colName) {
                    var value = nodeSheet.value(row, colName);
                    if (value == null)
                        return;

                    // If this is a link column
                    var linkTarget = parseColumnLinkName(colName, nodeGroups);
                    if (linkTarget != null) {
                        // Find index of the target node
                        $.each(nodeGroups[linkTarget.sheetName].nodes, function(k, targetNode) {
                            // If target node property value matches
                            // TODO: We should properly split values using comma
                            if (value.indexOf(targetNode.value(linkTarget.propertyName)) > -1) {
                                var links = nodeGroup.nodes[i - 1].links;
                                if (links[linkTarget.sheetName] == null)
                                    links[linkTarget.sheetName] = [];

                                // Add index of the target node to the nodeGroup node
                                links[linkTarget.sheetName].push(k);
                            }
                        });
                    }
                });
            });
        }

        function createLinkNames(sheets, nodeSheet, nodeGroupName) {
            var source = sheets[nodeGroupName];

            // Get link names
            $.each(nodeSheet.header(), function(i, propertyName) {
                var linkTarget = parseColumnLinkName(propertyName, sheets);
                if (linkTarget != null)
                    source.linkedNodeGroups.push(new LinkedNodeGroup(linkTarget.sheetName, linkTarget.label));
            });
        }

        function getNodes(nodeSheet, nodeGroupName) {
            var header = nodeSheet.header();
            var result = new NodeGroup(nodeGroupName, header[0]);

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                if (i == 0)
                    return;
                result.nodes.push(new Node(getNodeProperties(row, header)));
            });

            // Get property names
            $.each(header, function(i, colName) {
                var linkTarget = colName.split(".");
                if (linkTarget.length == 1)
                    result.propertyNames.push(colName);
            });

            return result;
        }

        function getNodeProperties(row, header) {
            var nodeProperties = [];
            $.each(row.rowCells, function(i, rowCell) {
                var colName = header[rowCell.colIndex];
                if (colName.indexOf(".") == -1)
                    nodeProperties.push(new NodeProperty(colName, rowCell.value));
            });
            return nodeProperties;
        }

        return nodeGroups;
    }

    function getNodeGroupTypes(spreadsheet) {
        var nodeGroupTypes = {
            nodeGroupNames: [],
            linkSheetNames: [],
            settingsGroupName: null
        };
        var sheetNames = Object.keys(spreadsheet.sheets);
        $.each(sheetNames, function(i, sheetName) {
            if (sheetName == "settings") {
                nodeGroupTypes.settingsGroupName = sheetName;
                return;
            }

            if (sheetName.slice(0, 1) == "#")
                return;

            var linkSheet = parseLinkSheetName(sheetName)
            if ((linkSheet != null) &&
                (sheetNames.indexOf(linkSheet.source) > -1) &&
                (sheetNames.indexOf(linkSheet.target) > -1)) {
                nodeGroupTypes.linkSheetNames.push(sheetName)
                return;
            }

            nodeGroupTypes.nodeGroupNames.push(sheetName);
        });

        return nodeGroupTypes;
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

function Model() {
    this.nodeGroups = {};
    this.settings = {};
    return this;
}

function NodeGroups() {
    return this;
}

function NodeGroup(name, label) {
    this.name = name;
    this.label = label;
    this.propertyNames = [];
    this.linkedNodeGroups = [];
    this.nodes = [];
    return this;
}

function LinkedNodeGroup(name, label) {
    this.name = name;
    this.label = label;
    return this;
}

function Node(properties) {
    this.properties = properties;
    this.links = {};
    return this;
}

Node.prototype.value = function(propertyName) {
    var result = null;
    $.each(this.properties, function(i, property) {
        if (property.name == propertyName) {
            result = property.value;
            return false;
        }
    });
    return result;
}

function NodeProperty(name, value) {
    this.name = name;
    this.value = value;
    return this;
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
                    onLoaded(spreadsheet);
                }
            })
        }
    }

    function loadSheet(spreadsheet, spreadsheetKey, sheetIndex) {
        return getSheet(spreadsheetKey, sheetIndex, function(response) {
            var sheet = spreadsheet.sheets[response.feed.title.$t] = new Sheet();

            $.each(response.feed.entry, function(i, e) {
                var index = e.gs$cell.row - 1;
                if (sheet.rows[index] == null) {
                    sheet.rows[index] = new Row(index);
                }
                sheet.rows[index].rowCells.push(new RowCell(e.gs$cell.col - 1, e.content.$t));
            });

            // Sort row cells by col index
            $.each(sheet.rows, function(i, row) {
                row.rowCells.sort(function(c1, c2) { return c1.colIndex - c2.colIndex; });
            });
        });
    }

//    function loadSettingsSheet(settingsSheet, spreadsheet) {
//        // Map cells to list
//        var settingsList = {};
//        $.each(settingsSheet.feed.entry, function(i, e) {
//            if (settingsList[e.gs$cell.row] == null)
//                settingsList[e.gs$cell.row] = {};
//
//            if (e.gs$cell.col == 1)
//                settingsList[e.gs$cell.row].key = e.content.$t;
//            else
//                if (e.gs$cell.col == 2)
//                    settingsList[e.gs$cell.row].value = e.content.$t;
//        });
//
//        // Map list to object
//        $.each(settingsList, function(i, s) {
//            if ((s.key == null) || (s.value == null))
//                return;
//
//            // Create inner objects
//            var path = s.key.split(".");
//            var current = spreadsheet.settings;
//            $.each(path, function(j, k) {
//                if (current[k] == null) {
//                    if (j == path.length - 1)
//                        current[k] = s.value;
//                    else
//                        current[k] = {};
//                }
//                current = current[k];
//            });
//        });
//    }

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
}

function Spreadsheet(spreadsheetKey, title) {
    this.key = spreadsheetKey;
    this.title = title;
    this.sheets = new Sheets();

    return this;
}

function Sheets() {
    return this;
}

function Sheet() {
    this.rows = [];
    return this;
}

Sheet.prototype.header = function() {
    return this.rows[0].values();
}

Sheet.prototype.value = function(row, colName) {
    var colIndex = this.header().indexOf(colName);
    if (colIndex == -1)
        return null;

    var result = null;
    $.each(row.rowCells, function(i, rowCell) {
        if (rowCell.colIndex == colIndex) {
            result = rowCell.value;
            return false;
        }
    });

    return result;
}

function Row(rowIndex) {
    this.rowIndex = rowIndex;
    this.rowCells = [];

    return this;
}

Row.prototype.values = function() {
    return $.map(this.rowCells, function(rowCell, i) {
        return rowCell.value;
    });
}

function RowCell(colIndex, value) {
    this.colIndex = colIndex;
    this.value = value;
    return this;
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xyXG4gICAgY2hlY2tSZXF1aXJlbWVudHMoKTtcclxuXHJcbiAgICB2YXIgZDNzaGVldCA9IHtcclxuICAgICAgICB2ZXI6IFwiMS4wLjBcIixcclxuICAgICAgICBzdmdDb250YWluZXJJZDogXCJcIixcclxuICAgICAgICBpbmZvQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgc3ZnOiB7fSxcclxuICAgICAgICBzcHJlYWRzaGVldDoge30sXHJcbiAgICAgICAgbW9kZWw6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcclxuXHJcbiAgICAvKipcclxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cclxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gaWRlbnRpZmllciBvZiB0aGUgbWFpbiBESVYuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcclxuICAgICAgICBpZiAoc3ZnQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XHJcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XHJcbiAgICAgICAgZDNzaGVldC5pbmZvQ29udGFpbmVySWQgPSBpbmZvQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBTVkcgZWxlbWVudFxyXG4gICAgICAgIGQzc2hlZXQuc3ZnID0gZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKCd2aWV3Qm94JywgXCIwIDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGluZm8gcGFuZWxcclxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XHJcblxyXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgKiBMb2FkIGRhdGEgZnJvbSBzcHJlYWRzaGVldC5cclxuICAgICoqL1xyXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcclxuICAgICAgICAvLyBMb2FkIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gcmVxdWlyZShcIi4vc3ByZWFkc2hlZXRcIik7XHJcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNwcmVhZHNoZWV0KTtcclxuXHJcbiAgICAgICAgICAgIGQzc2hlZXQuc3ByZWFkc2hlZXQgPSBzcHJlYWRzaGVldDtcclxuXHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgZG9jdW1lbnRcclxuICAgICAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBzcHJlYWRzaGVldC50aXRsZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgaW5mbyBzZWN0aW9uXHJcbiAgICAgICAgICAgIHZhciBpbmZvTW9kdWxlID0gcmVxdWlyZShcIi4vaW5mb1wiKTtcclxuICAgICAgICAgICAgdmFyIGluZm8gPSBpbmZvTW9kdWxlKGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkLCBzcHJlYWRzaGVldC50aXRsZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBzcHJlYWRzaGVldFxyXG4gICAgICAgICAgICB2YXIgbW9kZWxNb2R1bGUgPSByZXF1aXJlKFwiLi9tb2RlbFwiKTtcclxuICAgICAgICAgICAgZDNzaGVldC5tb2RlbCA9IG1vZGVsTW9kdWxlKGQzc2hlZXQuc3ByZWFkc2hlZXQpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coZDNzaGVldC5tb2RlbCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxyXG4gICAgICAgICAgICB2YXIgZ3JhcGhNb2R1bGUgPSByZXF1aXJlKFwiLi9ncmFwaFwiKTtcclxuICAgICAgICAgICAgZDNzaGVldC5ncmFwaCA9IGdyYXBoTW9kdWxlKGQzc2hlZXQubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coZDNzaGVldC5ncmFwaCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcclxuICAgICAgICAgICAgdmFyIGZvcmNlTW9kdWxlID0gcmVxdWlyZShcIi4vZm9yY2VcIik7XHJcbiAgICAgICAgICAgIHZhciBmb3JjZSA9IGZvcmNlTW9kdWxlKGQzc2hlZXQuZ3JhcGgsIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQsIGQzc2hlZXQuc3ZnLCBpbmZvLCBzcHJlYWRzaGVldC5zZXR0aW5ncyk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZpZXcgb3B0aW9uc1xyXG4vLyAgICAgICAgICAgIHZhciB2aWV3TW9kdWxlID0gcmVxdWlyZShcIi4vdmlld1wiKTtcclxuLy8gICAgICAgICAgICB2aWV3TW9kdWxlKGQzc2hlZXQubW9kZWwsIGZvcmNlLnVwZGF0ZUdyYXBoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFwcGx5IENTUyBzdHlsZVxyXG4gICAgICAgICAgICBhcHBseUNzcyhkM3NoZWV0Lm1vZGVsLnNldHRpbmdzLmNzcyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlDc3MoY3NzKSB7XHJcbiAgICAgICAgaWYgKGNzcyA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBhbGwgZWxlbWVudCBzZWxlY3RvcnNcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gT2JqZWN0LmtleXMoY3NzKTtcclxuICAgICAgICAkLmVhY2goc2VsZWN0b3JzLCBmdW5jdGlvbihpLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSB7fTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgLy8gSXQgaXMgYW4gaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgaXMgYSBjbGFzc1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKFwiLlwiICsgc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzdHlsZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoY3NzW3NlbGVjdG9yXSk7XHJcbiAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihqLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMuY3NzKHByb3BlcnR5LCBjc3Nbc2VsZWN0b3JdW3Byb3BlcnR5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcclxuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgfVxyXG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbykge1xyXG4gICAgdmFyIG5vZGUgPSBbXSxcclxuICAgICAgICBub2RlTGFiZWwgPSBbXSxcclxuICAgICAgICBsaW5rID0gW10sXHJcbiAgICAgICAgbGlua0xhYmVsID0gW10sXHJcbiAgICAgICAgY29sb3JzID0gZDMuc2NhbGUuY2F0ZWdvcnkyMCgpO1xyXG5cclxuICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpO1xyXG5cclxuICAgIHZhciBmb3JjZSA9IGQzLmxheW91dC5mb3JjZSgpXHJcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxyXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMzApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuY2hhcmdlKC01MDAwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmdyYXZpdHkoMC41KSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgIC5saW5rcyhncmFwaC5saW5rcylcclxuICAgICAgICAub24oXCJ0aWNrXCIsIG9uVGljayk7XHJcblxyXG4gICAgcmVzdGFydCgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RhcnQodmlld09wdGlvbnMpIHtcclxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIilcclxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgICAgIC5lbnRlcigpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpO1xyXG5cclxuLy8gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKS5kYXRhKGdyYXBoLmxpbmtzKVxyXG4vLyAgICAgICAgICAgIC5lbnRlcigpXHJcbi8vICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuLy8gICAgICAgICAgICAudGV4dChsaW5rVGV4dClcclxuLy8gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluay1sYWJlbFwiKVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIik7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMzApIC8vIFRPRE86IFNldHRpbmdzXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgMClcclxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIG5vZGVGaWxsQ29sb3IpXHJcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXHJcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGUtbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24obikgeyByZXR1cm4gbi5sYWJlbDsgfSlcclxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcclxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcclxuXHJcbiAgICAgICAgc2VsZWN0QWxsKCk7XHJcbiAgICAgICAgZm9yY2Uuc3RhcnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub2RlQ2xpY2sobm9kZSkge1xyXG4gICAgICAgIGluZm8uc2hvd05vZGUobm9kZSwgZ3JhcGgubm9kZXMsIG5vZGVGaWxsQ29sb3Iobm9kZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVGaWxsQ29sb3Iobm9kZSkge1xyXG4gICAgICAgIHJldHVybiBjb2xvcnMobm9kZS5zaGVldE5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNlbGVjdEFsbCgpIHtcclxuICAgICAgICBub2RlID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpO1xyXG4gICAgICAgIG5vZGVMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKTtcclxuICAgICAgICBsaW5rID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpO1xyXG4gICAgICAgIGxpbmtMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblRpY2soKSB7XHJcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS55OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XHJcblxyXG4gICAgICAgIGxpbmtMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS54ICsgZC50YXJnZXQueCkvMjsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xyXG5cclxuICAgICAgICBub2RlLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBub2RlTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XHJcbiAgICB2YXIgZ3JhcGggPSBuZXcgR3JhcGgoKTtcclxuXHJcbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xyXG4gICAgJC5lYWNoKG1vZGVsLm5vZGVHcm91cHMsIGZ1bmN0aW9uKGksIHNoZWV0KSB7XHJcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xyXG4gICAgICAgICQuZWFjaChzaGVldC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xyXG4gICAgICAgICAgICAvLyBBZGQgbm9kZSB0byBncmFwaFxyXG4gICAgICAgICAgICBub2RlLmdyYXBoSW5kZXggPSBncmFwaC5ub2Rlcy5wdXNoKG5vZGUpIC0gMTtcclxuICAgICAgICAgICAgbm9kZS5sYWJlbFByb3BlcnR5ID0gc2hlZXQubGFiZWw7XHJcbiAgICAgICAgICAgIG5vZGUubGFiZWwgPSBub2RlLnByb3BlcnRpZXNbbm9kZS5sYWJlbFByb3BlcnR5XTtcclxuICAgICAgICAgICAgbm9kZS5zaGVldE5hbWUgPSBzaGVldC5uYW1lO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGxpbmtzXHJcbiAgICAkLmVhY2gobW9kZWwubm9kZUdyb3VwcywgZnVuY3Rpb24oaSwgc2hlZXQpIHtcclxuICAgICAgICAvLyBGb3IgYWxsIG5vZGVzXHJcbiAgICAgICAgJC5lYWNoKHNoZWV0Lm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEZvciBhbGwgbGlua2VkIG5vZGVHcm91cHNcclxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LmxpbmtlZE5vZGVHcm91cHMsIGZ1bmN0aW9uKGssIGxpbmtlZFNoZWV0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5saW5rc1tsaW5rZWRTaGVldC5uYW1lXSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHRhcmdldCBub2Rlc1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyYXBoVGFyZ2V0SW5kZXhlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKG5vZGUubGlua3NbbGlua2VkU2hlZXQubmFtZV0sIGZ1bmN0aW9uKGwsIHRhcmdldEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmsgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZS5ncmFwaEluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IG1vZGVsLm5vZGVHcm91cHNbbGlua2VkU2hlZXQubmFtZV0ubm9kZXNbdGFyZ2V0SW5kZXhdLmdyYXBoSW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsaW5rZWRTaGVldC5sYWJlbFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhUYXJnZXRJbmRleGVzLnB1c2gobGluay50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoLmxpbmtzLnB1c2gobGluayk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZXBsYWNlIG1vZGVsIGluZGV4ZXMgd2l0aCBncmFwaCBpbmRleGVzXHJcbiAgICAgICAgICAgICAgICBub2RlLmxpbmtzW2xpbmtlZFNoZWV0Lm5hbWVdID0gZ3JhcGhUYXJnZXRJbmRleGVzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBncmFwaDtcclxufVxyXG5cclxuZnVuY3Rpb24gR3JhcGgoKSB7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICB0aGlzLmxpbmtzID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5mb0NvbnRhaW5lcklkLCB0aXRsZSkge1xyXG4gICAgLy8gU2V0IGhlYWRpbmdcclxuICAgICQoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQgKyBcIiBoMVwiKS50ZXh0KHRpdGxlKTtcclxuXHJcbiAgICB0aGlzLnNob3dOb2RlID0gZnVuY3Rpb24obm9kZSwgbm9kZXMsIGZpbGxDb2xvcikge1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmxhYmVsKTtcclxuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1pbmZvIGhlYWRlclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGZpbGxDb2xvcik7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtc2hlZXQtbmFtZVwiKS50ZXh0KG5vZGUuc2hlZXROYW1lKTtcclxuXHJcbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcclxuICAgICAgICB1bC5lbXB0eSgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBwcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmtleXMobm9kZS5wcm9wZXJ0aWVzKTtcclxuICAgICAgICAkLmVhY2gocHJvcGVydHlOYW1lcywgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5hbWUgIT0gbm9kZS5sYWJlbFByb3BlcnR5KVxyXG4gICAgICAgICAgICAgICAgYWRkUHJvcGVydHkocHJvcGVydHlOYW1lLCBub2RlLnByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNob3cgbm9kZSBsaW5rc1xyXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhub2RlLmxpbmtzKTtcclxuICAgICAgICAkLmVhY2gobGlua05hbWVzLCBmdW5jdGlvbihpLCBsaW5rTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0TmFtZXMgPSBcIlwiO1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZS5saW5rc1tsaW5rTmFtZV0sIGZ1bmN0aW9uKGksIHRhcmdldEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0TmFtZXMgIT0gXCJcIilcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lcyA9IHRhcmdldE5hbWVzICsgXCIsIFwiO1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0TmFtZXMgPSB0YXJnZXROYW1lcyArIG5vZGVzW3RhcmdldEluZGV4XS5sYWJlbDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFkZFByb3BlcnR5KGxpbmtOYW1lLCB0YXJnZXROYW1lcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZFByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHVsLmFwcGVuZChcIjxsaT48c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LW5hbWVcXFwiPlwiICsgbmFtZSArXHJcbiAgICAgICAgICAgICAgICBcIjo8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktdmFsdWVcXFwiPlwiICsgZm9ybWF0VmFsdWUodmFsdWUpICsgXCI8L3NwYW4+PC9saT5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UoMCwgXCI0XCIpLnRvTG93ZXJDYXNlKCkgPT0gXCJodHRwXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCI8YSBocmVmPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiPlwiICsgdmFsdWUgKyBcIjwvYT5cIlxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbCgpO1xyXG5cclxuICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KTtcclxuICAgIG1vZGVsLm5vZGVHcm91cHMgPSBnZXROb2RlR3JvdXBzKHNwcmVhZHNoZWV0LCBub2RlR3JvdXBUeXBlcy5ub2RlR3JvdXBOYW1lcyk7XHJcbiAgICBpZiAobm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgIT0gbnVsbClcclxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZV07XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMpIHtcclxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIG5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICBub2RlR3JvdXBzW25vZGVHcm91cE5hbWVdID0gZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmsgbmFtZXNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3VwTmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua05hbWVzKG5vZGVHcm91cHMsIHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBOYW1lXSwgbm9kZUdyb3VwTmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBsaW5rcyBmcm9tIG5vZGUgc2hlZXRzXHJcbiAgICAgICAgJC5lYWNoKG5vZGVHcm91cE5hbWVzLCBmdW5jdGlvbihpLCBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZUxpbmtzKG5vZGVHcm91cHMsIHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBOYW1lXSwgbm9kZUdyb3VwTmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IENyZWF0ZSBsaW5rcyBmcm9tIGxpbmsgc2hlZXRzXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtzKG5vZGVHcm91cHMsIG5vZGVTaGVldCwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgbm9kZUdyb3VwID0gbm9kZUdyb3Vwc1tub2RlR3JvdXBOYW1lXTtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gbm9kZVNoZWV0LmhlYWRlcigpO1xyXG5cclxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IGNvbHVtbnNcclxuICAgICAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG5vZGVTaGVldC52YWx1ZShyb3csIGNvbE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBsaW5rIGNvbHVtblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBub2RlR3JvdXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChub2RlR3JvdXBzW2xpbmtUYXJnZXQuc2hlZXROYW1lXS5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgbWF0Y2hlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3Blcmx5IHNwbGl0IHZhbHVlcyB1c2luZyBjb21tYVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YodGFyZ2V0Tm9kZS52YWx1ZShsaW5rVGFyZ2V0LnByb3BlcnR5TmFtZSkpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGlua3MgPSBub2RlR3JvdXAubm9kZXNbaSAtIDFdLmxpbmtzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBpbmRleCBvZiB0aGUgdGFyZ2V0IG5vZGUgdG8gdGhlIG5vZGVHcm91cCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtOYW1lcyhzaGVldHMsIG5vZGVTaGVldCwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVHcm91cE5hbWVdO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGxpbmsgbmFtZXNcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIoKSwgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUocHJvcGVydHlOYW1lLCBzaGVldHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2UubGlua2VkTm9kZUdyb3Vwcy5wdXNoKG5ldyBMaW5rZWROb2RlR3JvdXAobGlua1RhcmdldC5zaGVldE5hbWUsIGxpbmtUYXJnZXQubGFiZWwpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2Rlcyhub2RlU2hlZXQsIG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhlYWRlciA9IG5vZGVTaGVldC5oZWFkZXIoKTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlR3JvdXAobm9kZUdyb3VwTmFtZSwgaGVhZGVyWzBdKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaChuZXcgTm9kZShnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlcikpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgcHJvcGVydHkgbmFtZXNcclxuICAgICAgICAgICAgJC5lYWNoKGhlYWRlciwgZnVuY3Rpb24oaSwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0Lmxlbmd0aCA9PSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wcm9wZXJ0eU5hbWVzLnB1c2goY29sTmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVQcm9wZXJ0aWVzKHJvdywgaGVhZGVyKSB7XHJcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IFtdO1xyXG4gICAgICAgICAgICAkLmVhY2gocm93LnJvd0NlbGxzLCBmdW5jdGlvbihpLCByb3dDZWxsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29sTmFtZSA9IGhlYWRlcltyb3dDZWxsLmNvbEluZGV4XTtcclxuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQcm9wZXJ0aWVzLnB1c2gobmV3IE5vZGVQcm9wZXJ0eShjb2xOYW1lLCByb3dDZWxsLnZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZVByb3BlcnRpZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbm9kZUdyb3VwcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCkge1xyXG4gICAgICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IHtcclxuICAgICAgICAgICAgbm9kZUdyb3VwTmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBsaW5rU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIHNldHRpbmdzR3JvdXBOYW1lOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0LnNoZWV0cyk7XHJcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lID09IFwic2V0dGluZ3NcIikge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgPSBzaGVldE5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgbGlua1NoZWV0ID0gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSlcclxuICAgICAgICAgICAgaWYgKChsaW5rU2hlZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnNvdXJjZSkgPiAtMSkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnRhcmdldCkgPiAtMSkpIHtcclxuICAgICAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLmxpbmtTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5ub2RlR3JvdXBOYW1lcy5wdXNoKHNoZWV0TmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBUeXBlcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUNvbHVtbkxpbmtOYW1lKGNvbE5hbWUsIHNoZWV0cykge1xyXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICBpZiAoKGxpbmtOYW1lcy5sZW5ndGggPj0gMikgJiZcclxuICAgICAgICAgICAgKHNoZWV0c1tsaW5rTmFtZXNbMF1dICE9IG51bGwpICYmXHJcbiAgICAgICAgICAgIChzaGVldHNbbGlua05hbWVzWzBdXS5wcm9wZXJ0eU5hbWVzLmluZGV4T2YobGlua05hbWVzWzFdKSA+IC0xKSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgc2hlZXROYW1lOiBsaW5rTmFtZXNbMF0sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IGxpbmtOYW1lc1sxXVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobGlua05hbWVzLmxlbmd0aCA9PSAzKVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmxhYmVsID0gbGlua05hbWVzWzJdO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlTGlua1NoZWV0TmFtZShzaGVldE5hbWUpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcclxuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcclxuICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kZWw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE1vZGVsKCkge1xyXG4gICAgdGhpcy5ub2RlR3JvdXBzID0ge307XHJcbiAgICB0aGlzLnNldHRpbmdzID0ge307XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZUdyb3VwcygpIHtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlR3JvdXAobmFtZSwgbGFiZWwpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICB0aGlzLnByb3BlcnR5TmFtZXMgPSBbXTtcclxuICAgIHRoaXMubGlua2VkTm9kZUdyb3VwcyA9IFtdO1xyXG4gICAgdGhpcy5ub2RlcyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIExpbmtlZE5vZGVHcm91cChuYW1lLCBsYWJlbCkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlKHByb3BlcnRpZXMpIHtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XHJcbiAgICB0aGlzLmxpbmtzID0ge307XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuTm9kZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eU5hbWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBudWxsO1xyXG4gICAgJC5lYWNoKHRoaXMucHJvcGVydGllcywgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcclxuICAgICAgICBpZiAocHJvcGVydHkubmFtZSA9PSBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gcHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcclxuICAgIC8vIEdldCBzaGVldCBjb3VudFxyXG4gICAgZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3MoaW5mbykge1xyXG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xyXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbykge1xyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IG5ldyBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgaW5mby50aXRsZSk7XHJcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gaW5mby5zaGVldENvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2FkZWRTaGVldENvdW50ID09IGluZm8uc2hlZXRDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xyXG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXQuc2hlZXRzW3Jlc3BvbnNlLmZlZWQudGl0bGUuJHRdID0gbmV3IFNoZWV0KCk7XHJcblxyXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZS5ncyRjZWxsLnJvdyAtIDE7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0gbmV3IFJvdyhpbmRleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XS5yb3dDZWxscy5wdXNoKG5ldyBSb3dDZWxsKGUuZ3MkY2VsbC5jb2wgLSAxLCBlLmNvbnRlbnQuJHQpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTb3J0IHJvdyBjZWxscyBieSBjb2wgaW5kZXhcclxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgcm93LnJvd0NlbGxzLnNvcnQoZnVuY3Rpb24oYzEsIGMyKSB7IHJldHVybiBjMS5jb2xJbmRleCAtIGMyLmNvbEluZGV4OyB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4vLyAgICBmdW5jdGlvbiBsb2FkU2V0dGluZ3NTaGVldChzZXR0aW5nc1NoZWV0LCBzcHJlYWRzaGVldCkge1xyXG4vLyAgICAgICAgLy8gTWFwIGNlbGxzIHRvIGxpc3RcclxuLy8gICAgICAgIHZhciBzZXR0aW5nc0xpc3QgPSB7fTtcclxuLy8gICAgICAgICQuZWFjaChzZXR0aW5nc1NoZWV0LmZlZWQuZW50cnksIGZ1bmN0aW9uKGksIGUpIHtcclxuLy8gICAgICAgICAgICBpZiAoc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddID09IG51bGwpXHJcbi8vICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XSA9IHt9O1xyXG4vL1xyXG4vLyAgICAgICAgICAgIGlmIChlLmdzJGNlbGwuY29sID09IDEpXHJcbi8vICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XS5rZXkgPSBlLmNvbnRlbnQuJHQ7XHJcbi8vICAgICAgICAgICAgZWxzZVxyXG4vLyAgICAgICAgICAgICAgICBpZiAoZS5ncyRjZWxsLmNvbCA9PSAyKVxyXG4vLyAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddLnZhbHVlID0gZS5jb250ZW50LiR0O1xyXG4vLyAgICAgICAgfSk7XHJcbi8vXHJcbi8vICAgICAgICAvLyBNYXAgbGlzdCB0byBvYmplY3RcclxuLy8gICAgICAgICQuZWFjaChzZXR0aW5nc0xpc3QsIGZ1bmN0aW9uKGksIHMpIHtcclxuLy8gICAgICAgICAgICBpZiAoKHMua2V5ID09IG51bGwpIHx8IChzLnZhbHVlID09IG51bGwpKVxyXG4vLyAgICAgICAgICAgICAgICByZXR1cm47XHJcbi8vXHJcbi8vICAgICAgICAgICAgLy8gQ3JlYXRlIGlubmVyIG9iamVjdHNcclxuLy8gICAgICAgICAgICB2YXIgcGF0aCA9IHMua2V5LnNwbGl0KFwiLlwiKTtcclxuLy8gICAgICAgICAgICB2YXIgY3VycmVudCA9IHNwcmVhZHNoZWV0LnNldHRpbmdzO1xyXG4vLyAgICAgICAgICAgICQuZWFjaChwYXRoLCBmdW5jdGlvbihqLCBrKSB7XHJcbi8vICAgICAgICAgICAgICAgIGlmIChjdXJyZW50W2tdID09IG51bGwpIHtcclxuLy8gICAgICAgICAgICAgICAgICAgIGlmIChqID09IHBhdGgubGVuZ3RoIC0gMSlcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50W2tdID0gcy52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuLy8gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50W2tdID0ge307XHJcbi8vICAgICAgICAgICAgICAgIH1cclxuLy8gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRba107XHJcbi8vICAgICAgICAgICAgfSk7XHJcbi8vICAgICAgICB9KTtcclxuLy8gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICByZXR1cm4gJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvY2VsbHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL1wiICsgc2hlZXRJbmRleCArIFwiL3B1YmxpYy92YWx1ZXM/YWx0PWpzb24taW4tc2NyaXB0XCIsXHJcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IG9uU3VjY2Vzc1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvcHVibGljL2Z1bGw/YWx0PWpzb24taW4tc2NyaXB0XCIsXHJcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzaGVldENvdW50OiByZXNwb25zZS5mZWVkLmVudHJ5Lmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogcmVzcG9uc2UuZmVlZC50aXRsZS4kdFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhpbmZvKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgdGl0bGUpIHtcclxuICAgIHRoaXMua2V5ID0gc3ByZWFkc2hlZXRLZXk7XHJcbiAgICB0aGlzLnRpdGxlID0gdGl0bGU7XHJcbiAgICB0aGlzLnNoZWV0cyA9IG5ldyBTaGVldHMoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gU2hlZXRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNoZWV0KCkge1xyXG4gICAgdGhpcy5yb3dzID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuU2hlZXQucHJvdG90eXBlLmhlYWRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucm93c1swXS52YWx1ZXMoKTtcclxufVxyXG5cclxuU2hlZXQucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24ocm93LCBjb2xOYW1lKSB7XHJcbiAgICB2YXIgY29sSW5kZXggPSB0aGlzLmhlYWRlcigpLmluZGV4T2YoY29sTmFtZSk7XHJcbiAgICBpZiAoY29sSW5kZXggPT0gLTEpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAkLmVhY2gocm93LnJvd0NlbGxzLCBmdW5jdGlvbihpLCByb3dDZWxsKSB7XHJcbiAgICAgICAgaWYgKHJvd0NlbGwuY29sSW5kZXggPT0gY29sSW5kZXgpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gcm93Q2VsbC52YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJvdyhyb3dJbmRleCkge1xyXG4gICAgdGhpcy5yb3dJbmRleCA9IHJvd0luZGV4O1xyXG4gICAgdGhpcy5yb3dDZWxscyA9IFtdO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5Sb3cucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICQubWFwKHRoaXMucm93Q2VsbHMsIGZ1bmN0aW9uKHJvd0NlbGwsIGkpIHtcclxuICAgICAgICByZXR1cm4gcm93Q2VsbC52YWx1ZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBSb3dDZWxsKGNvbEluZGV4LCB2YWx1ZSkge1xyXG4gICAgdGhpcy5jb2xJbmRleCA9IGNvbEluZGV4O1xyXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iXX0=
