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

        // Create references from node sheets
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            createRefs(nodeGroups, spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // TODO: Create references from reference sheets

        function createRefs(nodeGroups, nodeSheet, nodeGroupName) {
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

                    // If this is a reference column
                    var refTarget = parseColumnRefName(colName, nodeGroups);
                    if (refTarget != null) {
                        // Find index of the target node
                        $.each(nodeGroups[refTarget.sheetName].nodes, function(k, targetNode) {
                            // If target node property value matches
                            // TODO: We should properly split values using comma
                            if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                                nodeGroup.nodes[i - 1].refs.push(new Ref(targetNode, refTarget.label));
                            }
                        });
                    }
                });
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
            refSheetNames: [],
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

            var refSheet = parseRefSheetName(sheetName)
            if ((refSheet != null) &&
                (sheetNames.indexOf(refSheet.source) > -1) &&
                (sheetNames.indexOf(refSheet.target) > -1)) {
                nodeGroupTypes.refSheetNames.push(sheetName)
                return;
            }

            nodeGroupTypes.nodeGroupNames.push(sheetName);
        });

        return nodeGroupTypes;
    }

    function parseColumnRefName(colName, sheets) {
        var refNames = colName.split(".");
        if ((refNames.length >= 2) &&
            (sheets[refNames[0]] != null)) {
            var result = {
                sheetName: refNames[0],
                propertyName: refNames[1]
            }

            if (refNames.length == 3)
                result.label = refNames[2];

            return result;
        }

        return null;
    }

    function parseRefSheetName(sheetName) {
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

function NodeGroup(name, labelPropertyName) {
    this.name = name;
    this.labelPropertyName = labelPropertyName;
    this.nodes = [];
    return this;
}

function Node(properties) {
    this.properties = properties;
    this.refs = [];
    return this;
}

function Ref(targetNode, label) {
    this.targetNode = targetNode;
    this.label = label;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvaW5mby5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XG5cbiAgICB2YXIgZDNzaGVldCA9IHtcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXG4gICAgICAgIHN2Z0NvbnRhaW5lcklkOiBcIlwiLFxuICAgICAgICBpbmZvQ29udGFpbmVySWQ6IFwiXCIsXG4gICAgICAgIHN2Zzoge30sXG4gICAgICAgIHNwcmVhZHNoZWV0OiB7fSxcbiAgICAgICAgbW9kZWw6IHt9XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcblxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxuICAgICoqL1xuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xuXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xuXG4gICAgICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxuICAgICAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcbiAgICAgICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcblxuICAgICAgICAvLyBDcmVhdGUgU1ZHIGVsZW1lbnRcbiAgICAgICAgZDNzaGVldC5zdmcgPSBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKCd2aWV3Qm94JywgXCIwIDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0KTtcblxuICAgICAgICAvLyBDcmVhdGUgaW5mbyBwYW5lbFxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xuXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXG4gICAgKiovXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzcHJlYWRzaGVldCk7XG5cbiAgICAgICAgICAgIGQzc2hlZXQuc3ByZWFkc2hlZXQgPSBzcHJlYWRzaGVldDtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxuICAgICAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBzcHJlYWRzaGVldC50aXRsZTtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cbiAgICAgICAgICAgIHZhciBpbmZvTW9kdWxlID0gcmVxdWlyZShcIi4vaW5mb1wiKTtcbiAgICAgICAgICAgIHZhciBpbmZvID0gaW5mb01vZHVsZShkM3NoZWV0LmluZm9Db250YWluZXJJZCwgc3ByZWFkc2hlZXQudGl0bGUpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBzcHJlYWRzaGVldFxuICAgICAgICAgICAgdmFyIG1vZGVsTW9kdWxlID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQubW9kZWwpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxuICAgICAgICAgICAgdmFyIGdyYXBoTW9kdWxlID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGhNb2R1bGUoZDNzaGVldC5tb2RlbCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQuZ3JhcGgpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcbiAgICAgICAgICAgIHZhciBmb3JjZU1vZHVsZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xuICAgICAgICAgICAgdmFyIGZvcmNlID0gZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8sIHNwcmVhZHNoZWV0LnNldHRpbmdzKTtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB2aWV3IG9wdGlvbnNcbi8vICAgICAgICAgICAgdmFyIHZpZXdNb2R1bGUgPSByZXF1aXJlKFwiLi92aWV3XCIpO1xuLy8gICAgICAgICAgICB2aWV3TW9kdWxlKGQzc2hlZXQubW9kZWwsIGZvcmNlLnVwZGF0ZUdyYXBoKTtcblxuICAgICAgICAgICAgLy8gQXBwbHkgQ1NTIHN0eWxlXG4gICAgICAgICAgICBhcHBseUNzcyhkM3NoZWV0Lm1vZGVsLnNldHRpbmdzLmNzcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5Q3NzKGNzcykge1xuICAgICAgICBpZiAoY3NzID09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgLy8gR2V0IGFsbCBlbGVtZW50IHNlbGVjdG9yc1xuICAgICAgICB2YXIgc2VsZWN0b3JzID0gT2JqZWN0LmtleXMoY3NzKTtcbiAgICAgICAgJC5lYWNoKHNlbGVjdG9ycywgZnVuY3Rpb24oaSwgc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHt9O1xuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLnNsaWNlKDAsIDEpID09IFwiI1wiKVxuICAgICAgICAgICAgICAgIC8vIEl0IGlzIGFuIGlkZW50aWZpZXJcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoc2VsZWN0b3IpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIC8vIElzIGlzIGEgY2xhc3NcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoXCIuXCIgKyBzZWxlY3Rvcik7XG5cbiAgICAgICAgICAgIC8vIEdldCBhbGwgc3R5bGUgcHJvcGVydGllc1xuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhjc3Nbc2VsZWN0b3JdKTtcbiAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihqLCBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLmNzcyhwcm9wZXJ0eSwgY3NzW3NlbGVjdG9yXVtwcm9wZXJ0eV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcbiAgICB9XG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbykge1xuICAgIHZhciBub2RlID0gW10sXG4gICAgICAgIG5vZGVMYWJlbCA9IFtdLFxuICAgICAgICBsaW5rID0gW10sXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdLFxuICAgICAgICBjb2xvcnMgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XG5cbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xuXG4gICAgc2VsZWN0QWxsKCk7XG5cbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxuICAgICAgICAuc2l6ZShbd2lkdGgsIGhlaWdodF0pXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMzApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcbiAgICAgICAgLmNoYXJnZSgtNTAwMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xuICAgICAgICAuZ3Jhdml0eSgwLjUpIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXG4gICAgICAgIC5vbihcInRpY2tcIiwgb25UaWNrKTtcblxuICAgIHJlc3RhcnQoKTtcblxuICAgIGZ1bmN0aW9uIHJlc3RhcnQodmlld09wdGlvbnMpIHtcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIik7XG5cbi8vICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIikuZGF0YShncmFwaC5saW5rcylcbi8vICAgICAgICAgICAgLmVudGVyKClcbi8vICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbi8vICAgICAgICAgICAgLnRleHQobGlua1RleHQpXG4vLyAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXG4vLyAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIik7XG5cbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJyXCIsIDMwKSAvLyBUT0RPOiBTZXR0aW5nc1xuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgMClcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBub2RlRmlsbENvbG9yKVxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XG5cbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGUtbGFiZWxcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24obikgeyByZXR1cm4gbi5sYWJlbDsgfSlcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xuXG4gICAgICAgIHNlbGVjdEFsbCgpO1xuICAgICAgICBmb3JjZS5zdGFydCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vZGVDbGljayhub2RlKSB7XG4gICAgICAgIGluZm8uc2hvd05vZGUobm9kZSwgZ3JhcGgubm9kZXMsIG5vZGVGaWxsQ29sb3Iobm9kZSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vZGVGaWxsQ29sb3Iobm9kZSkge1xuICAgICAgICByZXR1cm4gY29sb3JzKG5vZGUuc2hlZXROYW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XG4gICAgICAgIG5vZGVMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKTtcbiAgICAgICAgbGluayA9IHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKTtcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XG5cbiAgICAgICAgbGlua0xhYmVsXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xuXG4gICAgICAgIG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xuICAgICAgICB9KTtcblxuICAgICAgICBub2RlTGFiZWxcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIGdyYXBoID0gbmV3IEdyYXBoKCk7XG5cbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xuICAgICQuZWFjaChtb2RlbC5ub2RlR3JvdXBzLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xuICAgICAgICAkLmVhY2gobm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XG4gICAgICAgICAgICAvLyBBZGQgbm9kZSB0byBncmFwaFxuICAgICAgICAgICAgdmFyIGdyYXBoTm9kZSA9IG5ldyBHcmFwaE5vZGUobm9kZSwgbm9kZUdyb3VwLmxhYmVsLCBub2RlR3JvdXAubmFtZSk7XG4gICAgICAgICAgICBncmFwaC5ub2Rlcy5wdXNoKGdyYXBoTm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGxpbmtzXG4gICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcbiAgICAgICAgLy8gRm9yIGFsbCByZWZlcmVuY2VzXG4gICAgICAgICQuZWFjaChncmFwaE5vZGUubm9kZS5yZWZzLCBmdW5jdGlvbihqLCByZWYpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXROb2RlSW5kZXggPSBub2RlR3JhcGhJbmRleChyZWYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIHZhciBsaW5rID0ge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogZ3JhcGhOb2RlLFxuICAgICAgICAgICAgICAgIHRhcmdldDogZ3JhcGgubm9kZXNbdGFyZ2V0Tm9kZUluZGV4XSxcbiAgICAgICAgICAgICAgICBsYWJlbDogcmVmLmxhYmVsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZ3JhcGgubGlua3MucHVzaChsaW5rKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBub2RlR3JhcGhJbmRleChub2RlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSAtMTtcbiAgICAgICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcbiAgICAgICAgICAgIGlmIChncmFwaE5vZGUubm9kZSA9PSBub2RlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gaTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBncmFwaDtcbn1cblxuZnVuY3Rpb24gR3JhcGgoKSB7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHRoaXMubGlua3MgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gR3JhcGhOb2RlKG5vZGUsIGxhYmVsUHJvcGVydHksIG5vZGVHcm91cE5hbWUpIHtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgIHRoaXMubGFiZWxQcm9wZXJ0eSA9IGxhYmVsUHJvcGVydHk7XG4gICAgdGhpcy5sYWJlbCA9IG5vZGUudmFsdWUobGFiZWxQcm9wZXJ0eSk7XG4gICAgdGhpcy5ub2RlR3JvdXBOYW1lID0gbm9kZUdyb3VwTmFtZTtcbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluZm9Db250YWluZXJJZCwgdGl0bGUpIHtcbiAgICAvLyBTZXQgaGVhZGluZ1xuICAgICQoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQgKyBcIiBoMVwiKS50ZXh0KHRpdGxlKTtcblxuICAgIHRoaXMuc2hvd05vZGUgPSBmdW5jdGlvbihub2RlLCBub2RlcywgZmlsbENvbG9yKSB7XG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmxhYmVsKTtcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1zaGVldC1uYW1lXCIpLnRleHQobm9kZS5zaGVldE5hbWUpO1xuXG4gICAgICAgIHZhciB1bCA9ICQoXCIjZDNzaGVldC1ub2RlLXByb3BlcnRpZXNcIik7XG4gICAgICAgIHVsLmVtcHR5KCk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIHByb3BlcnRpZXNcbiAgICAgICAgdmFyIHByb3BlcnR5TmFtZXMgPSBPYmplY3Qua2V5cyhub2RlLnByb3BlcnRpZXMpO1xuICAgICAgICAkLmVhY2gocHJvcGVydHlOYW1lcywgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICBpZiAocHJvcGVydHlOYW1lICE9IG5vZGUubGFiZWxQcm9wZXJ0eSlcbiAgICAgICAgICAgICAgICBhZGRQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIG5vZGUucHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIGxpbmtzXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhub2RlLmxpbmtzKTtcbiAgICAgICAgJC5lYWNoKGxpbmtOYW1lcywgZnVuY3Rpb24oaSwgbGlua05hbWUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXROYW1lcyA9IFwiXCI7XG4gICAgICAgICAgICAkLmVhY2gobm9kZS5saW5rc1tsaW5rTmFtZV0sIGZ1bmN0aW9uKGksIHRhcmdldEluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldE5hbWVzICE9IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5hbWVzID0gdGFyZ2V0TmFtZXMgKyBcIiwgXCI7XG4gICAgICAgICAgICAgICAgdGFyZ2V0TmFtZXMgPSB0YXJnZXROYW1lcyArIG5vZGVzW3RhcmdldEluZGV4XS5sYWJlbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYWRkUHJvcGVydHkobGlua05hbWUsIHRhcmdldE5hbWVzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHVsLmFwcGVuZChcIjxsaT48c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LW5hbWVcXFwiPlwiICsgbmFtZSArXG4gICAgICAgICAgICAgICAgXCI6PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LXZhbHVlXFxcIj5cIiArIGZvcm1hdFZhbHVlKHZhbHVlKSArIFwiPC9zcGFuPjwvbGk+XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSgwLCBcIjRcIikudG9Mb3dlckNhc2UoKSA9PSBcImh0dHBcIilcbiAgICAgICAgICAgICAgICByZXR1cm4gXCI8YSBocmVmPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiPlwiICsgdmFsdWUgKyBcIjwvYT5cIlxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKCk7XG5cbiAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCk7XG4gICAgbW9kZWwubm9kZUdyb3VwcyA9IGdldE5vZGVHcm91cHMoc3ByZWFkc2hlZXQsIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzKTtcbiAgICBpZiAobm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgIT0gbnVsbClcbiAgICAgICAgbW9kZWwuc2V0dGluZ3MgPSBzcHJlYWRzaGVldC5zaGVldHNbbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWVdO1xuXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMpIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5vZGVzIHdpdGggcHJvcGVydGllc1xuICAgICAgICB2YXIgbm9kZUdyb3VwcyA9IG5ldyBOb2RlR3JvdXBzKCk7XG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xuICAgICAgICAgICAgbm9kZUdyb3Vwc1tub2RlR3JvdXBOYW1lXSA9IGdldE5vZGVzKHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBOYW1lXSwgbm9kZUdyb3VwTmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSByZWZlcmVuY2VzIGZyb20gbm9kZSBzaGVldHNcbiAgICAgICAgJC5lYWNoKG5vZGVHcm91cE5hbWVzLCBmdW5jdGlvbihpLCBub2RlR3JvdXBOYW1lKSB7XG4gICAgICAgICAgICBjcmVhdGVSZWZzKG5vZGVHcm91cHMsIHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBOYW1lXSwgbm9kZUdyb3VwTmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRPRE86IENyZWF0ZSByZWZlcmVuY2VzIGZyb20gcmVmZXJlbmNlIHNoZWV0c1xuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgbm9kZVNoZWV0LCBub2RlR3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgbm9kZUdyb3VwID0gbm9kZUdyb3Vwc1tub2RlR3JvdXBOYW1lXTtcbiAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IG5vZGVTaGVldC5oZWFkZXIoKTtcblxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIGlmIChpID09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xuICAgICAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBub2RlU2hlZXQudmFsdWUocm93LCBjb2xOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHJlZmVyZW5jZSBjb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZlRhcmdldCA9IHBhcnNlQ29sdW1uUmVmTmFtZShjb2xOYW1lLCBub2RlR3JvdXBzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZlRhcmdldCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKG5vZGVHcm91cHNbcmVmVGFyZ2V0LnNoZWV0TmFtZV0ubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3Blcmx5IHNwbGl0IHZhbHVlcyB1c2luZyBjb21tYVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5pbmRleE9mKHRhcmdldE5vZGUudmFsdWUocmVmVGFyZ2V0LnByb3BlcnR5TmFtZSkpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUdyb3VwLm5vZGVzW2kgLSAxXS5yZWZzLnB1c2gobmV3IFJlZih0YXJnZXROb2RlLCByZWZUYXJnZXQubGFiZWwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXROb2Rlcyhub2RlU2hlZXQsIG5vZGVHcm91cE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBoZWFkZXIgPSBub2RlU2hlZXQuaGVhZGVyKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IE5vZGVHcm91cChub2RlR3JvdXBOYW1lLCBoZWFkZXJbMF0pO1xuXG4gICAgICAgICAgICAvLyBHZXQgbm9kZXMgYW5kIHByb3BlcnRpZXNcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5ub2Rlcy5wdXNoKG5ldyBOb2RlKGdldE5vZGVQcm9wZXJ0aWVzKHJvdywgaGVhZGVyKSkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlcikge1xuICAgICAgICAgICAgdmFyIG5vZGVQcm9wZXJ0aWVzID0gW107XG4gICAgICAgICAgICAkLmVhY2gocm93LnJvd0NlbGxzLCBmdW5jdGlvbihpLCByb3dDZWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWUgPSBoZWFkZXJbcm93Q2VsbC5jb2xJbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGNvbE5hbWUuaW5kZXhPZihcIi5cIikgPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQcm9wZXJ0aWVzLnB1c2gobmV3IE5vZGVQcm9wZXJ0eShjb2xOYW1lLCByb3dDZWxsLnZhbHVlKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBub2RlUHJvcGVydGllcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IHtcbiAgICAgICAgICAgIG5vZGVHcm91cE5hbWVzOiBbXSxcbiAgICAgICAgICAgIHJlZlNoZWV0TmFtZXM6IFtdLFxuICAgICAgICAgICAgc2V0dGluZ3NHcm91cE5hbWU6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNoZWV0TmFtZXMgPSBPYmplY3Qua2V5cyhzcHJlYWRzaGVldC5zaGVldHMpO1xuICAgICAgICAkLmVhY2goc2hlZXROYW1lcywgZnVuY3Rpb24oaSwgc2hlZXROYW1lKSB7XG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lID09IFwic2V0dGluZ3NcIikge1xuICAgICAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLnNldHRpbmdzR3JvdXBOYW1lID0gc2hlZXROYW1lO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIilcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciByZWZTaGVldCA9IHBhcnNlUmVmU2hlZXROYW1lKHNoZWV0TmFtZSlcbiAgICAgICAgICAgIGlmICgocmVmU2hlZXQgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKHJlZlNoZWV0LnNvdXJjZSkgPiAtMSkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKHJlZlNoZWV0LnRhcmdldCkgPiAtMSkpIHtcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMubm9kZUdyb3VwTmFtZXMucHVzaChzaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbm9kZUdyb3VwVHlwZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIHNoZWV0cykge1xuICAgICAgICB2YXIgcmVmTmFtZXMgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgaWYgKChyZWZOYW1lcy5sZW5ndGggPj0gMikgJiZcbiAgICAgICAgICAgIChzaGVldHNbcmVmTmFtZXNbMF1dICE9IG51bGwpKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIHNoZWV0TmFtZTogcmVmTmFtZXNbMF0sXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiByZWZOYW1lc1sxXVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVmTmFtZXMubGVuZ3RoID09IDMpXG4gICAgICAgICAgICAgICAgcmVzdWx0LmxhYmVsID0gcmVmTmFtZXNbMl07XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZVJlZlNoZWV0TmFtZShzaGVldE5hbWUpIHtcbiAgICAgICAgdmFyIG5vZGVOYW1lcyA9IHNoZWV0TmFtZS5zcGxpdChcIi1cIik7XG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc291cmNlOiBub2RlTmFtZXNbMF0sXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbW9kZWw7XG59XG5cbmZ1bmN0aW9uIE1vZGVsKCkge1xuICAgIHRoaXMubm9kZUdyb3VwcyA9IHt9O1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gTm9kZUdyb3VwcygpIHtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gTm9kZUdyb3VwKG5hbWUsIGxhYmVsUHJvcGVydHlOYW1lKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLmxhYmVsUHJvcGVydHlOYW1lID0gbGFiZWxQcm9wZXJ0eU5hbWU7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBOb2RlKHByb3BlcnRpZXMpIHtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIHRoaXMucmVmcyA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBSZWYodGFyZ2V0Tm9kZSwgbGFiZWwpIHtcbiAgICB0aGlzLnRhcmdldE5vZGUgPSB0YXJnZXROb2RlO1xuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuTm9kZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAkLmVhY2godGhpcy5wcm9wZXJ0aWVzLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAocHJvcGVydHkubmFtZSA9PSBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gTm9kZVByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcbiAgICAvLyBHZXQgc2hlZXQgY291bnRcbiAgICBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhpbmZvKSB7XG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xuICAgICAgICBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pIHtcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gbmV3IFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBpbmZvLnRpdGxlKTtcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGluZm8uc2hlZXRDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBpbmZvLnNoZWV0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBzaGVldCA9IHNwcmVhZHNoZWV0LnNoZWV0c1tyZXNwb25zZS5mZWVkLnRpdGxlLiR0XSA9IG5ldyBTaGVldCgpO1xuXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGUuZ3MkY2VsbC5yb3cgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0gbmV3IFJvdyhpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdLnJvd0NlbGxzLnB1c2gobmV3IFJvd0NlbGwoZS5ncyRjZWxsLmNvbCAtIDEsIGUuY29udGVudC4kdCkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFNvcnQgcm93IGNlbGxzIGJ5IGNvbCBpbmRleFxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIHJvdy5yb3dDZWxscy5zb3J0KGZ1bmN0aW9uKGMxLCBjMikgeyByZXR1cm4gYzEuY29sSW5kZXggLSBjMi5jb2xJbmRleDsgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4vLyAgICBmdW5jdGlvbiBsb2FkU2V0dGluZ3NTaGVldChzZXR0aW5nc1NoZWV0LCBzcHJlYWRzaGVldCkge1xuLy8gICAgICAgIC8vIE1hcCBjZWxscyB0byBsaXN0XG4vLyAgICAgICAgdmFyIHNldHRpbmdzTGlzdCA9IHt9O1xuLy8gICAgICAgICQuZWFjaChzZXR0aW5nc1NoZWV0LmZlZWQuZW50cnksIGZ1bmN0aW9uKGksIGUpIHtcbi8vICAgICAgICAgICAgaWYgKHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XSA9PSBudWxsKVxuLy8gICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddID0ge307XG4vL1xuLy8gICAgICAgICAgICBpZiAoZS5ncyRjZWxsLmNvbCA9PSAxKVxuLy8gICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddLmtleSA9IGUuY29udGVudC4kdDtcbi8vICAgICAgICAgICAgZWxzZVxuLy8gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5jb2wgPT0gMilcbi8vICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10udmFsdWUgPSBlLmNvbnRlbnQuJHQ7XG4vLyAgICAgICAgfSk7XG4vL1xuLy8gICAgICAgIC8vIE1hcCBsaXN0IHRvIG9iamVjdFxuLy8gICAgICAgICQuZWFjaChzZXR0aW5nc0xpc3QsIGZ1bmN0aW9uKGksIHMpIHtcbi8vICAgICAgICAgICAgaWYgKChzLmtleSA9PSBudWxsKSB8fCAocy52YWx1ZSA9PSBudWxsKSlcbi8vICAgICAgICAgICAgICAgIHJldHVybjtcbi8vXG4vLyAgICAgICAgICAgIC8vIENyZWF0ZSBpbm5lciBvYmplY3RzXG4vLyAgICAgICAgICAgIHZhciBwYXRoID0gcy5rZXkuc3BsaXQoXCIuXCIpO1xuLy8gICAgICAgICAgICB2YXIgY3VycmVudCA9IHNwcmVhZHNoZWV0LnNldHRpbmdzO1xuLy8gICAgICAgICAgICAkLmVhY2gocGF0aCwgZnVuY3Rpb24oaiwgaykge1xuLy8gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRba10gPT0gbnVsbCkge1xuLy8gICAgICAgICAgICAgICAgICAgIGlmIChqID09IHBhdGgubGVuZ3RoIC0gMSlcbi8vICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IHMudmFsdWU7XG4vLyAgICAgICAgICAgICAgICAgICAgZWxzZVxuLy8gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50W2tdID0ge307XG4vLyAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtrXTtcbi8vICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgfSk7XG4vLyAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgb25TdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvY2VsbHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL1wiICsgc2hlZXRJbmRleCArIFwiL3B1YmxpYy92YWx1ZXM/YWx0PWpzb24taW4tc2NyaXB0XCIsXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IG9uU3VjY2Vzc1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIG9uU3VjY2Vzcykge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvcHVibGljL2Z1bGw/YWx0PWpzb24taW4tc2NyaXB0XCIsXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0Q291bnQ6IHJlc3BvbnNlLmZlZWQuZW50cnkubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogcmVzcG9uc2UuZmVlZC50aXRsZS4kdFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgb25TdWNjZXNzKGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCB0aXRsZSkge1xuICAgIHRoaXMua2V5ID0gc3ByZWFkc2hlZXRLZXk7XG4gICAgdGhpcy50aXRsZSA9IHRpdGxlO1xuICAgIHRoaXMuc2hlZXRzID0gbmV3IFNoZWV0cygpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIFNoZWV0cygpIHtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gU2hlZXQoKSB7XG4gICAgdGhpcy5yb3dzID0gW107XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblNoZWV0LnByb3RvdHlwZS5oZWFkZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yb3dzWzBdLnZhbHVlcygpO1xufVxuXG5TaGVldC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihyb3csIGNvbE5hbWUpIHtcbiAgICB2YXIgY29sSW5kZXggPSB0aGlzLmhlYWRlcigpLmluZGV4T2YoY29sTmFtZSk7XG4gICAgaWYgKGNvbEluZGV4ID09IC0xKVxuICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgICQuZWFjaChyb3cucm93Q2VsbHMsIGZ1bmN0aW9uKGksIHJvd0NlbGwpIHtcbiAgICAgICAgaWYgKHJvd0NlbGwuY29sSW5kZXggPT0gY29sSW5kZXgpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJvd0NlbGwudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIFJvdyhyb3dJbmRleCkge1xuICAgIHRoaXMucm93SW5kZXggPSByb3dJbmRleDtcbiAgICB0aGlzLnJvd0NlbGxzID0gW107XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuUm93LnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJC5tYXAodGhpcy5yb3dDZWxscywgZnVuY3Rpb24ocm93Q2VsbCwgaSkge1xuICAgICAgICByZXR1cm4gcm93Q2VsbC52YWx1ZTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gUm93Q2VsbChjb2xJbmRleCwgdmFsdWUpIHtcbiAgICB0aGlzLmNvbEluZGV4ID0gY29sSW5kZXg7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xufSJdfQ==
