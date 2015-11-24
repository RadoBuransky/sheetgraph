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

        var zoom = d3.behavior.zoom()
            .on("zoom", rescale);

        var svg = d3.select("#" + svgContainerId)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%");

        var defs = svg.append("defs")

        defs.append("marker")
            .attr("class", "link")
            .attr("id", "markerEnd")
            .attr("viewBox", "0 0 30 20")
            .attr("refX", 58)
            .attr("refY", 10)
            .attr("markerWidth", 20)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 30 10 L 0 20");

        defs.append("marker")
            .attr("class", "link")
            .attr("id", "markerStart")
            .attr("viewBox", "0 0 30 20")
            .attr("refX", -30)
            .attr("refY", 10)
            .attr("markerWidth", 20)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 30 0 L 0 10 L 30 20");

        svg = svg.append("g")
            .call(zoom);

        var rect = svg.append("rect")
                    .attr("width", width)
                    .attr("height", height)
                    .style("fill", "none")
                    .style("pointer-events", "all");

        d3sheet.svg = svg.append("g");

        d3.select("#" + infoContainerId)
            .append("div");

        return d3sheet;
    }

    function rescale() {
      var trans = d3.event.translate;
      var scale = d3.event.scale;

      d3sheet.svg.attr("transform",
          "translate(" + trans + ")"
          + " scale(" + scale + ")");
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
            var force = forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info, d3sheet.model.settings);

            // Initialize view options
