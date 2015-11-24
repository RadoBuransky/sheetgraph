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

        svg.append("defs").selectAll("marker")
            .data(["suit"])
            .enter()
            .append("marker")
            .attr("class", "link")
            .attr("id", function(d) { return d; })
            .attr("viewBox", "0 0 30 20")
            .attr("refX", 58)
            .attr("refY", 10)
            .attr("markerWidth", 20)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 30 10 L 0 20");

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
            .attr("marker-end", "url(#suit)");

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
            graph.links.push(new GraphLink(graphNode, getGraphNode(ref.targetNode), ref.label));
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

function GraphLink(source, target, label) {
    this.source = source;
    this.target = target;
    this.label = label;
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
                            result.nodes.push(new Ref(targetNode, refTarget.label));
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
        var refNames = colName.split(".");
        var nodeGroup = null;
        if (refNames.length > 0)
            nodeGroup = nodeGroups.getByName(refNames[0]);
        if ((refNames.length >= 2) &&
            (nodeGroup != null)) {
            var result = {
                nodeGroup: nodeGroup,
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

function Ref(targetNode, label) {
    this.targetNode = targetNode;
    this.label = label;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XHJcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xyXG5cclxuICAgIHZhciBkM3NoZWV0ID0ge1xyXG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxyXG4gICAgICAgIHN2Z0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIGluZm9Db250YWluZXJJZDogXCJcIixcclxuICAgICAgICBzdmc6IHt9LFxyXG4gICAgICAgIHNwcmVhZHNoZWV0OiB7fSxcclxuICAgICAgICBtb2RlbDoge31cclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkM3NoZWV0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBJbml0aWFsaXplIEQzIHNoZWV0LlxyXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cclxuICAgICoqL1xyXG4gICAgZDNzaGVldC5pbml0ID0gZnVuY3Rpb24oc3ZnQ29udGFpbmVySWQsIGluZm9Db250YWluZXJJZCkge1xyXG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcclxuICAgICAgICBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkID0gc3ZnQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgaW5mb0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LWluZm9cIjtcclxuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcclxuXHJcbiAgICAgICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXHJcbiAgICAgICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcclxuICAgICAgICAgICAgLm9uKFwiem9vbVwiLCByZXNjYWxlKTtcclxuXHJcbiAgICAgICAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKTtcclxuXHJcbiAgICAgICAgc3ZnLmFwcGVuZChcImRlZnNcIikuc2VsZWN0QWxsKFwibWFya2VyXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKFtcInN1aXRcIl0pXHJcbiAgICAgICAgICAgIC5lbnRlcigpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJtYXJrZXJcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCIwIDAgMzAgMjBcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJyZWZYXCIsIDU4KVxyXG4gICAgICAgICAgICAuYXR0cihcInJlZllcIiwgMTApXHJcbiAgICAgICAgICAgIC5hdHRyKFwibWFya2VyV2lkdGhcIiwgMjApXHJcbiAgICAgICAgICAgIC5hdHRyKFwibWFya2VySGVpZ2h0XCIsIDMwKVxyXG4gICAgICAgICAgICAuYXR0cihcIm9yaWVudFwiLCBcImF1dG9cIilcclxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJkXCIsIFwiTSAwIDAgTCAzMCAxMCBMIDAgMjBcIik7XHJcblxyXG4gICAgICAgIHN2ZyA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgICAgIC5jYWxsKHpvb20pO1xyXG5cclxuICAgICAgICB2YXIgcmVjdCA9IHN2Zy5hcHBlbmQoXCJyZWN0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIilcclxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcImFsbFwiKTtcclxuXHJcbiAgICAgICAgZDNzaGVldC5zdmcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcclxuXHJcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gZDNzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZXNjYWxlKCkge1xyXG4gICAgICB2YXIgdHJhbnMgPSBkMy5ldmVudC50cmFuc2xhdGU7XHJcbiAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnNjYWxlO1xyXG5cclxuICAgICAgZDNzaGVldC5zdmcuYXR0cihcInRyYW5zZm9ybVwiLFxyXG4gICAgICAgICAgXCJ0cmFuc2xhdGUoXCIgKyB0cmFucyArIFwiKVwiXHJcbiAgICAgICAgICArIFwiIHNjYWxlKFwiICsgc2NhbGUgKyBcIilcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xyXG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcclxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcclxuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coc3ByZWFkc2hlZXQpO1xyXG5cclxuICAgICAgICAgICAgZDNzaGVldC5zcHJlYWRzaGVldCA9IHNwcmVhZHNoZWV0O1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBkb2N1bWVudC50aXRsZSA9IHNwcmVhZHNoZWV0LnRpdGxlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cclxuICAgICAgICAgICAgdmFyIGluZm9Nb2R1bGUgPSByZXF1aXJlKFwiLi9pbmZvXCIpO1xyXG4gICAgICAgICAgICB2YXIgaW5mbyA9IGluZm9Nb2R1bGUoZDNzaGVldC5pbmZvQ29udGFpbmVySWQsIHNwcmVhZHNoZWV0LnRpdGxlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgICAgIHZhciBtb2RlbE1vZHVsZSA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0Lm1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBncmFwaCBmcm9tIG1vZGVsXHJcbiAgICAgICAgICAgIHZhciBncmFwaE1vZHVsZSA9IHJlcXVpcmUoXCIuL2dyYXBoXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGhNb2R1bGUoZDNzaGVldC5tb2RlbCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0LmdyYXBoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBEMyBmb3JjZSBsYXlvdXQgZnJvbSBncmFwaFxyXG4gICAgICAgICAgICB2YXIgZm9yY2VNb2R1bGUgPSByZXF1aXJlKFwiLi9mb3JjZVwiKTtcclxuICAgICAgICAgICAgdmFyIGZvcmNlID0gZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8sIGQzc2hlZXQubW9kZWwuc2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB2aWV3IG9wdGlvbnNcclxuLy8gICAgICAgICAgICB2YXIgdmlld01vZHVsZSA9IHJlcXVpcmUoXCIuL3ZpZXdcIik7XHJcbi8vICAgICAgICAgICAgdmlld01vZHVsZShkM3NoZWV0Lm1vZGVsLCB1cGRhdGVHcmFwaCk7XHJcbi8vXHJcbi8vICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlR3JhcGgodmlld09wdGlvbnMpIHtcclxuLy8gICAgICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIGQzc2hlZXQuZ3JhcGggYW5kIGZvcmNlLnJlc3RhcnQoKVxyXG4vLyAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFwcGx5IENTUyBzdHlsZVxyXG4gICAgICAgICAgICBhcHBseUNzcyhkM3NoZWV0Lm1vZGVsLnNldHRpbmdzLmNzcyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlDc3MoY3NzKSB7XHJcbiAgICAgICAgaWYgKGNzcyA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBhbGwgZWxlbWVudCBzZWxlY3RvcnNcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gT2JqZWN0LmtleXMoY3NzKTtcclxuICAgICAgICAkLmVhY2goc2VsZWN0b3JzLCBmdW5jdGlvbihpLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSB7fTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgLy8gSXQgaXMgYW4gaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgaXMgYSBjbGFzc1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKFwiLlwiICsgc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzdHlsZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoY3NzW3NlbGVjdG9yXSk7XHJcbiAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihqLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMuY3NzKHByb3BlcnR5LCBjc3Nbc2VsZWN0b3JdW3Byb3BlcnR5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcclxuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgfVxyXG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbywgc2V0dGluZ3MpIHtcclxuICAgIHZhciBub2RlID0gW10sXHJcbiAgICAgICAgbm9kZUxhYmVsID0gW10sXHJcbiAgICAgICAgbGluayA9IFtdLFxyXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdLFxyXG4gICAgICAgIGNvbG9ycyA9IGQzLnNjYWxlLmNhdGVnb3J5MjAoKTtcclxuXHJcbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICBzZWxlY3RBbGwoKTtcclxuXHJcbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxyXG4gICAgICAgIC5zaXplKFt3aWR0aCwgaGVpZ2h0XSlcclxuICAgICAgICAubGlua0Rpc3RhbmNlKDE3MCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5jaGFyZ2UoLTUwMDApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuZ3Jhdml0eSgwLjMpIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgIC5vbihcInRpY2tcIiwgb25UaWNrKTtcclxuXHJcbiAgICB2YXIgZHJhZyA9IGZvcmNlLmRyYWcoKVxyXG4gICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSlcclxuICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZHJhZ3N0YXJ0ZWQpXHJcbiAgICAgICAgLm9uKFwiZHJhZ1wiLCBkcmFnZ2VkKVxyXG4gICAgICAgIC5vbihcImRyYWdlbmRcIiwgZHJhZ2VuZGVkKTtcclxuXHJcbiAgICB0aGlzLnJlc3RhcnQgPSByZXN0YXJ0XHJcbiAgICByZXN0YXJ0KCk7XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ3N0YXJ0ZWQoZCkge1xyXG4gICAgICAgZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICBkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImRyYWdnaW5nXCIsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYWdnZWQoZCkge1xyXG4gICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJjeFwiLCBkLnggPSBkMy5ldmVudC54KS5hdHRyKFwiY3lcIiwgZC55ID0gZDMuZXZlbnQueSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ2VuZGVkKGQpIHtcclxuICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHJhZ2dpbmdcIiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RhcnQoKSB7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJtYXJrZXItZW5kXCIsIFwidXJsKCNzdWl0KVwiKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihncmFwaExpbmspIHsgcmV0dXJuIGdyYXBoTGluay5sYWJlbDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmstbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgbm9kZUNsYXNzKVxyXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMjApIC8vIFRPRE86IFNldHRpbmdzXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIG5vZGVGaWxsQ29sb3IpXHJcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXHJcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGUtbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZ3JhcGhOb2RlKSB7IHJldHVybiBncmFwaE5vZGUubm9kZS5sYWJlbCgpOyB9KVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxyXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xyXG5cclxuICAgICAgICBzZWxlY3RBbGwoKTtcclxuICAgICAgICBmb3JjZS5zdGFydCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVDbGFzcyhncmFwaE5vZGUpIHtcclxuICAgICAgICByZXR1cm4gXCJub2RlIFwiICsgZ3JhcGhOb2RlLm5vZGUubm9kZUdyb3VwLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9kZUNsaWNrKGdyYXBoTm9kZSkge1xyXG4gICAgICAgIGluZm8uc2hvd05vZGUoZ3JhcGhOb2RlLm5vZGUsIG5vZGVGaWxsQ29sb3IoZ3JhcGhOb2RlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9kZUZpbGxDb2xvcihncmFwaE5vZGUpIHtcclxuICAgICAgICByZXR1cm4gc2V0dGluZ3MuY3NzLmdldChncmFwaE5vZGUubm9kZS5ub2RlR3JvdXAubmFtZSArIFwiLmZpbGxcIiwgY29sb3JzKGdyYXBoTm9kZS5ub2RlLm5vZGVHcm91cC5uYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2VsZWN0QWxsKCkge1xyXG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XHJcbiAgICAgICAgbm9kZUxhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpO1xyXG4gICAgICAgIGxpbmsgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIik7XHJcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcclxuLy8gICAgICAgIGxpbmsuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLng7IH0pXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS55OyB9KVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcclxuLy8gICAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lnk7IH0pO1xyXG4gICAgICAgIGxpbmsuYXR0cihcImRcIiwgbGlua0FyYyk7XHJcblxyXG4gICAgICAgIGxpbmtMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS54ICsgZC50YXJnZXQueCkvMjsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xyXG5cclxuICAgICAgICBub2RlXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XHJcblxyXG4gICAgICAgIG5vZGVMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsaW5rQXJjKGQpIHtcclxuICAgICAgICB2YXIgZHggPSBkLnRhcmdldC54IC0gZC5zb3VyY2UueCxcclxuICAgICAgICAgICAgZHkgPSBkLnRhcmdldC55IC0gZC5zb3VyY2UueTtcclxuICAgICAgICByZXR1cm4gXCJNXCIgKyBkLnNvdXJjZS54ICsgXCIgXCIgKyBkLnNvdXJjZS55ICsgXCJMIFwiICsgZC50YXJnZXQueCArIFwiLFwiICsgZC50YXJnZXQueTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcclxuICAgIHZhciBncmFwaCA9IG5ldyBHcmFwaCgpO1xyXG5cclxuICAgIC8vIEZvciBhbGwgc2hlZXRzXHJcbiAgICAkLmVhY2gobW9kZWwubm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXAubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcclxuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcclxuICAgICAgICAgICAgdmFyIGdyYXBoTm9kZSA9IG5ldyBHcmFwaE5vZGUobm9kZSk7XHJcbiAgICAgICAgICAgIGdyYXBoLm5vZGVzLnB1c2goZ3JhcGhOb2RlKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBsaW5rc1xyXG4gICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcclxuICAgICAgICAkLmVhY2goZ3JhcGhOb2RlLm5vZGUucmVmcywgZnVuY3Rpb24oaiwgcmVmKSB7XHJcbiAgICAgICAgICAgIGdyYXBoLmxpbmtzLnB1c2gobmV3IEdyYXBoTGluayhncmFwaE5vZGUsIGdldEdyYXBoTm9kZShyZWYudGFyZ2V0Tm9kZSksIHJlZi5sYWJlbCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0R3JhcGhOb2RlKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAkLmVhY2goZ3JhcGgubm9kZXMsIGZ1bmN0aW9uKGksIGdyYXBoTm9kZSkge1xyXG4gICAgICAgICAgICBpZiAoZ3JhcGhOb2RlLm5vZGUgPT0gbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZ3JhcGhOb2RlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEdyYXBoKCkge1xyXG4gICAgdGhpcy5ub2RlcyA9IFtdO1xyXG4gICAgdGhpcy5saW5rcyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEdyYXBoTm9kZShub2RlKSB7XHJcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEdyYXBoTGluayhzb3VyY2UsIHRhcmdldCwgbGFiZWwpIHtcclxuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xyXG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5mb0NvbnRhaW5lcklkLCB0aXRsZSkge1xyXG4gICAgLy8gU2V0IGhlYWRpbmdcclxuICAgICQoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQgKyBcIiBoMVwiKS50ZXh0KHRpdGxlKTtcclxuXHJcbiAgICB0aGlzLnNob3dOb2RlID0gZnVuY3Rpb24obm9kZSwgZmlsbENvbG9yKSB7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoMlwiKS50ZXh0KG5vZGUuaGVhZGluZygpKTtcclxuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1pbmZvIGhlYWRlclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGZpbGxDb2xvcik7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtc2hlZXQtbmFtZVwiKS50ZXh0KG5vZGUubm9kZUdyb3VwLm5hbWUpO1xyXG5cclxuICAgICAgICB2YXIgdWwgPSAkKFwiI2Qzc2hlZXQtbm9kZS1wcm9wZXJ0aWVzXCIpO1xyXG4gICAgICAgIHVsLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIC8vIFNob3cgbm9kZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgJC5lYWNoKG5vZGUucHJvcGVydGllcywgZnVuY3Rpb24oaSwgbm9kZVByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgIGlmICghbm9kZVByb3BlcnR5LmlzSGlkZGVuKVxyXG4gICAgICAgICAgICAgICAgYWRkUHJvcGVydHkobm9kZVByb3BlcnR5Lm5hbWUsIG5vZGVQcm9wZXJ0eS52YWx1ZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEdyb3VwIG5vZGUgbGlua3NcclxuICAgICAgICB2YXIgZ3JvdXBlZExpbmtzID0ge307XHJcbiAgICAgICAgJC5lYWNoKG5vZGUucmVmcywgZnVuY3Rpb24oaSwgcmVmKSB7XHJcbiAgICAgICAgICAgIHZhciBsaW5rTmFtZSA9IHJlZi50YXJnZXROb2RlLm5vZGVHcm91cC5uYW1lO1xyXG5cclxuICAgICAgICAgICAgaWYgKGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0ucHVzaChyZWYudGFyZ2V0Tm9kZS5oZWFkaW5nKCkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgbGlua3NcclxuICAgICAgICB2YXIgbGlua05hbWVzID0gT2JqZWN0LmtleXMoZ3JvdXBlZExpbmtzKTtcclxuICAgICAgICAkLmVhY2gobGlua05hbWVzLCBmdW5jdGlvbihpLCBsaW5rTmFtZSkge1xyXG4gICAgICAgICAgICBhZGRQcm9wZXJ0eShsaW5rTmFtZSwgZ3JvdXBlZExpbmtzW2xpbmtOYW1lXS5qb2luKFwiLCBcIikpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBhZGRQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB1bC5hcHBlbmQoXCI8bGk+PHNwYW4gY2xhc3M9XFxcImQzc2hlZXQtbm9kZS1wcm9wZXJ0eS1uYW1lXFxcIj5cIiArIG5hbWUgK1xyXG4gICAgICAgICAgICAgICAgXCI6PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LXZhbHVlXFxcIj5cIiArIGZvcm1hdFZhbHVlKHZhbHVlKSArIFwiPC9zcGFuPjwvbGk+XCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLnNsaWNlKDAsIFwiNFwiKS50b0xvd2VyQ2FzZSgpID09IFwiaHR0cFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiPGEgaHJlZj1cXFwiXCIgKyB2YWx1ZSArIFwiXFxcIj5cIiArIHZhbHVlICsgXCI8L2E+XCJcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XHJcbiAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwoKTtcclxuXHJcbiAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCk7XHJcbiAgICBtb2RlbC5ub2RlR3JvdXBzID0gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwVHlwZXMubm9kZUdyb3VwTmFtZXMsIG5vZGVHcm91cFR5cGVzLnJlZlNoZWV0TmFtZXMpO1xyXG4gICAgaWYgKG5vZGVHcm91cFR5cGVzLnNldHRpbmdzR3JvdXBOYW1lICE9IG51bGwpXHJcbiAgICAgICAgbW9kZWwuc2V0dGluZ3MgPSBnZXRTZXR0aW5ncyhzcHJlYWRzaGVldC5zaGVldHNbbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWVdKTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTZXR0aW5ncyhzZXR0aW5nc1NoZWV0KSB7XHJcbiAgICAgICAgdmFyIHNldHRpbmdzID0gbmV3IFNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICQuZWFjaChzZXR0aW5nc1NoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gcm93LnJvd0NlbGxzWzBdLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSByb3cucm93Q2VsbHNbMV0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoKGtleSA9PSBudWxsKSB8fCAodmFsdWUgPT0gbnVsbCkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgcGF0aCA9IGtleS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gc2V0dGluZ3M7XHJcbiAgICAgICAgICAgICQuZWFjaChwYXRoLCBmdW5jdGlvbihqLCBrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFtrXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGogPT0gcGF0aC5sZW5ndGggLSAxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50W2tdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50W2tdID0gbmV3IFNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtrXTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzZXR0aW5ncztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXROb2RlR3JvdXBzKHNwcmVhZHNoZWV0LCBub2RlR3JvdXBOYW1lcywgcmVmU2hlZXROYW1lcykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBub2RlcyB3aXRoIHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgbm9kZUdyb3VwcyA9IG5ldyBOb2RlR3JvdXBzKCk7XHJcbiAgICAgICAgJC5lYWNoKG5vZGVHcm91cE5hbWVzLCBmdW5jdGlvbihpLCBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIG5vZGVHcm91cHMuaXRlbXMucHVzaChnZXROb2RlcyhzcHJlYWRzaGVldC5zaGVldHNbbm9kZUdyb3VwTmFtZV0sIG5vZGVHcm91cE5hbWUpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSBub2RlIHNoZWV0c1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBzLml0ZW1zLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcclxuICAgICAgICAgICAgY3JlYXRlUmVmcyhub2RlR3JvdXBzLCBzcHJlYWRzaGVldC5zaGVldHNbbm9kZUdyb3VwLm5hbWVdLCBub2RlR3JvdXApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgcmVmZXJlbmNlcyBmcm9tIHJlZmVyZW5jZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gocmVmU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgcmVmU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZVNoZWV0UmVmcyhub2RlR3JvdXBzLCBzcHJlYWRzaGVldC5zaGVldHNbcmVmU2hlZXROYW1lLm5hbWVdLCByZWZTaGVldE5hbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVTaGVldFJlZnMobm9kZUdyb3VwcywgcmVmU2hlZXQsIHJlZlNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSByZWZTaGVldC5oZWFkZXIoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgcm93c1xyXG4gICAgICAgICAgICAkLmVhY2gocmVmU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gZ2V0UmVmVG9Ob2RlR3JvdXAobm9kZUdyb3VwcywgcmVmU2hlZXQsIHJvdywgcmVmU2hlZXROYW1lLnNvdXJjZSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZ2V0UmVmVG9Ob2RlR3JvdXAobm9kZUdyb3VwcywgcmVmU2hlZXQsIHJvdywgcmVmU2hlZXROYW1lLnRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHNvdXJjZSAhPSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICh0YXJnZXQgIT0gbnVsbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSB0YXJnZXQubGFiZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCgodGFyZ2V0LmxhYmVsID09IG51bGwpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICh0YXJnZXQubGFiZWwgPT0gXCJcIikpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChyb3cucm93Q2VsbHNbMF0uY29sSW5kZXggPT0gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsID0gcm93LnJvd0NlbGxzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChzb3VyY2Uubm9kZXMsIGZ1bmN0aW9uKGosIHNvdXJjZVJlZikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2godGFyZ2V0Lm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXRSZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVJlZi50YXJnZXROb2RlLnJlZnMucHVzaChuZXcgUmVmKHRhcmdldFJlZi50YXJnZXROb2RlLCBsYWJlbCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRSZWZUb05vZGVHcm91cChub2RlR3JvdXBzLCBzaGVldCwgcm93LCBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBzaGVldC5oZWFkZXIoKTtcclxuICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzaGVldC52YWx1ZShyb3csIGNvbE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZWZUYXJnZXQgPSBwYXJzZUNvbHVtblJlZk5hbWUoY29sTmFtZSwgbm9kZUdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHJlZlRhcmdldCAhPSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIChyZWZUYXJnZXQubm9kZUdyb3VwLm5hbWUgPT0gbm9kZUdyb3VwTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZWZUYXJnZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJlZlRhcmdldC5ub2RlR3JvdXAubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgbWF0Y2hlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuaW5kZXhPZih0YXJnZXROb2RlLnZhbHVlKHJlZlRhcmdldC5wcm9wZXJ0eU5hbWUpKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaChuZXcgUmVmKHRhcmdldE5vZGUsIHJlZlRhcmdldC5sYWJlbCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSZWZzKG5vZGVHcm91cHMsIG5vZGVTaGVldCwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IG5vZGVTaGVldC5oZWFkZXIoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgcm93c1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCBjb2x1bW5zXHJcbiAgICAgICAgICAgICAgICAkLmVhY2goY29sTmFtZXMsIGZ1bmN0aW9uKGosIGNvbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBub2RlU2hlZXQudmFsdWUocm93LCBjb2xOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgcmVmZXJlbmNlIGNvbHVtblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWZUYXJnZXQgPSBwYXJzZUNvbHVtblJlZk5hbWUoY29sTmFtZSwgbm9kZUdyb3Vwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZlRhcmdldCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChyZWZUYXJnZXQubm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBXZSBzaG91bGQgcHJvcGVybHkgc3BsaXQgdmFsdWVzIHVzaW5nIGNvbW1hXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuaW5kZXhPZih0YXJnZXROb2RlLnZhbHVlKHJlZlRhcmdldC5wcm9wZXJ0eU5hbWUpKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUdyb3VwLm5vZGVzW2kgLSAxXS5yZWZzLnB1c2gobmV3IFJlZih0YXJnZXROb2RlLCByZWZUYXJnZXQubGFiZWwpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZXMobm9kZVNoZWV0LCBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBoZWFkZXIgPSBub2RlU2hlZXQuaGVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgTm9kZUdyb3VwKG5vZGVHcm91cE5hbWUsIGhlYWRlclswXSk7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgbm9kZXMgYW5kIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2gobmV3IE5vZGUoZ2V0Tm9kZVByb3BlcnRpZXMocm93LCBoZWFkZXIpLCByZXN1bHQpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BlcnRpZXMocm93LCBoZWFkZXIpIHtcclxuICAgICAgICAgICAgdmFyIG5vZGVQcm9wZXJ0aWVzID0gW107XHJcbiAgICAgICAgICAgICQuZWFjaChyb3cucm93Q2VsbHMsIGZ1bmN0aW9uKGksIHJvd0NlbGwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb2xOYW1lID0gaGVhZGVyW3Jvd0NlbGwuY29sSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbE5hbWUuaW5kZXhPZihcIi5cIikgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZVByb3BlcnRpZXMucHVzaChuZXcgTm9kZVByb3BlcnR5KGNvbE5hbWUsIHJvd0NlbGwudmFsdWUpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlUHJvcGVydGllcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KSB7XHJcbiAgICAgICAgdmFyIG5vZGVHcm91cFR5cGVzID0ge1xyXG4gICAgICAgICAgICBub2RlR3JvdXBOYW1lczogW10sXHJcbiAgICAgICAgICAgIHJlZlNoZWV0TmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBzZXR0aW5nc0dyb3VwTmFtZTogbnVsbFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHNoZWV0TmFtZXMgPSBPYmplY3Qua2V5cyhzcHJlYWRzaGVldC5zaGVldHMpO1xyXG4gICAgICAgICQuZWFjaChzaGVldE5hbWVzLCBmdW5jdGlvbihpLCBzaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcclxuICAgICAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLnNldHRpbmdzR3JvdXBOYW1lID0gc2hlZXROYW1lO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlZlNoZWV0ID0gcGFyc2VSZWZTaGVldE5hbWUoc2hlZXROYW1lKVxyXG4gICAgICAgICAgICBpZiAoKHJlZlNoZWV0ICE9IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKHJlZlNoZWV0LnNvdXJjZSkgPiAtMSkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YocmVmU2hlZXQudGFyZ2V0KSA+IC0xKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMucmVmU2hlZXROYW1lcy5wdXNoKHJlZlNoZWV0KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMubm9kZUdyb3VwTmFtZXMucHVzaChzaGVldE5hbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbm9kZUdyb3VwVHlwZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpIHtcclxuICAgICAgICB2YXIgcmVmTmFtZXMgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICB2YXIgbm9kZUdyb3VwID0gbnVsbDtcclxuICAgICAgICBpZiAocmVmTmFtZXMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgbm9kZUdyb3VwID0gbm9kZUdyb3Vwcy5nZXRCeU5hbWUocmVmTmFtZXNbMF0pO1xyXG4gICAgICAgIGlmICgocmVmTmFtZXMubGVuZ3RoID49IDIpICYmXHJcbiAgICAgICAgICAgIChub2RlR3JvdXAgIT0gbnVsbCkpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgIG5vZGVHcm91cDogbm9kZUdyb3VwLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiByZWZOYW1lc1sxXVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVmTmFtZXMubGVuZ3RoID09IDMpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQubGFiZWwgPSByZWZOYW1lc1syXTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZVJlZlNoZWV0TmFtZShzaGVldE5hbWUpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcclxuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBzaGVldE5hbWUsXHJcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcclxuICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kZWw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE1vZGVsKCkge1xyXG4gICAgdGhpcy5ub2RlR3JvdXBzID0gbmV3IE5vZGVHcm91cHMoKTtcclxuICAgIHRoaXMuc2V0dGluZ3MgPSB7fTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlR3JvdXBzKCkge1xyXG4gICAgdGhpcy5pdGVtcyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbk5vZGVHcm91cHMucHJvdG90eXBlLmdldEJ5TmFtZSA9IGZ1bmN0aW9uKG5vZGVHcm91cE5hbWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBudWxsO1xyXG4gICAgJC5lYWNoKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cCkge1xyXG4gICAgICAgIGlmIChub2RlR3JvdXAubmFtZSA9PSBub2RlR3JvdXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IG5vZGVHcm91cDtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZUdyb3VwKG5hbWUsIGxhYmVsUHJvcGVydHlOYW1lKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgdGhpcy5sYWJlbFByb3BlcnR5TmFtZSA9IGxhYmVsUHJvcGVydHlOYW1lO1xyXG4gICAgdGhpcy5ub2RlcyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGUocHJvcGVydGllcywgbm9kZUdyb3VwKSB7XHJcbiAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xyXG4gICAgdGhpcy5yZWZzID0gW107XHJcbiAgICB0aGlzLm5vZGVHcm91cCA9IG5vZGVHcm91cDtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKHByb3BlcnR5TmFtZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAkLmVhY2godGhpcy5wcm9wZXJ0aWVzLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgIGlmIChwcm9wZXJ0eS5uYW1lID09IHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBwcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuTm9kZS5wcm90b3R5cGUubGFiZWwgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnZhbHVlKHRoaXMubm9kZUdyb3VwLmxhYmVsUHJvcGVydHlOYW1lKTtcclxufVxyXG5cclxuTm9kZS5wcm90b3R5cGUuaGVhZGluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFwiXCI7XHJcbiAgICAkLmVhY2godGhpcy5wcm9wZXJ0aWVzLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgIGlmIChwcm9wZXJ0eS5pc0hlYWRpbmcpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gcHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAocmVzdWx0ICE9IFwiXCIpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5sYWJlbCgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWUucmVwbGFjZShcIipcIiwgXCJcIikucmVwbGFjZShcIiNcIiwgXCJcIik7XHJcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICB0aGlzLmlzSGVhZGluZyA9IChuYW1lLnNsaWNlKDAsIDEpID09IFwiKlwiKTtcclxuICAgIHRoaXMuaXNIaWRkZW4gPSAobmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIik7XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gUmVmKHRhcmdldE5vZGUsIGxhYmVsKSB7XHJcbiAgICB0aGlzLnRhcmdldE5vZGUgPSB0YXJnZXROb2RlO1xyXG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNldHRpbmdzKCkge1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcblNldHRpbmdzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWx1ZSkge1xyXG4gICAgdmFyIHBhcnRzID0ga2V5LnNwbGl0KFwiLlwiKTtcclxuICAgIGlmIChwYXJ0cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgaWYgKHRoaXNbcGFydHNbMF1dID09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzW3BhcnRzWzBdXS5nZXQocGFydHMuc3BsaWNlKDEsIHBhcnRzLmxlbmd0aCAtIDEpLmpvaW4oXCIuXCIpLCBkZWZhdWx0VmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzW2tleV0gPT0gbnVsbClcclxuICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xyXG5cclxuICAgIHJldHVybiB0aGlzW2tleV07XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xyXG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XHJcbiAgICBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhpbmZvKSB7XHJcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXHJcbiAgICAgICAgbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKSB7XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gbmV3IFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBpbmZvLnRpdGxlKTtcclxuICAgICAgICB2YXIgbG9hZGVkU2hlZXRDb3VudCA9IDA7XHJcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBpbmZvLnNoZWV0Q291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbG9hZGVkU2hlZXRDb3VudCArPSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gaW5mby5zaGVldENvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICB2YXIgc2hlZXQgPSBzcHJlYWRzaGVldC5zaGVldHNbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSBuZXcgU2hlZXQoKTtcclxuXHJcbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF0gPSBuZXcgUm93KGluZGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdLnJvd0NlbGxzLnB1c2gobmV3IFJvd0NlbGwoZS5ncyRjZWxsLmNvbCAtIDEsIGUuY29udGVudC4kdCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNvcnQgcm93IGNlbGxzIGJ5IGNvbCBpbmRleFxyXG4gICAgICAgICAgICAkLmVhY2goc2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICByb3cucm93Q2VsbHMuc29ydChmdW5jdGlvbihjMSwgYzIpIHsgcmV0dXJuIGMxLmNvbEluZGV4IC0gYzIuY29sSW5kZXg7IH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIG9uU3VjY2Vzcykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL3dvcmtzaGVldHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL3B1YmxpYy9mdWxsP2FsdD1qc29uLWluLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZm8gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hlZXRDb3VudDogcmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHJlc3BvbnNlLmZlZWQudGl0bGUuJHRcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoaW5mbyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gU3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIHRpdGxlKSB7XHJcbiAgICB0aGlzLmtleSA9IHNwcmVhZHNoZWV0S2V5O1xyXG4gICAgdGhpcy50aXRsZSA9IHRpdGxlO1xyXG4gICAgdGhpcy5zaGVldHMgPSBuZXcgU2hlZXRzKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNoZWV0cygpIHtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTaGVldCgpIHtcclxuICAgIHRoaXMucm93cyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcblNoZWV0LnByb3RvdHlwZS5oZWFkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnJvd3NbMF0udmFsdWVzKCk7XHJcbn1cclxuXHJcblNoZWV0LnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKHJvdywgY29sTmFtZSkge1xyXG4gICAgdmFyIGNvbEluZGV4ID0gdGhpcy5oZWFkZXIoKS5pbmRleE9mKGNvbE5hbWUpO1xyXG4gICAgaWYgKGNvbEluZGV4ID09IC0xKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciByZXN1bHQgPSBudWxsO1xyXG4gICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xyXG4gICAgICAgIGlmIChyb3dDZWxsLmNvbEluZGV4ID09IGNvbEluZGV4KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJvd0NlbGwudmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBSb3cocm93SW5kZXgpIHtcclxuICAgIHRoaXMucm93SW5kZXggPSByb3dJbmRleDtcclxuICAgIHRoaXMucm93Q2VsbHMgPSBbXTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuUm93LnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLm1hcCh0aGlzLnJvd0NlbGxzLCBmdW5jdGlvbihyb3dDZWxsLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIHJvd0NlbGwudmFsdWU7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gUm93Q2VsbChjb2xJbmRleCwgdmFsdWUpIHtcclxuICAgIHRoaXMuY29sSW5kZXggPSBjb2xJbmRleDtcclxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59Il19
