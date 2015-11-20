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
    var model = new Model();

    console.log(spreadsheet);

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

    console.log(model);
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
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xyXG4gICAgY2hlY2tSZXF1aXJlbWVudHMoKTtcclxuXHJcbiAgICB2YXIgZDNzaGVldCA9IHtcclxuICAgICAgICB2ZXI6IFwiMS4wLjBcIixcclxuICAgICAgICBzdmdDb250YWluZXJJZDogXCJcIixcclxuICAgICAgICBpbmZvQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgc3ZnOiB7fSxcclxuICAgICAgICBzcHJlYWRzaGVldDoge30sXHJcbiAgICAgICAgbW9kZWw6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcclxuXHJcbiAgICAvKipcclxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cclxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gaWRlbnRpZmllciBvZiB0aGUgbWFpbiBESVYuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcclxuICAgICAgICBpZiAoc3ZnQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XHJcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XHJcbiAgICAgICAgZDNzaGVldC5pbmZvQ29udGFpbmVySWQgPSBpbmZvQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBTVkcgZWxlbWVudFxyXG4gICAgICAgIGQzc2hlZXQuc3ZnID0gZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKCd2aWV3Qm94JywgXCIwIDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGluZm8gcGFuZWxcclxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XHJcblxyXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgKiBMb2FkIGRhdGEgZnJvbSBzcHJlYWRzaGVldC5cclxuICAgICoqL1xyXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcclxuICAgICAgICAvLyBMb2FkIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gcmVxdWlyZShcIi4vc3ByZWFkc2hlZXRcIik7XHJcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XHJcbiAgICAgICAgICAgIGQzc2hlZXQuc3ByZWFkc2hlZXQgPSBzcHJlYWRzaGVldDtcclxuXHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgZG9jdW1lbnRcclxuICAgICAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBzcHJlYWRzaGVldC50aXRsZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgaW5mbyBzZWN0aW9uXHJcbiAgICAgICAgICAgIHZhciBpbmZvTW9kdWxlID0gcmVxdWlyZShcIi4vaW5mb1wiKTtcclxuICAgICAgICAgICAgdmFyIGluZm8gPSBpbmZvTW9kdWxlKGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkLCBzcHJlYWRzaGVldC50aXRsZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBzcHJlYWRzaGVldFxyXG4gICAgICAgICAgICB2YXIgbW9kZWxNb2R1bGUgPSByZXF1aXJlKFwiLi9tb2RlbFwiKTtcclxuICAgICAgICAgICAgZDNzaGVldC5tb2RlbCA9IG1vZGVsTW9kdWxlKGQzc2hlZXQuc3ByZWFkc2hlZXQpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGdyYXBoIGZyb20gbW9kZWxcclxuICAgICAgICAgICAgdmFyIGdyYXBoTW9kdWxlID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XHJcbiAgICAgICAgICAgIGQzc2hlZXQuZ3JhcGggPSBncmFwaE1vZHVsZShkM3NoZWV0Lm1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBEMyBmb3JjZSBsYXlvdXQgZnJvbSBncmFwaFxyXG4gICAgICAgICAgICB2YXIgZm9yY2VNb2R1bGUgPSByZXF1aXJlKFwiLi9mb3JjZVwiKTtcclxuICAgICAgICAgICAgdmFyIGZvcmNlID0gZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8sIHNwcmVhZHNoZWV0LnNldHRpbmdzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdmlldyBvcHRpb25zXHJcbi8vICAgICAgICAgICAgdmFyIHZpZXdNb2R1bGUgPSByZXF1aXJlKFwiLi92aWV3XCIpO1xyXG4vLyAgICAgICAgICAgIHZpZXdNb2R1bGUoZDNzaGVldC5tb2RlbCwgZm9yY2UudXBkYXRlR3JhcGgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQXBwbHkgQ1NTIHN0eWxlXHJcbiAgICAgICAgICAgIGFwcGx5Q3NzKHNwcmVhZHNoZWV0LnNldHRpbmdzLmNzcyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlDc3MoY3NzKSB7XHJcbiAgICAgICAgaWYgKGNzcyA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBhbGwgZWxlbWVudCBzZWxlY3RvcnNcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gT2JqZWN0LmtleXMoY3NzKTtcclxuICAgICAgICAkLmVhY2goc2VsZWN0b3JzLCBmdW5jdGlvbihpLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSB7fTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgLy8gSXQgaXMgYW4gaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgaXMgYSBjbGFzc1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKFwiLlwiICsgc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzdHlsZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoY3NzW3NlbGVjdG9yXSk7XHJcbiAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihqLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMuY3NzKHByb3BlcnR5LCBjc3Nbc2VsZWN0b3JdW3Byb3BlcnR5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcclxuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgfVxyXG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbykge1xyXG4gICAgdmFyIG5vZGUgPSBbXSxcclxuICAgICAgICBub2RlTGFiZWwgPSBbXSxcclxuICAgICAgICBsaW5rID0gW10sXHJcbiAgICAgICAgbGlua0xhYmVsID0gW10sXHJcbiAgICAgICAgY29sb3JzID0gZDMuc2NhbGUuY2F0ZWdvcnkyMCgpO1xyXG5cclxuICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpO1xyXG5cclxuICAgIHZhciBmb3JjZSA9IGQzLmxheW91dC5mb3JjZSgpXHJcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxyXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMzApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuY2hhcmdlKC01MDAwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmdyYXZpdHkoMC41KSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgIC5saW5rcyhncmFwaC5saW5rcylcclxuICAgICAgICAub24oXCJ0aWNrXCIsIG9uVGljayk7XHJcblxyXG4gICAgcmVzdGFydCgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RhcnQodmlld09wdGlvbnMpIHtcclxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIilcclxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgICAgIC5lbnRlcigpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpO1xyXG5cclxuLy8gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKS5kYXRhKGdyYXBoLmxpbmtzKVxyXG4vLyAgICAgICAgICAgIC5lbnRlcigpXHJcbi8vICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuLy8gICAgICAgICAgICAudGV4dChsaW5rVGV4dClcclxuLy8gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluay1sYWJlbFwiKVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIik7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMzApIC8vIFRPRE86IFNldHRpbmdzXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgMClcclxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIG5vZGVGaWxsQ29sb3IpXHJcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXHJcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGUtbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24obikgeyByZXR1cm4gbi5sYWJlbDsgfSlcclxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcclxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcclxuXHJcbiAgICAgICAgc2VsZWN0QWxsKCk7XHJcbiAgICAgICAgZm9yY2Uuc3RhcnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub2RlQ2xpY2sobm9kZSkge1xyXG4gICAgICAgIGluZm8uc2hvd05vZGUobm9kZSwgZ3JhcGgubm9kZXMsIG5vZGVGaWxsQ29sb3Iobm9kZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVGaWxsQ29sb3Iobm9kZSkge1xyXG4gICAgICAgIHJldHVybiBjb2xvcnMobm9kZS5zaGVldE5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNlbGVjdEFsbCgpIHtcclxuICAgICAgICBub2RlID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpO1xyXG4gICAgICAgIG5vZGVMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKTtcclxuICAgICAgICBsaW5rID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpO1xyXG4gICAgICAgIGxpbmtMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblRpY2soKSB7XHJcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS55OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XHJcblxyXG4gICAgICAgIGxpbmtMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS54ICsgZC50YXJnZXQueCkvMjsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xyXG5cclxuICAgICAgICBub2RlLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBub2RlTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XHJcbiAgICB2YXIgZ3JhcGggPSB7XHJcbiAgICAgICAgbm9kZXM6IFtdLFxyXG4gICAgICAgIGxpbmtzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xyXG4gICAgJC5lYWNoKG1vZGVsLnNoZWV0cywgZnVuY3Rpb24oaSwgc2hlZXQpIHtcclxuICAgICAgICAvLyBGb3IgYWxsIG5vZGVzXHJcbiAgICAgICAgJC5lYWNoKHNoZWV0Lm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEFkZCBub2RlIHRvIGdyYXBoXHJcbiAgICAgICAgICAgIG5vZGUuZ3JhcGhJbmRleCA9IGdyYXBoLm5vZGVzLnB1c2gobm9kZSkgLSAxO1xyXG4gICAgICAgICAgICBub2RlLmxhYmVsUHJvcGVydHkgPSBzaGVldC5sYWJlbDtcclxuICAgICAgICAgICAgbm9kZS5sYWJlbCA9IG5vZGUucHJvcGVydGllc1tub2RlLmxhYmVsUHJvcGVydHldO1xyXG4gICAgICAgICAgICBub2RlLnNoZWV0TmFtZSA9IHNoZWV0Lm5hbWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgbGlua3NcclxuICAgICQuZWFjaChtb2RlbC5zaGVldHMsIGZ1bmN0aW9uKGksIHNoZWV0KSB7XHJcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xyXG4gICAgICAgICQuZWFjaChzaGVldC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIGxpbmtlZCBzaGVldHNcclxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LmxpbmtlZFNoZWV0cywgZnVuY3Rpb24oaywgbGlua2VkU2hlZXQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLmxpbmtzW2xpbmtlZFNoZWV0Lm5hbWVdID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgdGFyZ2V0IG5vZGVzXHJcbiAgICAgICAgICAgICAgICB2YXIgZ3JhcGhUYXJnZXRJbmRleGVzID0gW107XHJcbiAgICAgICAgICAgICAgICAkLmVhY2gobm9kZS5saW5rc1tsaW5rZWRTaGVldC5uYW1lXSwgZnVuY3Rpb24obCwgdGFyZ2V0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGluayA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBub2RlLmdyYXBoSW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogbW9kZWwuc2hlZXRzW2xpbmtlZFNoZWV0Lm5hbWVdLm5vZGVzW3RhcmdldEluZGV4XS5ncmFwaEluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogbGlua2VkU2hlZXQubGFiZWxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoVGFyZ2V0SW5kZXhlcy5wdXNoKGxpbmsudGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKGxpbmspO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVwbGFjZSBtb2RlbCBpbmRleGVzIHdpdGggZ3JhcGggaW5kZXhlc1xyXG4gICAgICAgICAgICAgICAgbm9kZS5saW5rc1tsaW5rZWRTaGVldC5uYW1lXSA9IGdyYXBoVGFyZ2V0SW5kZXhlcztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZ3JhcGg7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluZm9Db250YWluZXJJZCwgdGl0bGUpIHtcclxuICAgIC8vIFNldCBoZWFkaW5nXHJcbiAgICAkKFwiI1wiICsgaW5mb0NvbnRhaW5lcklkICsgXCIgaDFcIikudGV4dCh0aXRsZSk7XHJcblxyXG4gICAgdGhpcy5zaG93Tm9kZSA9IGZ1bmN0aW9uKG5vZGUsIG5vZGVzLCBmaWxsQ29sb3IpIHtcclxuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1pbmZvIGgyXCIpLnRleHQobm9kZS5sYWJlbCk7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLXNoZWV0LW5hbWVcIikudGV4dChub2RlLnNoZWV0TmFtZSk7XHJcblxyXG4gICAgICAgIHZhciB1bCA9ICQoXCIjZDNzaGVldC1ub2RlLXByb3BlcnRpZXNcIik7XHJcbiAgICAgICAgdWwuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgLy8gU2hvdyBub2RlIHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgcHJvcGVydHlOYW1lcyA9IE9iamVjdC5rZXlzKG5vZGUucHJvcGVydGllcyk7XHJcbiAgICAgICAgJC5lYWNoKHByb3BlcnR5TmFtZXMsIGZ1bmN0aW9uKGksIHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICBpZiAocHJvcGVydHlOYW1lICE9IG5vZGUubGFiZWxQcm9wZXJ0eSlcclxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnR5KHByb3BlcnR5TmFtZSwgbm9kZS5wcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgbGlua3NcclxuICAgICAgICB2YXIgbGlua05hbWVzID0gT2JqZWN0LmtleXMobm9kZS5saW5rcyk7XHJcbiAgICAgICAgJC5lYWNoKGxpbmtOYW1lcywgZnVuY3Rpb24oaSwgbGlua05hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldE5hbWVzID0gXCJcIjtcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGUubGlua3NbbGlua05hbWVdLCBmdW5jdGlvbihpLCB0YXJnZXRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldE5hbWVzICE9IFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TmFtZXMgPSB0YXJnZXROYW1lcyArIFwiLCBcIjtcclxuICAgICAgICAgICAgICAgIHRhcmdldE5hbWVzID0gdGFyZ2V0TmFtZXMgKyBub2Rlc1t0YXJnZXRJbmRleF0ubGFiZWw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhZGRQcm9wZXJ0eShsaW5rTmFtZSwgdGFyZ2V0TmFtZXMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBhZGRQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB1bC5hcHBlbmQoXCI8bGk+PHNwYW4gY2xhc3M9XFxcImQzc2hlZXQtbm9kZS1wcm9wZXJ0eS1uYW1lXFxcIj5cIiArIG5hbWUgK1xyXG4gICAgICAgICAgICAgICAgXCI6PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LXZhbHVlXFxcIj5cIiArIGZvcm1hdFZhbHVlKHZhbHVlKSArIFwiPC9zcGFuPjwvbGk+XCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLnNsaWNlKDAsIFwiNFwiKS50b0xvd2VyQ2FzZSgpID09IFwiaHR0cFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiPGEgaHJlZj1cXFwiXCIgKyB2YWx1ZSArIFwiXFxcIj5cIiArIHZhbHVlICsgXCI8L2E+XCJcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XHJcbiAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhzcHJlYWRzaGVldCk7XHJcblxyXG4gICAgdmFyIG5vZGVHcm91cFR5cGVzID0gZ2V0Tm9kZUdyb3VwVHlwZXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgbW9kZWwubm9kZUdyb3VwcyA9IGdldE5vZGVHcm91cHMoc3ByZWFkc2hlZXQsIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzKTtcclxuICAgIGlmIChub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSAhPSBudWxsKVxyXG4gICAgICAgIG1vZGVsLnNldHRpbmdzID0gc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cFR5cGVzLnNldHRpbmdzR3JvdXBOYW1lXTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXROb2RlR3JvdXBzKHNwcmVhZHNoZWV0LCBub2RlR3JvdXBOYW1lcykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBub2RlcyB3aXRoIHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgbm9kZUdyb3VwcyA9IG5ldyBOb2RlR3JvdXBzKCk7XHJcbiAgICAgICAgJC5lYWNoKG5vZGVHcm91cE5hbWVzLCBmdW5jdGlvbihpLCBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIG5vZGVHcm91cHNbbm9kZUdyb3VwTmFtZV0gPSBnZXROb2RlcyhzcHJlYWRzaGVldC5zaGVldHNbbm9kZUdyb3VwTmFtZV0sIG5vZGVHcm91cE5hbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgbGluayBuYW1lc1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICBjcmVhdGVMaW5rTmFtZXMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmtzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3VwTmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua3Mobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIGxpbmtzIGZyb20gbGluayBzaGVldHNcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua3Mobm9kZUdyb3Vwcywgbm9kZVNoZWV0LCBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBub2RlR3JvdXAgPSBub2RlR3JvdXBzW25vZGVHcm91cE5hbWVdO1xyXG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBub2RlU2hlZXQuaGVhZGVyKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbm9kZVNoZWV0LnZhbHVlKHJvdywgY29sTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGxpbmsgY29sdW1uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBwYXJzZUNvbHVtbkxpbmtOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluZCBpbmRleCBvZiB0aGUgdGFyZ2V0IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKG5vZGVHcm91cHNbbGlua1RhcmdldC5zaGVldE5hbWVdLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBXZSBzaG91bGQgcHJvcGVybHkgc3BsaXQgdmFsdWVzIHVzaW5nIGNvbW1hXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuaW5kZXhPZih0YXJnZXROb2RlLnZhbHVlKGxpbmtUYXJnZXQucHJvcGVydHlOYW1lKSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW5rcyA9IG5vZGVHcm91cC5ub2Rlc1tpIC0gMV0ubGlua3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmtzW2xpbmtUYXJnZXQuc2hlZXROYW1lXSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZSB0byB0aGUgbm9kZUdyb3VwIG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0ucHVzaChrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua05hbWVzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBzaGVldHNbbm9kZUdyb3VwTmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgbGluayBuYW1lc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LmhlYWRlcigpLCBmdW5jdGlvbihpLCBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShwcm9wZXJ0eU5hbWUsIHNoZWV0cyk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZS5saW5rZWROb2RlR3JvdXBzLnB1c2gobmV3IExpbmtlZE5vZGVHcm91cChsaW5rVGFyZ2V0LnNoZWV0TmFtZSwgbGlua1RhcmdldC5sYWJlbCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaGVhZGVyID0gbm9kZVNoZWV0LmhlYWRlcigpO1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE5vZGVHcm91cChub2RlR3JvdXBOYW1lLCBoZWFkZXJbMF0pO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IG5vZGVzIGFuZCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5ub2Rlcy5wdXNoKG5ldyBOb2RlKGdldE5vZGVQcm9wZXJ0aWVzKHJvdywgaGVhZGVyKSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBwcm9wZXJ0eSBuYW1lc1xyXG4gICAgICAgICAgICAkLmVhY2goaGVhZGVyLCBmdW5jdGlvbihpLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnByb3BlcnR5TmFtZXMucHVzaChjb2xOYW1lKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BlcnRpZXMocm93LCBoZWFkZXIpIHtcclxuICAgICAgICAgICAgdmFyIG5vZGVQcm9wZXJ0aWVzID0gW107XHJcbiAgICAgICAgICAgICQuZWFjaChyb3cucm93Q2VsbHMsIGZ1bmN0aW9uKGksIHJvd0NlbGwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb2xOYW1lID0gaGVhZGVyW3Jvd0NlbGwuY29sSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbE5hbWUuaW5kZXhPZihcIi5cIikgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZVByb3BlcnRpZXMucHVzaChuZXcgTm9kZVByb3BlcnR5KGNvbE5hbWUsIHJvd0NlbGwudmFsdWUpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlUHJvcGVydGllcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KSB7XHJcbiAgICAgICAgdmFyIG5vZGVHcm91cFR5cGVzID0ge1xyXG4gICAgICAgICAgICBub2RlR3JvdXBOYW1lczogW10sXHJcbiAgICAgICAgICAgIGxpbmtTaGVldE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgc2V0dGluZ3NHcm91cE5hbWU6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQuc2hlZXRzKTtcclxuICAgICAgICAkLmVhY2goc2hlZXROYW1lcywgZnVuY3Rpb24oaSwgc2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUgPT0gXCJzZXR0aW5nc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSA9IHNoZWV0TmFtZTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHZhciBsaW5rU2hlZXQgPSBwYXJzZUxpbmtTaGVldE5hbWUoc2hlZXROYW1lKVxyXG4gICAgICAgICAgICBpZiAoKGxpbmtTaGVldCAhPSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihsaW5rU2hlZXQuc291cmNlKSA+IC0xKSAmJlxyXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihsaW5rU2hlZXQudGFyZ2V0KSA+IC0xKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMubGlua1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzLnB1c2goc2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGVHcm91cFR5cGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgc2hlZXRzKSB7XHJcbiAgICAgICAgdmFyIGxpbmtOYW1lcyA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIGlmICgobGlua05hbWVzLmxlbmd0aCA+PSAyKSAmJlxyXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0gIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgKHNoZWV0c1tsaW5rTmFtZXNbMF1dLnByb3BlcnR5TmFtZXMuaW5kZXhPZihsaW5rTmFtZXNbMV0pID4gLTEpKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICBzaGVldE5hbWU6IGxpbmtOYW1lc1swXSxcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogbGlua05hbWVzWzFdXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChsaW5rTmFtZXMubGVuZ3RoID09IDMpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQubGFiZWwgPSBsaW5rTmFtZXNbMl07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSkge1xyXG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xyXG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKG1vZGVsKTtcclxuICAgIHJldHVybiBtb2RlbDtcclxufVxyXG5cclxuZnVuY3Rpb24gTW9kZWwoKSB7XHJcbiAgICB0aGlzLm5vZGVHcm91cHMgPSB7fTtcclxuICAgIHRoaXMuc2V0dGluZ3MgPSB7fTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlR3JvdXBzKCkge1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVHcm91cChuYW1lLCBsYWJlbCkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcclxuICAgIHRoaXMucHJvcGVydHlOYW1lcyA9IFtdO1xyXG4gICAgdGhpcy5saW5rZWROb2RlR3JvdXBzID0gW107XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gTGlua2VkTm9kZUdyb3VwKG5hbWUsIGxhYmVsKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGUocHJvcGVydGllcykge1xyXG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gcHJvcGVydGllcztcclxuICAgIHRoaXMubGlua3MgPSB7fTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKHByb3BlcnR5TmFtZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAkLmVhY2godGhpcy5wcm9wZXJ0aWVzLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgIGlmIChwcm9wZXJ0eS5uYW1lID09IHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBwcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZVByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xyXG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XHJcbiAgICBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhpbmZvKSB7XHJcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXHJcbiAgICAgICAgbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKSB7XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gbmV3IFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBpbmZvLnRpdGxlKTtcclxuICAgICAgICB2YXIgbG9hZGVkU2hlZXRDb3VudCA9IDA7XHJcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBpbmZvLnNoZWV0Q291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbG9hZGVkU2hlZXRDb3VudCArPSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gaW5mby5zaGVldENvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICB2YXIgc2hlZXQgPSBzcHJlYWRzaGVldC5zaGVldHNbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSBuZXcgU2hlZXQoKTtcclxuXHJcbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF0gPSBuZXcgUm93KGluZGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdLnJvd0NlbGxzLnB1c2gobmV3IFJvd0NlbGwoZS5ncyRjZWxsLmNvbCAtIDEsIGUuY29udGVudC4kdCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNvcnQgcm93IGNlbGxzIGJ5IGNvbCBpbmRleFxyXG4gICAgICAgICAgICAkLmVhY2goc2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICByb3cucm93Q2VsbHMuc29ydChmdW5jdGlvbihjMSwgYzIpIHsgcmV0dXJuIGMxLmNvbEluZGV4IC0gYzIuY29sSW5kZXg7IH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbi8vICAgIGZ1bmN0aW9uIGxvYWRTZXR0aW5nc1NoZWV0KHNldHRpbmdzU2hlZXQsIHNwcmVhZHNoZWV0KSB7XHJcbi8vICAgICAgICAvLyBNYXAgY2VsbHMgdG8gbGlzdFxyXG4vLyAgICAgICAgdmFyIHNldHRpbmdzTGlzdCA9IHt9O1xyXG4vLyAgICAgICAgJC5lYWNoKHNldHRpbmdzU2hlZXQuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4vLyAgICAgICAgICAgIGlmIChzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10gPT0gbnVsbClcclxuLy8gICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddID0ge307XHJcbi8vXHJcbi8vICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5jb2wgPT0gMSlcclxuLy8gICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddLmtleSA9IGUuY29udGVudC4kdDtcclxuLy8gICAgICAgICAgICBlbHNlXHJcbi8vICAgICAgICAgICAgICAgIGlmIChlLmdzJGNlbGwuY29sID09IDIpXHJcbi8vICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10udmFsdWUgPSBlLmNvbnRlbnQuJHQ7XHJcbi8vICAgICAgICB9KTtcclxuLy9cclxuLy8gICAgICAgIC8vIE1hcCBsaXN0IHRvIG9iamVjdFxyXG4vLyAgICAgICAgJC5lYWNoKHNldHRpbmdzTGlzdCwgZnVuY3Rpb24oaSwgcykge1xyXG4vLyAgICAgICAgICAgIGlmICgocy5rZXkgPT0gbnVsbCkgfHwgKHMudmFsdWUgPT0gbnVsbCkpXHJcbi8vICAgICAgICAgICAgICAgIHJldHVybjtcclxuLy9cclxuLy8gICAgICAgICAgICAvLyBDcmVhdGUgaW5uZXIgb2JqZWN0c1xyXG4vLyAgICAgICAgICAgIHZhciBwYXRoID0gcy5rZXkuc3BsaXQoXCIuXCIpO1xyXG4vLyAgICAgICAgICAgIHZhciBjdXJyZW50ID0gc3ByZWFkc2hlZXQuc2V0dGluZ3M7XHJcbi8vICAgICAgICAgICAgJC5lYWNoKHBhdGgsIGZ1bmN0aW9uKGosIGspIHtcclxuLy8gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRba10gPT0gbnVsbCkge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgaWYgKGogPT0gcGF0aC5sZW5ndGggLSAxKVxyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSBzLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSB7fTtcclxuLy8gICAgICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtrXTtcclxuLy8gICAgICAgICAgICB9KTtcclxuLy8gICAgICAgIH0pO1xyXG4vLyAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xyXG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0Q291bnQ6IHJlc3BvbnNlLmZlZWQuZW50cnkubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiByZXNwb25zZS5mZWVkLnRpdGxlLiR0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgb25TdWNjZXNzKGluZm8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gU3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIHRpdGxlKSB7XHJcbiAgICAgICAgdGhpcy5rZXkgPSBzcHJlYWRzaGVldEtleTtcclxuICAgICAgICB0aGlzLnRpdGxlID0gdGl0bGU7XHJcbiAgICAgICAgdGhpcy5zaGVldHMgPSBuZXcgU2hlZXRzKCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFNoZWV0cygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBTaGVldCgpIHtcclxuICAgICAgICB0aGlzLnJvd3MgPSBbXTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBTaGVldC5wcm90b3R5cGUuaGVhZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm93c1swXS52YWx1ZXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBTaGVldC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihyb3csIGNvbE5hbWUpIHtcclxuICAgICAgICB2YXIgY29sSW5kZXggPSB0aGlzLmhlYWRlcigpLmluZGV4T2YoY29sTmFtZSk7XHJcbiAgICAgICAgaWYgKGNvbEluZGV4ID09IC0xKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xyXG4gICAgICAgICAgICBpZiAocm93Q2VsbC5jb2xJbmRleCA9PSBjb2xJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcm93Q2VsbC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFJvdyhyb3dJbmRleCkge1xyXG4gICAgICAgIHRoaXMucm93SW5kZXggPSByb3dJbmRleDtcclxuICAgICAgICB0aGlzLnJvd0NlbGxzID0gW107XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIFJvdy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICQubWFwKHRoaXMucm93Q2VsbHMsIGZ1bmN0aW9uKHJvd0NlbGwsIGkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJvd0NlbGwudmFsdWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gUm93Q2VsbChjb2xJbmRleCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbEluZGV4ID0gY29sSW5kZXg7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59Il19