//            var viewModule = require("./view");
//            viewModule(d3sheet.model, updateGraph);
//
//            function updateGraph(viewOptions) {
//                // TODO: update d3sheet.graph and force.restart()
//            }

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
module.exports = function(graph, svgContainerId, svg, info, settings) {
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
        .linkDistance(170) // TODO: Move to settings
        .charge(-5000) // TODO: Move to settings
        .gravity(0.3) // TODO: Move to settings
        .nodes(graph.nodes)
        .links(graph.links)
        .on("tick", onTick);

    var drag = force.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    this.restart = restart
    restart();

    function dragstarted(d) {
       d3.event.sourceEvent.stopPropagation();
       d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
       d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
       d3.select(this).classed("dragging", false);
    }

    function restart() {

        svg.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("marker-end", linkMarkerEnd)
            .attr("marker-start", linkMarkerStart);

        svg.selectAll(".link-label")
            .data(graph.links)
            .enter()
            .append("text")
            .text(function(graphLink) { return graphLink.label; })
            .attr("class", "link-label")
            .attr("text-anchor", "middle");

        svg.selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("circle")
            .attr("class", nodeClass)
            .attr("r", 20) // TODO: Settings
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
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
            .text(function(graphNode) { return graphNode.node.label(); })
            .call(force.drag)
            .on("click", nodeClick);

        selectAll();
        force.start();
    }

    function linkMarkerEnd(graphLink) {
        if (graphLink.toTarget)
            return "url(#markerEnd)";

        return "none";
    }

    function linkMarkerStart(graphLink) {
        if (graphLink.toSource)
            return "url(#markerStart)";

        return "none";
    }

    function nodeClass(graphNode) {
        return "node " + graphNode.node.nodeGroup.name;
    }

    function nodeClick(graphNode) {
        info.showNode(graphNode.node, nodeFillColor(graphNode));
    }

    function nodeFillColor(graphNode) {
        return settings.css.get(graphNode.node.nodeGroup.name + ".fill", colors(graphNode.node.nodeGroup.name));
    }

    function selectAll() {
        node = svg.selectAll(".node");
        nodeLabel = svg.selectAll(".node-label");
        link = svg.selectAll(".link");
        linkLabel = svg.selectAll(".link-label");
    }

    function onTick() {
//        link.attr("x1", function(d) { return d.source.x; })
//            .attr("y1", function(d) { return d.source.y; })
//            .attr("x2", function(d) { return d.target.x; })
//            .attr("y2", function(d) { return d.target.y; });
        link.attr("d", linkArc);

        linkLabel
            .attr("x", function(d) {
                return (d.source.x + d.target.x)/2; })
            .attr("y", function(d) {
                return (d.source.y + d.target.y)/2; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        nodeLabel
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y;
        return "M" + d.source.x + " " + d.source.y + "L " + d.target.x + "," + d.target.y;
    }

    return this;
}
},{}],3:[function(require,module,exports){
module.exports = function(model) {
    var graph = new Graph();

    // For all sheets
    $.each(model.nodeGroups.items, function(i, nodeGroup) {
        // For all nodes
        $.each(nodeGroup.nodes, function(j, node) {
            // Add node to graph
            var graphNode = new GraphNode(node);
            graph.nodes.push(graphNode);
        });
    });

    // Create links
    $.each(graph.nodes, function(i, graphNode) {
        $.each(graphNode.node.refs, function(j, ref) {
            graph.links.push(new GraphLink(graphNode, getGraphNode(ref.targetNode), ref.label, ref.toTarget, ref.toSource));
        });
    });

    function getGraphNode(node) {
        var result = null;
        $.each(graph.nodes, function(i, graphNode) {
            if (graphNode.node == node) {
                result = graphNode;
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

function GraphNode(node) {
    this.node = node;
    return this;
}

function GraphLink(source, target, label, toTarget, toSource) {
    this.source = source;
    this.target = target;
    this.label = label;
    this.toSource = toSource;
    this.toTarget = toTarget;
    return this;
}
},{}],4:[function(require,module,exports){
module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node, fillColor) {
        $("#d3sheet-node-info h2").text(node.heading());
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.nodeGroup.name);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        $.each(node.properties, function(i, nodeProperty) {
            if (!nodeProperty.isHidden)
                addProperty(nodeProperty.name, nodeProperty.value);
        });

        // Group node links
        var groupedLinks = {};
        $.each(node.refs, function(i, ref) {
            var linkName = ref.targetNode.nodeGroup.name;

            if (groupedLinks[linkName] == null)
                groupedLinks[linkName] = [];

            groupedLinks[linkName].push(ref.targetNode.heading());
        });

        // Show node links
        var linkNames = Object.keys(groupedLinks);
        $.each(linkNames, function(i, linkName) {
            addProperty(linkName, groupedLinks[linkName].join(", "));
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
    model.nodeGroups = getNodeGroups(spreadsheet, nodeGroupTypes.nodeGroupNames, nodeGroupTypes.refSheetNames);
    if (nodeGroupTypes.settingsGroupName != null)
        model.settings = getSettings(spreadsheet.sheets[nodeGroupTypes.settingsGroupName]);

    function getSettings(settingsSheet) {
        var settings = new Settings();

        $.each(settingsSheet.rows, function(i, row) {
            var key = row.rowCells[0].value,
                value = row.rowCells[1].value;

            if ((key == null) || (value == null))
                return;

            var path = key.split(".");
            var current = settings;
            $.each(path, function(j, k) {
                if (current[k] == null) {
                    if (j == path.length - 1)
                        current[k] = value;
                    else
                        current[k] = new Settings();
                }
                current = current[k];
            });
        });

        return settings;
    }

    function getNodeGroups(spreadsheet, nodeGroupNames, refSheetNames) {
        // Create nodes with properties
        var nodeGroups = new NodeGroups();
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            nodeGroups.items.push(getNodes(spreadsheet.sheets[nodeGroupName], nodeGroupName));
        });

        // Create references from node sheets
        $.each(nodeGroups.items, function(i, nodeGroup) {
            createRefs(nodeGroups, spreadsheet.sheets[nodeGroup.name], nodeGroup);
        });

        // Create references from reference sheets
        $.each(refSheetNames, function(i, refSheetName) {
            createSheetRefs(nodeGroups, spreadsheet.sheets[refSheetName.name], refSheetName);
        });

        function createSheetRefs(nodeGroups, refSheet, refSheetName) {
            var colNames = refSheet.header();

            // For all sheet rows
            $.each(refSheet.rows, function(i, row) {
                if (i == 0)
                    return;

                var source = getRefToNodeGroup(nodeGroups, refSheet, row, refSheetName.source);
                var target = getRefToNodeGroup(nodeGroups, refSheet, row, refSheetName.target);
                if ((source != null) &&
                    (target != null)) {
                    var label = target.label;
                    if (((target.label == null) ||
                        (target.label == "")) &&
                        (row.rowCells[0].colIndex == 0)) {
                            label = row.rowCells[0].value;
                        }

                    $.each(source.nodes, function(j, sourceRef) {
                        $.each(target.nodes, function(k, targetRef) {
                            sourceRef.targetNode.refs.push(new Ref(targetRef.targetNode, label));
                        });
                    });
                }
            });
        }

        function getRefToNodeGroup(nodeGroups, sheet, row, nodeGroupName) {
            var result = null;
            var colNames = sheet.header();
            $.each(colNames, function(j, colName) {
                var value = sheet.value(row, colName);
                if (value == null)
                    return;

                var refTarget = parseColumnRefName(colName, nodeGroups);
                if ((refTarget != null) &&
                    (refTarget.nodeGroup.name == nodeGroupName)) {
                    result = refTarget;
                    result.nodes = [];

                    // Find index of the target node
                    $.each(refTarget.nodeGroup.nodes, function(k, targetNode) {
                        // If target node property value matches
                        if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                            result.nodes.push(new Ref(targetNode, refTarget.label, refTarget.toTarget,refTarget.toSource));
                        }
                    });

                    return false;
                }
            });
            return result;
        }

        function createRefs(nodeGroups, nodeSheet, nodeGroup) {
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
                        $.each(refTarget.nodeGroup.nodes, function(k, targetNode) {
                            // If target node property value matches
                            // TODO: We should properly split values using comma
                            if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                                nodeGroup.nodes[i - 1].refs.push(new Ref(targetNode, refTarget.label, refTarget.toTarget, refTarget.toSource));
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
                result.nodes.push(new Node(getNodeProperties(row, header), result));
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
                nodeGroupTypes.refSheetNames.push(refSheet);
                return;
            }

            nodeGroupTypes.nodeGroupNames.push(sheetName);
        });

        return nodeGroupTypes;
    }

    function parseColumnRefName(colName, nodeGroups) {
        var toTarget = (colName.slice(0, 2) == "->");
        var toSource = (colName.slice(0, 2) == "<-");
        var refNames = colName.replace("->", "").replace("<-", "").split(".");
        var nodeGroup = null;
        if (refNames.length > 0)
            nodeGroup = nodeGroups.getByName(refNames[0]);
        if ((refNames.length >= 2) &&
            (nodeGroup != null)) {
            var result = {
                nodeGroup: nodeGroup,
                propertyName: refNames[1],
                toTarget: toTarget,
                toSource: toSource
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
                name: sheetName,
                source: nodeNames[0],
                target: nodeNames[1]
            };
        }

        return null;
    }

    return model;
}

function Model() {
    this.nodeGroups = new NodeGroups();
    this.settings = {};
    return this;
}

function NodeGroups() {
    this.items = [];
    return this;
}

NodeGroups.prototype.getByName = function(nodeGroupName) {
    var result = null;
    $.each(this.items, function(i, nodeGroup) {
        if (nodeGroup.name == nodeGroupName) {
            result = nodeGroup;
            return false;
        }
    });
    return result;
}

function NodeGroup(name, labelPropertyName) {
    this.name = name;
    this.labelPropertyName = labelPropertyName;
    this.nodes = [];
    return this;
}

function Node(properties, nodeGroup) {
    this.properties = properties;
    this.refs = [];
    this.nodeGroup = nodeGroup;
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

Node.prototype.label = function() {
    return this.value(this.nodeGroup.labelPropertyName);
}

Node.prototype.heading = function() {
    var result = "";
    $.each(this.properties, function(i, property) {
        if (property.isHeading) {
            result = property.value;
            return false;
        }
    });

    if (result != "")
        return result;

    return this.label();
}

function NodeProperty(name, value) {
    this.name = name.replace("*", "").replace("#", "");
    this.value = value;
    this.isHeading = (name.slice(0, 1) == "*");
    this.isHidden = (name.slice(0, 1) == "#");
    return this;
}

function Ref(targetNode, label, toTarget, toSource) {
    this.targetNode = targetNode;
    this.label = label;
    this.toTarget = toTarget;
    this.toSource = toSource;
    return this;
}

function Settings() {
    return this;
}

Settings.prototype.get = function(key, defaultValue) {
    var parts = key.split(".");
    if (parts.length > 1) {
        if (this[parts[0]] == null)
            return defaultValue;

        return this[parts[0]].get(parts.splice(1, parts.length - 1).join("."), defaultValue);
    }

    if (this[key] == null)
        return defaultValue;

    return this[key];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcclxuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XHJcblxyXG4gICAgdmFyIGQzc2hlZXQgPSB7XHJcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXHJcbiAgICAgICAgc3ZnQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgaW5mb0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIHN2Zzoge30sXHJcbiAgICAgICAgc3ByZWFkc2hlZXQ6IHt9LFxyXG4gICAgICAgIG1vZGVsOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXHJcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XHJcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIHN2Z0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LXN2Z1wiO1xyXG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcclxuXHJcbiAgICAgICAgaWYgKGluZm9Db250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xyXG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgICAgICB2YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKVxyXG4gICAgICAgICAgICAub24oXCJ6b29tXCIsIHJlc2NhbGUpO1xyXG5cclxuICAgICAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpO1xyXG5cclxuICAgICAgICB2YXIgZGVmcyA9IHN2Zy5hcHBlbmQoXCJkZWZzXCIpXHJcblxyXG4gICAgICAgIGRlZnMuYXBwZW5kKFwibWFya2VyXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJtYXJrZXJFbmRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiMCAwIDMwIDIwXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwicmVmWFwiLCA1OClcclxuICAgICAgICAgICAgLmF0dHIoXCJyZWZZXCIsIDEwKVxyXG4gICAgICAgICAgICAuYXR0cihcIm1hcmtlcldpZHRoXCIsIDIwKVxyXG4gICAgICAgICAgICAuYXR0cihcIm1hcmtlckhlaWdodFwiLCAzMClcclxuICAgICAgICAgICAgLmF0dHIoXCJvcmllbnRcIiwgXCJhdXRvXCIpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBcIk0gMCAwIEwgMzAgMTAgTCAwIDIwXCIpO1xyXG5cclxuICAgICAgICBkZWZzLmFwcGVuZChcIm1hcmtlclwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxyXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIFwibWFya2VyU3RhcnRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiMCAwIDMwIDIwXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwicmVmWFwiLCAtMzApXHJcbiAgICAgICAgICAgIC5hdHRyKFwicmVmWVwiLCAxMClcclxuICAgICAgICAgICAgLmF0dHIoXCJtYXJrZXJXaWR0aFwiLCAyMClcclxuICAgICAgICAgICAgLmF0dHIoXCJtYXJrZXJIZWlnaHRcIiwgMzApXHJcbiAgICAgICAgICAgIC5hdHRyKFwib3JpZW50XCIsIFwiYXV0b1wiKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgXCJNIDMwIDAgTCAwIDEwIEwgMzAgMjBcIik7XHJcblxyXG4gICAgICAgIHN2ZyA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgICAgIC5jYWxsKHpvb20pO1xyXG5cclxuICAgICAgICB2YXIgcmVjdCA9IHN2Zy5hcHBlbmQoXCJyZWN0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIilcclxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcImFsbFwiKTtcclxuXHJcbiAgICAgICAgZDNzaGVldC5zdmcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcclxuXHJcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gZDNzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZXNjYWxlKCkge1xyXG4gICAgICB2YXIgdHJhbnMgPSBkMy5ldmVudC50cmFuc2xhdGU7XHJcbiAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnNjYWxlO1xyXG5cclxuICAgICAgZDNzaGVldC5zdmcuYXR0cihcInRyYW5zZm9ybVwiLFxyXG4gICAgICAgICAgXCJ0cmFuc2xhdGUoXCIgKyB0cmFucyArIFwiKVwiXHJcbiAgICAgICAgICArIFwiIHNjYWxlKFwiICsgc2NhbGUgKyBcIilcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xyXG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcclxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcclxuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coc3ByZWFkc2hlZXQpO1xyXG5cclxuICAgICAgICAgICAgZDNzaGVldC5zcHJlYWRzaGVldCA9IHNwcmVhZHNoZWV0O1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBkb2N1bWVudC50aXRsZSA9IHNwcmVhZHNoZWV0LnRpdGxlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cclxuICAgICAgICAgICAgdmFyIGluZm9Nb2R1bGUgPSByZXF1aXJlKFwiLi9pbmZvXCIpO1xyXG4gICAgICAgICAgICB2YXIgaW5mbyA9IGluZm9Nb2R1bGUoZDNzaGVldC5pbmZvQ29udGFpbmVySWQsIHNwcmVhZHNoZWV0LnRpdGxlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgICAgIHZhciBtb2RlbE1vZHVsZSA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0Lm1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBncmFwaCBmcm9tIG1vZGVsXHJcbiAgICAgICAgICAgIHZhciBncmFwaE1vZHVsZSA9IHJlcXVpcmUoXCIuL2dyYXBoXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGhNb2R1bGUoZDNzaGVldC5tb2RlbCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0LmdyYXBoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBEMyBmb3JjZSBsYXlvdXQgZnJvbSBncmFwaFxyXG4gICAgICAgICAgICB2YXIgZm9yY2VNb2R1bGUgPSByZXF1aXJlKFwiLi9mb3JjZVwiKTtcclxuICAgICAgICAgICAgdmFyIGZvcmNlID0gZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8sIGQzc2hlZXQubW9kZWwuc2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB2aWV3IG9wdGlvbnNcclxuLy8gICAgICAgICAgICB2YXIgdmlld01vZHVsZSA9IHJlcXVpcmUoXCIuL3ZpZXdcIik7XHJcbi8vICAgICAgICAgICAgdmlld01vZHVsZShkM3NoZWV0Lm1vZGVsLCB1cGRhdGVHcmFwaCk7XHJcbi8vXHJcbi8vICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlR3JhcGgodmlld09wdGlvbnMpIHtcclxuLy8gICAgICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIGQzc2hlZXQuZ3JhcGggYW5kIGZvcmNlLnJlc3RhcnQoKVxyXG4vLyAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFwcGx5IENTUyBzdHlsZVxyXG4gICAgICAgICAgICBhcHBseUNzcyhkM3NoZWV0Lm1vZGVsLnNldHRpbmdzLmNzcyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlDc3MoY3NzKSB7XHJcbiAgICAgICAgaWYgKGNzcyA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBhbGwgZWxlbWVudCBzZWxlY3RvcnNcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gT2JqZWN0LmtleXMoY3NzKTtcclxuICAgICAgICAkLmVhY2goc2VsZWN0b3JzLCBmdW5jdGlvbihpLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSB7fTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgLy8gSXQgaXMgYW4gaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgaXMgYSBjbGFzc1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKFwiLlwiICsgc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzdHlsZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoY3NzW3NlbGVjdG9yXSk7XHJcbiAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihqLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMuY3NzKHByb3BlcnR5LCBjc3Nbc2VsZWN0b3JdW3Byb3BlcnR5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcclxuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgfVxyXG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbywgc2V0dGluZ3MpIHtcclxuICAgIHZhciBub2RlID0gW10sXHJcbiAgICAgICAgbm9kZUxhYmVsID0gW10sXHJcbiAgICAgICAgbGluayA9IFtdLFxyXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdLFxyXG4gICAgICAgIGNvbG9ycyA9IGQzLnNjYWxlLmNhdGVnb3J5MjAoKTtcclxuXHJcbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICBzZWxlY3RBbGwoKTtcclxuXHJcbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxyXG4gICAgICAgIC5zaXplKFt3aWR0aCwgaGVpZ2h0XSlcclxuICAgICAgICAubGlua0Rpc3RhbmNlKDE3MCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5jaGFyZ2UoLTUwMDApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuZ3Jhdml0eSgwLjMpIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgIC5vbihcInRpY2tcIiwgb25UaWNrKTtcclxuXHJcbiAgICB2YXIgZHJhZyA9IGZvcmNlLmRyYWcoKVxyXG4gICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSlcclxuICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZHJhZ3N0YXJ0ZWQpXHJcbiAgICAgICAgLm9uKFwiZHJhZ1wiLCBkcmFnZ2VkKVxyXG4gICAgICAgIC5vbihcImRyYWdlbmRcIiwgZHJhZ2VuZGVkKTtcclxuXHJcbiAgICB0aGlzLnJlc3RhcnQgPSByZXN0YXJ0XHJcbiAgICByZXN0YXJ0KCk7XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ3N0YXJ0ZWQoZCkge1xyXG4gICAgICAgZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICBkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImRyYWdnaW5nXCIsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYWdnZWQoZCkge1xyXG4gICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJjeFwiLCBkLnggPSBkMy5ldmVudC54KS5hdHRyKFwiY3lcIiwgZC55ID0gZDMuZXZlbnQueSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ2VuZGVkKGQpIHtcclxuICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHJhZ2dpbmdcIiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RhcnQoKSB7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJtYXJrZXItZW5kXCIsIGxpbmtNYXJrZXJFbmQpXHJcbiAgICAgICAgICAgIC5hdHRyKFwibWFya2VyLXN0YXJ0XCIsIGxpbmtNYXJrZXJTdGFydCk7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZ3JhcGhMaW5rKSB7IHJldHVybiBncmFwaExpbmsubGFiZWw7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIik7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIG5vZGVDbGFzcylcclxuICAgICAgICAgICAgLmF0dHIoXCJyXCIsIDIwKSAvLyBUT0RPOiBTZXR0aW5nc1xyXG4gICAgICAgICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBub2RlRmlsbENvbG9yKVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxyXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xyXG5cclxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLm5vZGUtbGFiZWxcIilcclxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgICAgIC5lbnRlcigpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGdyYXBoTm9kZSkgeyByZXR1cm4gZ3JhcGhOb2RlLm5vZGUubGFiZWwoKTsgfSlcclxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcclxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcclxuXHJcbiAgICAgICAgc2VsZWN0QWxsKCk7XHJcbiAgICAgICAgZm9yY2Uuc3RhcnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsaW5rTWFya2VyRW5kKGdyYXBoTGluaykge1xyXG4gICAgICAgIGlmIChncmFwaExpbmsudG9UYXJnZXQpXHJcbiAgICAgICAgICAgIHJldHVybiBcInVybCgjbWFya2VyRW5kKVwiO1xyXG5cclxuICAgICAgICByZXR1cm4gXCJub25lXCI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbGlua01hcmtlclN0YXJ0KGdyYXBoTGluaykge1xyXG4gICAgICAgIGlmIChncmFwaExpbmsudG9Tb3VyY2UpXHJcbiAgICAgICAgICAgIHJldHVybiBcInVybCgjbWFya2VyU3RhcnQpXCI7XHJcblxyXG4gICAgICAgIHJldHVybiBcIm5vbmVcIjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBub2RlQ2xhc3MoZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIFwibm9kZSBcIiArIGdyYXBoTm9kZS5ub2RlLm5vZGVHcm91cC5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVDbGljayhncmFwaE5vZGUpIHtcclxuICAgICAgICBpbmZvLnNob3dOb2RlKGdyYXBoTm9kZS5ub2RlLCBub2RlRmlsbENvbG9yKGdyYXBoTm9kZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVGaWxsQ29sb3IoZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIHNldHRpbmdzLmNzcy5nZXQoZ3JhcGhOb2RlLm5vZGUubm9kZUdyb3VwLm5hbWUgKyBcIi5maWxsXCIsIGNvbG9ycyhncmFwaE5vZGUubm9kZS5ub2RlR3JvdXAubmFtZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNlbGVjdEFsbCgpIHtcclxuICAgICAgICBub2RlID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpO1xyXG4gICAgICAgIG5vZGVMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKTtcclxuICAgICAgICBsaW5rID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpO1xyXG4gICAgICAgIGxpbmtMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblRpY2soKSB7XHJcbi8vICAgICAgICBsaW5rLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS54OyB9KVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcclxuLy8gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lng7IH0pXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC55OyB9KTtcclxuICAgICAgICBsaW5rLmF0dHIoXCJkXCIsIGxpbmtBcmMpO1xyXG5cclxuICAgICAgICBsaW5rTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnkgKyBkLnRhcmdldC55KS8yOyB9KTtcclxuXHJcbiAgICAgICAgbm9kZVxyXG4gICAgICAgICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pO1xyXG5cclxuICAgICAgICBub2RlTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbGlua0FyYyhkKSB7XHJcbiAgICAgICAgdmFyIGR4ID0gZC50YXJnZXQueCAtIGQuc291cmNlLngsXHJcbiAgICAgICAgICAgIGR5ID0gZC50YXJnZXQueSAtIGQuc291cmNlLnk7XHJcbiAgICAgICAgcmV0dXJuIFwiTVwiICsgZC5zb3VyY2UueCArIFwiIFwiICsgZC5zb3VyY2UueSArIFwiTCBcIiArIGQudGFyZ2V0LnggKyBcIixcIiArIGQudGFyZ2V0Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XHJcbiAgICB2YXIgZ3JhcGggPSBuZXcgR3JhcGgoKTtcclxuXHJcbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xyXG4gICAgJC5lYWNoKG1vZGVsLm5vZGVHcm91cHMuaXRlbXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cCkge1xyXG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEFkZCBub2RlIHRvIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBncmFwaE5vZGUgPSBuZXcgR3JhcGhOb2RlKG5vZGUpO1xyXG4gICAgICAgICAgICBncmFwaC5ub2Rlcy5wdXNoKGdyYXBoTm9kZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgbGlua3NcclxuICAgICQuZWFjaChncmFwaC5ub2RlcywgZnVuY3Rpb24oaSwgZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgJC5lYWNoKGdyYXBoTm9kZS5ub2RlLnJlZnMsIGZ1bmN0aW9uKGosIHJlZikge1xyXG4gICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKG5ldyBHcmFwaExpbmsoZ3JhcGhOb2RlLCBnZXRHcmFwaE5vZGUocmVmLnRhcmdldE5vZGUpLCByZWYubGFiZWwsIHJlZi50b1RhcmdldCwgcmVmLnRvU291cmNlKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRHcmFwaE5vZGUobm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBudWxsO1xyXG4gICAgICAgICQuZWFjaChncmFwaC5ub2RlcywgZnVuY3Rpb24oaSwgZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgICAgIGlmIChncmFwaE5vZGUubm9kZSA9PSBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBncmFwaE5vZGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBncmFwaDtcclxufVxyXG5cclxuZnVuY3Rpb24gR3JhcGgoKSB7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICB0aGlzLmxpbmtzID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gR3JhcGhOb2RlKG5vZGUpIHtcclxuICAgIHRoaXMubm9kZSA9IG5vZGU7XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gR3JhcGhMaW5rKHNvdXJjZSwgdGFyZ2V0LCBsYWJlbCwgdG9UYXJnZXQsIHRvU291cmNlKSB7XHJcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcclxuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xyXG4gICAgdGhpcy50b1NvdXJjZSA9IHRvU291cmNlO1xyXG4gICAgdGhpcy50b1RhcmdldCA9IHRvVGFyZ2V0O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluZm9Db250YWluZXJJZCwgdGl0bGUpIHtcclxuICAgIC8vIFNldCBoZWFkaW5nXHJcbiAgICAkKFwiI1wiICsgaW5mb0NvbnRhaW5lcklkICsgXCIgaDFcIikudGV4dCh0aXRsZSk7XHJcblxyXG4gICAgdGhpcy5zaG93Tm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGZpbGxDb2xvcikge1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmhlYWRpbmcoKSk7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLXNoZWV0LW5hbWVcIikudGV4dChub2RlLm5vZGVHcm91cC5uYW1lKTtcclxuXHJcbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcclxuICAgICAgICB1bC5lbXB0eSgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xyXG4gICAgICAgICQuZWFjaChub2RlLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIG5vZGVQcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVQcm9wZXJ0eS5pc0hpZGRlbilcclxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnR5KG5vZGVQcm9wZXJ0eS5uYW1lLCBub2RlUHJvcGVydHkudmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHcm91cCBub2RlIGxpbmtzXHJcbiAgICAgICAgdmFyIGdyb3VwZWRMaW5rcyA9IHt9O1xyXG4gICAgICAgICQuZWFjaChub2RlLnJlZnMsIGZ1bmN0aW9uKGksIHJlZikge1xyXG4gICAgICAgICAgICB2YXIgbGlua05hbWUgPSByZWYudGFyZ2V0Tm9kZS5ub2RlR3JvdXAubmFtZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChncm91cGVkTGlua3NbbGlua05hbWVdID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdID0gW107XHJcblxyXG4gICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdLnB1c2gocmVmLnRhcmdldE5vZGUuaGVhZGluZygpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU2hvdyBub2RlIGxpbmtzXHJcbiAgICAgICAgdmFyIGxpbmtOYW1lcyA9IE9iamVjdC5rZXlzKGdyb3VwZWRMaW5rcyk7XHJcbiAgICAgICAgJC5lYWNoKGxpbmtOYW1lcywgZnVuY3Rpb24oaSwgbGlua05hbWUpIHtcclxuICAgICAgICAgICAgYWRkUHJvcGVydHkobGlua05hbWUsIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0uam9pbihcIiwgXCIpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdWwuYXBwZW5kKFwiPGxpPjxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktbmFtZVxcXCI+XCIgKyBuYW1lICtcclxuICAgICAgICAgICAgICAgIFwiOjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcImQzc2hlZXQtbm9kZS1wcm9wZXJ0eS12YWx1ZVxcXCI+XCIgKyBmb3JtYXRWYWx1ZSh2YWx1ZSkgKyBcIjwvc3Bhbj48L2xpPlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSgwLCBcIjRcIikudG9Mb3dlckNhc2UoKSA9PSBcImh0dHBcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIjxhIGhyZWY9XFxcIlwiICsgdmFsdWUgKyBcIlxcXCI+XCIgKyB2YWx1ZSArIFwiPC9hPlwiXHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xyXG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKCk7XHJcblxyXG4gICAgdmFyIG5vZGVHcm91cFR5cGVzID0gZ2V0Tm9kZUdyb3VwVHlwZXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgbW9kZWwubm9kZUdyb3VwcyA9IGdldE5vZGVHcm91cHMoc3ByZWFkc2hlZXQsIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzLCBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzKTtcclxuICAgIGlmIChub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSAhPSBudWxsKVxyXG4gICAgICAgIG1vZGVsLnNldHRpbmdzID0gZ2V0U2V0dGluZ3Moc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cFR5cGVzLnNldHRpbmdzR3JvdXBOYW1lXSk7XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2V0dGluZ3Moc2V0dGluZ3NTaGVldCkge1xyXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IG5ldyBTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAkLmVhY2goc2V0dGluZ3NTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IHJvdy5yb3dDZWxsc1swXS52YWx1ZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gcm93LnJvd0NlbGxzWzFdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKChrZXkgPT0gbnVsbCkgfHwgKHZhbHVlID09IG51bGwpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBhdGggPSBrZXkuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IHNldHRpbmdzO1xyXG4gICAgICAgICAgICAkLmVhY2gocGF0aCwgZnVuY3Rpb24oaiwgaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRba10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChqID09IHBhdGgubGVuZ3RoIC0gMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IG5ldyBTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRba107XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMsIHJlZlNoZWV0TmFtZXMpIHtcclxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIG5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICBub2RlR3JvdXBzLml0ZW1zLnB1c2goZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSByZWZlcmVuY2VzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cC5uYW1lXSwgbm9kZUdyb3VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSByZWZlcmVuY2Ugc2hlZXRzXHJcbiAgICAgICAgJC5lYWNoKHJlZlNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHJlZlNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBjcmVhdGVTaGVldFJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW3JlZlNoZWV0TmFtZS5uYW1lXSwgcmVmU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlU2hlZXRSZWZzKG5vZGVHcm91cHMsIHJlZlNoZWV0LCByZWZTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gcmVmU2hlZXQuaGVhZGVyKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcclxuICAgICAgICAgICAgJC5lYWNoKHJlZlNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGdldFJlZlRvTm9kZUdyb3VwKG5vZGVHcm91cHMsIHJlZlNoZWV0LCByb3csIHJlZlNoZWV0TmFtZS5zb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGdldFJlZlRvTm9kZUdyb3VwKG5vZGVHcm91cHMsIHJlZlNoZWV0LCByb3csIHJlZlNoZWV0TmFtZS50YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChzb3VyY2UgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAodGFyZ2V0ICE9IG51bGwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gdGFyZ2V0LmxhYmVsO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgoKHRhcmdldC5sYWJlbCA9PSBudWxsKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAodGFyZ2V0LmxhYmVsID09IFwiXCIpKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAocm93LnJvd0NlbGxzWzBdLmNvbEluZGV4ID09IDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IHJvdy5yb3dDZWxsc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goc291cmNlLm5vZGVzLCBmdW5jdGlvbihqLCBzb3VyY2VSZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHRhcmdldC5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0UmVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VSZWYudGFyZ2V0Tm9kZS5yZWZzLnB1c2gobmV3IFJlZih0YXJnZXRSZWYudGFyZ2V0Tm9kZSwgbGFiZWwpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0UmVmVG9Ob2RlR3JvdXAobm9kZUdyb3Vwcywgc2hlZXQsIHJvdywgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gc2hlZXQuaGVhZGVyKCk7XHJcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gc2hlZXQudmFsdWUocm93LCBjb2xOYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVmVGFyZ2V0ID0gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChyZWZUYXJnZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAocmVmVGFyZ2V0Lm5vZGVHcm91cC5uYW1lID09IG5vZGVHcm91cE5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVmVGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ub2RlcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChyZWZUYXJnZXQubm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YodGFyZ2V0Tm9kZS52YWx1ZShyZWZUYXJnZXQucHJvcGVydHlOYW1lKSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2gobmV3IFJlZih0YXJnZXROb2RlLCByZWZUYXJnZXQubGFiZWwsIHJlZlRhcmdldC50b1RhcmdldCxyZWZUYXJnZXQudG9Tb3VyY2UpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVmcyhub2RlR3JvdXBzLCBub2RlU2hlZXQsIG5vZGVHcm91cCkge1xyXG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBub2RlU2hlZXQuaGVhZGVyKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbm9kZVNoZWV0LnZhbHVlKHJvdywgY29sTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHJlZmVyZW5jZSBjb2x1bW5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVmVGFyZ2V0ID0gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWZUYXJnZXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gocmVmVGFyZ2V0Lm5vZGVHcm91cC5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgbWF0Y2hlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3Blcmx5IHNwbGl0IHZhbHVlcyB1c2luZyBjb21tYVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YodGFyZ2V0Tm9kZS52YWx1ZShyZWZUYXJnZXQucHJvcGVydHlOYW1lKSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVHcm91cC5ub2Rlc1tpIC0gMV0ucmVmcy5wdXNoKG5ldyBSZWYodGFyZ2V0Tm9kZSwgcmVmVGFyZ2V0LmxhYmVsLCByZWZUYXJnZXQudG9UYXJnZXQsIHJlZlRhcmdldC50b1NvdXJjZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2Rlcyhub2RlU2hlZXQsIG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhlYWRlciA9IG5vZGVTaGVldC5oZWFkZXIoKTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlR3JvdXAobm9kZUdyb3VwTmFtZSwgaGVhZGVyWzBdKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaChuZXcgTm9kZShnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlciksIHJlc3VsdCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlcikge1xyXG4gICAgICAgICAgICB2YXIgbm9kZVByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWUgPSBoZWFkZXJbcm93Q2VsbC5jb2xJbmRleF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY29sTmFtZS5pbmRleE9mKFwiLlwiKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllcy5wdXNoKG5ldyBOb2RlUHJvcGVydHkoY29sTmFtZSwgcm93Q2VsbC52YWx1ZSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGVHcm91cHM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwVHlwZXMoc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSB7XHJcbiAgICAgICAgICAgIG5vZGVHcm91cE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgcmVmU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIHNldHRpbmdzR3JvdXBOYW1lOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0LnNoZWV0cyk7XHJcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lID09IFwic2V0dGluZ3NcIikge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgPSBzaGVldE5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVmU2hlZXQgPSBwYXJzZVJlZlNoZWV0TmFtZShzaGVldE5hbWUpXHJcbiAgICAgICAgICAgIGlmICgocmVmU2hlZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YocmVmU2hlZXQuc291cmNlKSA+IC0xKSAmJlxyXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC50YXJnZXQpID4gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzLnB1c2gocmVmU2hlZXQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5ub2RlR3JvdXBOYW1lcy5wdXNoKHNoZWV0TmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBUeXBlcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUNvbHVtblJlZk5hbWUoY29sTmFtZSwgbm9kZUdyb3Vwcykge1xyXG4gICAgICAgIHZhciB0b1RhcmdldCA9IChjb2xOYW1lLnNsaWNlKDAsIDIpID09IFwiLT5cIik7XHJcbiAgICAgICAgdmFyIHRvU291cmNlID0gKGNvbE5hbWUuc2xpY2UoMCwgMikgPT0gXCI8LVwiKTtcclxuICAgICAgICB2YXIgcmVmTmFtZXMgPSBjb2xOYW1lLnJlcGxhY2UoXCItPlwiLCBcIlwiKS5yZXBsYWNlKFwiPC1cIiwgXCJcIikuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBub2RlR3JvdXAgPSBudWxsO1xyXG4gICAgICAgIGlmIChyZWZOYW1lcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICBub2RlR3JvdXAgPSBub2RlR3JvdXBzLmdldEJ5TmFtZShyZWZOYW1lc1swXSk7XHJcbiAgICAgICAgaWYgKChyZWZOYW1lcy5sZW5ndGggPj0gMikgJiZcclxuICAgICAgICAgICAgKG5vZGVHcm91cCAhPSBudWxsKSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwOiBub2RlR3JvdXAsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IHJlZk5hbWVzWzFdLFxyXG4gICAgICAgICAgICAgICAgdG9UYXJnZXQ6IHRvVGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgdG9Tb3VyY2U6IHRvU291cmNlXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZWZOYW1lcy5sZW5ndGggPT0gMylcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5sYWJlbCA9IHJlZk5hbWVzWzJdO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlUmVmU2hlZXROYW1lKHNoZWV0TmFtZSkge1xyXG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xyXG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHNoZWV0TmFtZSxcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2RlbDtcclxufVxyXG5cclxuZnVuY3Rpb24gTW9kZWwoKSB7XHJcbiAgICB0aGlzLm5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgdGhpcy5zZXR0aW5ncyA9IHt9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVHcm91cHMoKSB7XHJcbiAgICB0aGlzLml0ZW1zID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuTm9kZUdyb3Vwcy5wcm90b3R5cGUuZ2V0QnlOYW1lID0gZnVuY3Rpb24obm9kZUdyb3VwTmFtZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAkLmVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgaWYgKG5vZGVHcm91cC5uYW1lID09IG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gbm9kZUdyb3VwO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlR3JvdXAobmFtZSwgbGFiZWxQcm9wZXJ0eU5hbWUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmxhYmVsUHJvcGVydHlOYW1lID0gbGFiZWxQcm9wZXJ0eU5hbWU7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZShwcm9wZXJ0aWVzLCBub2RlR3JvdXApIHtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XHJcbiAgICB0aGlzLnJlZnMgPSBbXTtcclxuICAgIHRoaXMubm9kZUdyb3VwID0gbm9kZUdyb3VwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbk5vZGUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24ocHJvcGVydHlOYW1lKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICQuZWFjaCh0aGlzLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XHJcbiAgICAgICAgaWYgKHByb3BlcnR5Lm5hbWUgPT0gcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5sYWJlbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWUodGhpcy5ub2RlR3JvdXAubGFiZWxQcm9wZXJ0eU5hbWUpO1xyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5oZWFkaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gXCJcIjtcclxuICAgICQuZWFjaCh0aGlzLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XHJcbiAgICAgICAgaWYgKHByb3BlcnR5LmlzSGVhZGluZykge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBwcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChyZXN1bHQgIT0gXCJcIilcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIHJldHVybiB0aGlzLmxhYmVsKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZS5yZXBsYWNlKFwiKlwiLCBcIlwiKS5yZXBsYWNlKFwiI1wiLCBcIlwiKTtcclxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgIHRoaXMuaXNIZWFkaW5nID0gKG5hbWUuc2xpY2UoMCwgMSkgPT0gXCIqXCIpO1xyXG4gICAgdGhpcy5pc0hpZGRlbiA9IChuYW1lLnNsaWNlKDAsIDEpID09IFwiI1wiKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBSZWYodGFyZ2V0Tm9kZSwgbGFiZWwsIHRvVGFyZ2V0LCB0b1NvdXJjZSkge1xyXG4gICAgdGhpcy50YXJnZXROb2RlID0gdGFyZ2V0Tm9kZTtcclxuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcclxuICAgIHRoaXMudG9UYXJnZXQgPSB0b1RhcmdldDtcclxuICAgIHRoaXMudG9Tb3VyY2UgPSB0b1NvdXJjZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTZXR0aW5ncygpIHtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5TZXR0aW5ncy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsdWUpIHtcclxuICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdChcIi5cIik7XHJcbiAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIGlmICh0aGlzW3BhcnRzWzBdXSA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpc1twYXJ0c1swXV0uZ2V0KHBhcnRzLnNwbGljZSgxLCBwYXJ0cy5sZW5ndGggLSAxKS5qb2luKFwiLlwiKSwgZGVmYXVsdFZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpc1trZXldID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHJcbiAgICByZXR1cm4gdGhpc1trZXldO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcclxuICAgIC8vIEdldCBzaGVldCBjb3VudFxyXG4gICAgZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3MoaW5mbykge1xyXG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xyXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbykge1xyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IG5ldyBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgaW5mby50aXRsZSk7XHJcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gaW5mby5zaGVldENvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2FkZWRTaGVldENvdW50ID09IGluZm8uc2hlZXRDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xyXG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXQuc2hlZXRzW3Jlc3BvbnNlLmZlZWQudGl0bGUuJHRdID0gbmV3IFNoZWV0KCk7XHJcblxyXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZS5ncyRjZWxsLnJvdyAtIDE7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0gbmV3IFJvdyhpbmRleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XS5yb3dDZWxscy5wdXNoKG5ldyBSb3dDZWxsKGUuZ3MkY2VsbC5jb2wgLSAxLCBlLmNvbnRlbnQuJHQpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTb3J0IHJvdyBjZWxscyBieSBjb2wgaW5kZXhcclxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgcm93LnJvd0NlbGxzLnNvcnQoZnVuY3Rpb24oYzEsIGMyKSB7IHJldHVybiBjMS5jb2xJbmRleCAtIGMyLmNvbEluZGV4OyB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xyXG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0Q291bnQ6IHJlc3BvbnNlLmZlZWQuZW50cnkubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiByZXNwb25zZS5mZWVkLnRpdGxlLiR0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgb25TdWNjZXNzKGluZm8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCB0aXRsZSkge1xyXG4gICAgdGhpcy5rZXkgPSBzcHJlYWRzaGVldEtleTtcclxuICAgIHRoaXMudGl0bGUgPSB0aXRsZTtcclxuICAgIHRoaXMuc2hlZXRzID0gbmV3IFNoZWV0cygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTaGVldHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gU2hlZXQoKSB7XHJcbiAgICB0aGlzLnJvd3MgPSBbXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5TaGVldC5wcm90b3R5cGUuaGVhZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dzWzBdLnZhbHVlcygpO1xyXG59XHJcblxyXG5TaGVldC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihyb3csIGNvbE5hbWUpIHtcclxuICAgIHZhciBjb2xJbmRleCA9IHRoaXMuaGVhZGVyKCkuaW5kZXhPZihjb2xOYW1lKTtcclxuICAgIGlmIChjb2xJbmRleCA9PSAtMSlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICQuZWFjaChyb3cucm93Q2VsbHMsIGZ1bmN0aW9uKGksIHJvd0NlbGwpIHtcclxuICAgICAgICBpZiAocm93Q2VsbC5jb2xJbmRleCA9PSBjb2xJbmRleCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSByb3dDZWxsLnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gUm93KHJvd0luZGV4KSB7XHJcbiAgICB0aGlzLnJvd0luZGV4ID0gcm93SW5kZXg7XHJcbiAgICB0aGlzLnJvd0NlbGxzID0gW107XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcblJvdy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gJC5tYXAodGhpcy5yb3dDZWxscywgZnVuY3Rpb24ocm93Q2VsbCwgaSkge1xyXG4gICAgICAgIHJldHVybiByb3dDZWxsLnZhbHVlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJvd0NlbGwoY29sSW5kZXgsIHZhbHVlKSB7XHJcbiAgICB0aGlzLmNvbEluZGV4ID0gY29sSW5kZXg7XHJcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxufSJdfQ==
