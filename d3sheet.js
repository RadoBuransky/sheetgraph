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
            var viewModule = require("./view");
            viewModule(d3sheet.model, updateGraph);

            function updateGraph(viewOptions) {
                // TODO: update d3sheet.graph and force.restart()
            }

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
},{"./force":2,"./graph":3,"./info":4,"./model":5,"./spreadsheet":6,"./view":7}],2:[function(require,module,exports){
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
        .linkDistance(170) // TODO: Move to settings
        .charge(-5000) // TODO: Move to settings
        .gravity(0.3) // TODO: Move to settings
        .nodes(graph.nodes)
        .links(graph.links)
        .on("tick", onTick);

    this.restart = restart
    restart();

    function restart() {
        svg.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("class", "link");

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
            .text(function(graphNode) { return graphNode.node.label(); })
            .call(force.drag)
            .on("click", nodeClick);

        selectAll();
        force.start();
    }

    function nodeClick(graphNode) {
        info.showNode(graphNode.node, nodeFillColor(graphNode));
    }

    function nodeFillColor(graphNode) {
        return colors(graphNode.node.nodeGroup.name);
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
        $("#d3sheet-node-info h2").text(node.label());
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.nodeGroup.name);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        $.each(node.properties, function(i, nodeProperty) {
            if (nodeProperty.name != node.labelPropertyName)
                addProperty(nodeProperty.name, nodeProperty.value);
        });

        // Group node links
        var groupedLinks = {};
        $.each(node.refs, function(i, ref) {
            var linkName = ref.label;
            if (linkName == null)
                linkName = ref.targetNode.nodeGroup.name;

            if (groupedLinks[linkName] == null)
                groupedLinks[linkName] = [];

            groupedLinks[linkName].push(ref.targetNode.label());
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
    model.nodeGroups = getNodeGroups(spreadsheet, nodeGroupTypes.nodeGroupNames);
    if (nodeGroupTypes.settingsGroupName != null)
        model.settings = spreadsheet.sheets[nodeGroupTypes.settingsGroupName];

    function getNodeGroups(spreadsheet, nodeGroupNames) {
        // Create nodes with properties
        var nodeGroups = new NodeGroups();
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            nodeGroups.items.push(getNodes(spreadsheet.sheets[nodeGroupName], nodeGroupName));
        });

        // Create references from node sheets
        $.each(nodeGroups.items, function(i, nodeGroup) {
            createRefs(nodeGroups, spreadsheet.sheets[nodeGroup.name], nodeGroup);
        });

        // TODO: Create references from reference sheets

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
                nodeGroupTypes.refSheetNames.push(sheetName)
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

Model.prototype.filter = function(f) {
    var result = new Model();
    result.nodeGroups = new NodeGroups();

    // Filter and copy node group
    $.each(this.nodeGroups.items, function(i, nodeGroup) {
        var nodeGroupCopy = nodeGroup.copy();
        if (f(nodeGroup)) {
            // Remove references to filtered node groups
            $.each(nodeGroup.nodes, function(j, node) {
                var nodeCopy = node.copy();
                var refsToRemove = [];
                $.each(nodeCopy.refs, function(k, ref) {
                    if (!f(ref.targetNode.nodeGroup))
                        refsToRemove.push[k];
                });

                for (k = refsToRemove.length - 1; i >= 0; i--)
                    nodeCopy.refs.splice(refsToRemove[k], 1);

                nodeGroup.nodes.push(nodeCopy);
            });

            result.nodeGroups.items.push(nodeGroupCopy);
        }
    });

    result.settings = this.settings;
    return result;
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

NodeGroup.prototype.copy = function() {
    var result = new NodeGroup(this.name, this.labelPropertyName);
    result.nodes = this.nodes.slice();
    return result;
}

function Node(properties, nodeGroup) {
    this.properties = properties;
    this.refs = [];
    this.nodeGroup = nodeGroup;
    return this;
}

Node.prototype.copy = function() {
    var result = new Node(this.properties, this.nodeGroup);
    result.refs = this.refs.slice();
    return result;
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

function NodeProperty(name, value) {
    this.name = name;
    this.value = value;
    return this;
}

function Ref(targetNode, label) {
    this.targetNode = targetNode;
    this.label = label;
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
},{}],7:[function(require,module,exports){
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
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvaW5mby5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyIsInNyYy92aWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XG5cbiAgICB2YXIgZDNzaGVldCA9IHtcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXG4gICAgICAgIHN2Z0NvbnRhaW5lcklkOiBcIlwiLFxuICAgICAgICBpbmZvQ29udGFpbmVySWQ6IFwiXCIsXG4gICAgICAgIHN2Zzoge30sXG4gICAgICAgIHNwcmVhZHNoZWV0OiB7fSxcbiAgICAgICAgbW9kZWw6IHt9XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcblxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxuICAgICoqL1xuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xuXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xuXG4gICAgICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxuICAgICAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcbiAgICAgICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcblxuICAgICAgICAvLyBDcmVhdGUgU1ZHIGVsZW1lbnRcbiAgICAgICAgZDNzaGVldC5zdmcgPSBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKCd2aWV3Qm94JywgXCIwIDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0KTtcblxuICAgICAgICAvLyBDcmVhdGUgaW5mbyBwYW5lbFxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xuXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXG4gICAgKiovXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzcHJlYWRzaGVldCk7XG5cbiAgICAgICAgICAgIGQzc2hlZXQuc3ByZWFkc2hlZXQgPSBzcHJlYWRzaGVldDtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxuICAgICAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBzcHJlYWRzaGVldC50aXRsZTtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cbiAgICAgICAgICAgIHZhciBpbmZvTW9kdWxlID0gcmVxdWlyZShcIi4vaW5mb1wiKTtcbiAgICAgICAgICAgIHZhciBpbmZvID0gaW5mb01vZHVsZShkM3NoZWV0LmluZm9Db250YWluZXJJZCwgc3ByZWFkc2hlZXQudGl0bGUpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBzcHJlYWRzaGVldFxuICAgICAgICAgICAgdmFyIG1vZGVsTW9kdWxlID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQubW9kZWwpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxuICAgICAgICAgICAgdmFyIGdyYXBoTW9kdWxlID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGhNb2R1bGUoZDNzaGVldC5tb2RlbCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQuZ3JhcGgpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcbiAgICAgICAgICAgIHZhciBmb3JjZU1vZHVsZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xuICAgICAgICAgICAgdmFyIGZvcmNlID0gZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8sIHNwcmVhZHNoZWV0LnNldHRpbmdzKTtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB2aWV3IG9wdGlvbnNcbiAgICAgICAgICAgIHZhciB2aWV3TW9kdWxlID0gcmVxdWlyZShcIi4vdmlld1wiKTtcbiAgICAgICAgICAgIHZpZXdNb2R1bGUoZDNzaGVldC5tb2RlbCwgdXBkYXRlR3JhcGgpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVHcmFwaCh2aWV3T3B0aW9ucykge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBkM3NoZWV0LmdyYXBoIGFuZCBmb3JjZS5yZXN0YXJ0KClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXBwbHkgQ1NTIHN0eWxlXG4gICAgICAgICAgICBhcHBseUNzcyhkM3NoZWV0Lm1vZGVsLnNldHRpbmdzLmNzcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5Q3NzKGNzcykge1xuICAgICAgICBpZiAoY3NzID09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgLy8gR2V0IGFsbCBlbGVtZW50IHNlbGVjdG9yc1xuICAgICAgICB2YXIgc2VsZWN0b3JzID0gT2JqZWN0LmtleXMoY3NzKTtcbiAgICAgICAgJC5lYWNoKHNlbGVjdG9ycywgZnVuY3Rpb24oaSwgc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHt9O1xuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLnNsaWNlKDAsIDEpID09IFwiI1wiKVxuICAgICAgICAgICAgICAgIC8vIEl0IGlzIGFuIGlkZW50aWZpZXJcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoc2VsZWN0b3IpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIC8vIElzIGlzIGEgY2xhc3NcbiAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQoXCIuXCIgKyBzZWxlY3Rvcik7XG5cbiAgICAgICAgICAgIC8vIEdldCBhbGwgc3R5bGUgcHJvcGVydGllc1xuICAgICAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhjc3Nbc2VsZWN0b3JdKTtcbiAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihqLCBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzLmNzcyhwcm9wZXJ0eSwgY3NzW3NlbGVjdG9yXVtwcm9wZXJ0eV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcbiAgICB9XG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbykge1xuICAgIHZhciBub2RlID0gW10sXG4gICAgICAgIG5vZGVMYWJlbCA9IFtdLFxuICAgICAgICBsaW5rID0gW10sXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdLFxuICAgICAgICBjb2xvcnMgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XG5cbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xuXG4gICAgc2VsZWN0QWxsKCk7XG5cbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxuICAgICAgICAuc2l6ZShbd2lkdGgsIGhlaWdodF0pXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMTcwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5jaGFyZ2UoLTUwMDApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcbiAgICAgICAgLmdyYXZpdHkoMC4zKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5ub2RlcyhncmFwaC5ub2RlcylcbiAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxuICAgICAgICAub24oXCJ0aWNrXCIsIG9uVGljayk7XG5cbiAgICB0aGlzLnJlc3RhcnQgPSByZXN0YXJ0XG4gICAgcmVzdGFydCgpO1xuXG4gICAgZnVuY3Rpb24gcmVzdGFydCgpIHtcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIik7XG5cbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZ3JhcGhMaW5rKSB7IHJldHVybiBncmFwaExpbmsubGFiZWw7IH0pXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluay1sYWJlbFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcblxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMzApIC8vIFRPRE86IFNldHRpbmdzXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgMClcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIG5vZGVGaWxsQ29sb3IpXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcblxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLm5vZGUtbGFiZWxcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZS1sYWJlbFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihncmFwaE5vZGUpIHsgcmV0dXJuIGdyYXBoTm9kZS5ub2RlLmxhYmVsKCk7IH0pXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcblxuICAgICAgICBzZWxlY3RBbGwoKTtcbiAgICAgICAgZm9yY2Uuc3RhcnQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub2RlQ2xpY2soZ3JhcGhOb2RlKSB7XG4gICAgICAgIGluZm8uc2hvd05vZGUoZ3JhcGhOb2RlLm5vZGUsIG5vZGVGaWxsQ29sb3IoZ3JhcGhOb2RlKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9kZUZpbGxDb2xvcihncmFwaE5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGNvbG9ycyhncmFwaE5vZGUubm9kZS5ub2RlR3JvdXAubmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VsZWN0QWxsKCkge1xuICAgICAgICBub2RlID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpO1xuICAgICAgICBub2RlTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGUtbGFiZWxcIik7XG4gICAgICAgIGxpbmsgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIik7XG4gICAgICAgIGxpbmtMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvblRpY2soKSB7XG4gICAgICAgIGxpbmsuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLnk7IH0pXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lnk7IH0pO1xuXG4gICAgICAgIGxpbmtMYWJlbFxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnggKyBkLnRhcmdldC54KS8yOyB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnkgKyBkLnRhcmdldC55KS8yOyB9KTtcblxuICAgICAgICBub2RlLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC54ICsgXCIsXCIgKyBkLnkgKyBcIilcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbm9kZUxhYmVsXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciBncmFwaCA9IG5ldyBHcmFwaCgpO1xuXG4gICAgLy8gRm9yIGFsbCBzaGVldHNcbiAgICAkLmVhY2gobW9kZWwubm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcbiAgICAgICAgJC5lYWNoKG5vZGVHcm91cC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcbiAgICAgICAgICAgIHZhciBncmFwaE5vZGUgPSBuZXcgR3JhcGhOb2RlKG5vZGUpO1xuICAgICAgICAgICAgZ3JhcGgubm9kZXMucHVzaChncmFwaE5vZGUpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBsaW5rc1xuICAgICQuZWFjaChncmFwaC5ub2RlcywgZnVuY3Rpb24oaSwgZ3JhcGhOb2RlKSB7XG4gICAgICAgICQuZWFjaChncmFwaE5vZGUubm9kZS5yZWZzLCBmdW5jdGlvbihqLCByZWYpIHtcbiAgICAgICAgICAgIGdyYXBoLmxpbmtzLnB1c2gobmV3IEdyYXBoTGluayhncmFwaE5vZGUsIGdldEdyYXBoTm9kZShyZWYudGFyZ2V0Tm9kZSksIHJlZi5sYWJlbCkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGdldEdyYXBoTm9kZShub2RlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgICAgICAkLmVhY2goZ3JhcGgubm9kZXMsIGZ1bmN0aW9uKGksIGdyYXBoTm9kZSkge1xuICAgICAgICAgICAgaWYgKGdyYXBoTm9kZS5ub2RlID09IG5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBncmFwaE5vZGU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JhcGg7XG59XG5cbmZ1bmN0aW9uIEdyYXBoKCkge1xuICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgICB0aGlzLmxpbmtzID0gW107XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIEdyYXBoTm9kZShub2RlKSB7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gR3JhcGhMaW5rKHNvdXJjZSwgdGFyZ2V0LCBsYWJlbCkge1xuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluZm9Db250YWluZXJJZCwgdGl0bGUpIHtcbiAgICAvLyBTZXQgaGVhZGluZ1xuICAgICQoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQgKyBcIiBoMVwiKS50ZXh0KHRpdGxlKTtcblxuICAgIHRoaXMuc2hvd05vZGUgPSBmdW5jdGlvbihub2RlLCBmaWxsQ29sb3IpIHtcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoMlwiKS50ZXh0KG5vZGUubGFiZWwoKSk7XG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaGVhZGVyXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgZmlsbENvbG9yKTtcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtc2hlZXQtbmFtZVwiKS50ZXh0KG5vZGUubm9kZUdyb3VwLm5hbWUpO1xuXG4gICAgICAgIHZhciB1bCA9ICQoXCIjZDNzaGVldC1ub2RlLXByb3BlcnRpZXNcIik7XG4gICAgICAgIHVsLmVtcHR5KCk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIHByb3BlcnRpZXNcbiAgICAgICAgJC5lYWNoKG5vZGUucHJvcGVydGllcywgZnVuY3Rpb24oaSwgbm9kZVByb3BlcnR5KSB7XG4gICAgICAgICAgICBpZiAobm9kZVByb3BlcnR5Lm5hbWUgIT0gbm9kZS5sYWJlbFByb3BlcnR5TmFtZSlcbiAgICAgICAgICAgICAgICBhZGRQcm9wZXJ0eShub2RlUHJvcGVydHkubmFtZSwgbm9kZVByb3BlcnR5LnZhbHVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gR3JvdXAgbm9kZSBsaW5rc1xuICAgICAgICB2YXIgZ3JvdXBlZExpbmtzID0ge307XG4gICAgICAgICQuZWFjaChub2RlLnJlZnMsIGZ1bmN0aW9uKGksIHJlZikge1xuICAgICAgICAgICAgdmFyIGxpbmtOYW1lID0gcmVmLmxhYmVsO1xuICAgICAgICAgICAgaWYgKGxpbmtOYW1lID09IG51bGwpXG4gICAgICAgICAgICAgICAgbGlua05hbWUgPSByZWYudGFyZ2V0Tm9kZS5ub2RlR3JvdXAubmFtZTtcblxuICAgICAgICAgICAgaWYgKGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0gPT0gbnVsbClcbiAgICAgICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdID0gW107XG5cbiAgICAgICAgICAgIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0ucHVzaChyZWYudGFyZ2V0Tm9kZS5sYWJlbCgpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIGxpbmtzXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhncm91cGVkTGlua3MpO1xuICAgICAgICAkLmVhY2gobGlua05hbWVzLCBmdW5jdGlvbihpLCBsaW5rTmFtZSkge1xuICAgICAgICAgICAgYWRkUHJvcGVydHkobGlua05hbWUsIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0uam9pbihcIiwgXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHVsLmFwcGVuZChcIjxsaT48c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LW5hbWVcXFwiPlwiICsgbmFtZSArXG4gICAgICAgICAgICAgICAgXCI6PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LXZhbHVlXFxcIj5cIiArIGZvcm1hdFZhbHVlKHZhbHVlKSArIFwiPC9zcGFuPjwvbGk+XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSgwLCBcIjRcIikudG9Mb3dlckNhc2UoKSA9PSBcImh0dHBcIilcbiAgICAgICAgICAgICAgICByZXR1cm4gXCI8YSBocmVmPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiPlwiICsgdmFsdWUgKyBcIjwvYT5cIlxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKCk7XG5cbiAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCk7XG4gICAgbW9kZWwubm9kZUdyb3VwcyA9IGdldE5vZGVHcm91cHMoc3ByZWFkc2hlZXQsIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzKTtcbiAgICBpZiAobm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgIT0gbnVsbClcbiAgICAgICAgbW9kZWwuc2V0dGluZ3MgPSBzcHJlYWRzaGVldC5zaGVldHNbbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWVdO1xuXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMpIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5vZGVzIHdpdGggcHJvcGVydGllc1xuICAgICAgICB2YXIgbm9kZUdyb3VwcyA9IG5ldyBOb2RlR3JvdXBzKCk7XG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xuICAgICAgICAgICAgbm9kZUdyb3Vwcy5pdGVtcy5wdXNoKGdldE5vZGVzKHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBOYW1lXSwgbm9kZUdyb3VwTmFtZSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgcmVmZXJlbmNlcyBmcm9tIG5vZGUgc2hlZXRzXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBzLml0ZW1zLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcbiAgICAgICAgICAgIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cC5uYW1lXSwgbm9kZUdyb3VwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSByZWZlcmVuY2Ugc2hlZXRzXG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVmcyhub2RlR3JvdXBzLCBub2RlU2hlZXQsIG5vZGVHcm91cCkge1xuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gbm9kZVNoZWV0LmhlYWRlcigpO1xuXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCBjb2x1bW5zXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG5vZGVTaGVldC52YWx1ZShyb3csIGNvbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgcmVmZXJlbmNlIGNvbHVtblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVmVGFyZ2V0ID0gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVmVGFyZ2V0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gocmVmVGFyZ2V0Lm5vZGVHcm91cC5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBXZSBzaG91bGQgcHJvcGVybHkgc3BsaXQgdmFsdWVzIHVzaW5nIGNvbW1hXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YodGFyZ2V0Tm9kZS52YWx1ZShyZWZUYXJnZXQucHJvcGVydHlOYW1lKSkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlR3JvdXAubm9kZXNbaSAtIDFdLnJlZnMucHVzaChuZXcgUmVmKHRhcmdldE5vZGUsIHJlZlRhcmdldC5sYWJlbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCwgbm9kZUdyb3VwTmFtZSkge1xuICAgICAgICAgICAgdmFyIGhlYWRlciA9IG5vZGVTaGVldC5oZWFkZXIoKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgTm9kZUdyb3VwKG5vZGVHcm91cE5hbWUsIGhlYWRlclswXSk7XG5cbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2gobmV3IE5vZGUoZ2V0Tm9kZVByb3BlcnRpZXMocm93LCBoZWFkZXIpLCByZXN1bHQpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BlcnRpZXMocm93LCBoZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IFtdO1xuICAgICAgICAgICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xuICAgICAgICAgICAgICAgIHZhciBjb2xOYW1lID0gaGVhZGVyW3Jvd0NlbGwuY29sSW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllcy5wdXNoKG5ldyBOb2RlUHJvcGVydHkoY29sTmFtZSwgcm93Q2VsbC52YWx1ZSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZVByb3BlcnRpZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZUdyb3VwcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCkge1xuICAgICAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSB7XG4gICAgICAgICAgICBub2RlR3JvdXBOYW1lczogW10sXG4gICAgICAgICAgICByZWZTaGVldE5hbWVzOiBbXSxcbiAgICAgICAgICAgIHNldHRpbmdzR3JvdXBOYW1lOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQuc2hlZXRzKTtcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSA9IHNoZWV0TmFtZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgcmVmU2hlZXQgPSBwYXJzZVJlZlNoZWV0TmFtZShzaGVldE5hbWUpXG4gICAgICAgICAgICBpZiAoKHJlZlNoZWV0ICE9IG51bGwpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC5zb3VyY2UpID4gLTEpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC50YXJnZXQpID4gLTEpKSB7XG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMucmVmU2hlZXROYW1lcy5wdXNoKHNoZWV0TmFtZSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzLnB1c2goc2hlZXROYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGVHcm91cFR5cGVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uUmVmTmFtZShjb2xOYW1lLCBub2RlR3JvdXBzKSB7XG4gICAgICAgIHZhciByZWZOYW1lcyA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xuICAgICAgICB2YXIgbm9kZUdyb3VwID0gbnVsbDtcbiAgICAgICAgaWYgKHJlZk5hbWVzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICBub2RlR3JvdXAgPSBub2RlR3JvdXBzLmdldEJ5TmFtZShyZWZOYW1lc1swXSk7XG4gICAgICAgIGlmICgocmVmTmFtZXMubGVuZ3RoID49IDIpICYmXG4gICAgICAgICAgICAobm9kZUdyb3VwICE9IG51bGwpKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIG5vZGVHcm91cDogbm9kZUdyb3VwLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogcmVmTmFtZXNbMV1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlZk5hbWVzLmxlbmd0aCA9PSAzKVxuICAgICAgICAgICAgICAgIHJlc3VsdC5sYWJlbCA9IHJlZk5hbWVzWzJdO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VSZWZTaGVldE5hbWUoc2hlZXROYW1lKSB7XG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxuICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZGVsO1xufVxuXG5mdW5jdGlvbiBNb2RlbCgpIHtcbiAgICB0aGlzLm5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuTW9kZWwucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uKGYpIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IE1vZGVsKCk7XG4gICAgcmVzdWx0Lm5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xuXG4gICAgLy8gRmlsdGVyIGFuZCBjb3B5IG5vZGUgZ3JvdXBcbiAgICAkLmVhY2godGhpcy5ub2RlR3JvdXBzLml0ZW1zLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcbiAgICAgICAgdmFyIG5vZGVHcm91cENvcHkgPSBub2RlR3JvdXAuY29weSgpO1xuICAgICAgICBpZiAoZihub2RlR3JvdXApKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgcmVmZXJlbmNlcyB0byBmaWx0ZXJlZCBub2RlIGdyb3Vwc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVHcm91cC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBub2RlQ29weSA9IG5vZGUuY29weSgpO1xuICAgICAgICAgICAgICAgIHZhciByZWZzVG9SZW1vdmUgPSBbXTtcbiAgICAgICAgICAgICAgICAkLmVhY2gobm9kZUNvcHkucmVmcywgZnVuY3Rpb24oaywgcmVmKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZihyZWYudGFyZ2V0Tm9kZS5ub2RlR3JvdXApKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmc1RvUmVtb3ZlLnB1c2hba107XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGsgPSByZWZzVG9SZW1vdmUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgICAgICAgICAgICAgIG5vZGVDb3B5LnJlZnMuc3BsaWNlKHJlZnNUb1JlbW92ZVtrXSwgMSk7XG5cbiAgICAgICAgICAgICAgICBub2RlR3JvdXAubm9kZXMucHVzaChub2RlQ29weSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVzdWx0Lm5vZGVHcm91cHMuaXRlbXMucHVzaChub2RlR3JvdXBDb3B5KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmVzdWx0LnNldHRpbmdzID0gdGhpcy5zZXR0aW5ncztcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBOb2RlR3JvdXBzKCkge1xuICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuTm9kZUdyb3Vwcy5wcm90b3R5cGUuZ2V0QnlOYW1lID0gZnVuY3Rpb24obm9kZUdyb3VwTmFtZSkge1xuICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgICQuZWFjaCh0aGlzLml0ZW1zLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcbiAgICAgICAgaWYgKG5vZGVHcm91cC5uYW1lID09IG5vZGVHcm91cE5hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5vZGVHcm91cDtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIE5vZGVHcm91cChuYW1lLCBsYWJlbFByb3BlcnR5TmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5sYWJlbFByb3BlcnR5TmFtZSA9IGxhYmVsUHJvcGVydHlOYW1lO1xuICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuTm9kZUdyb3VwLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlR3JvdXAodGhpcy5uYW1lLCB0aGlzLmxhYmVsUHJvcGVydHlOYW1lKTtcbiAgICByZXN1bHQubm9kZXMgPSB0aGlzLm5vZGVzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gTm9kZShwcm9wZXJ0aWVzLCBub2RlR3JvdXApIHtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIHRoaXMucmVmcyA9IFtdO1xuICAgIHRoaXMubm9kZUdyb3VwID0gbm9kZUdyb3VwO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlKHRoaXMucHJvcGVydGllcywgdGhpcy5ub2RlR3JvdXApO1xuICAgIHJlc3VsdC5yZWZzID0gdGhpcy5yZWZzLnNsaWNlKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuTm9kZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAkLmVhY2godGhpcy5wcm9wZXJ0aWVzLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAocHJvcGVydHkubmFtZSA9PSBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuTm9kZS5wcm90b3R5cGUubGFiZWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZSh0aGlzLm5vZGVHcm91cC5sYWJlbFByb3BlcnR5TmFtZSk7XG59XG5cbmZ1bmN0aW9uIE5vZGVQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBSZWYodGFyZ2V0Tm9kZSwgbGFiZWwpIHtcbiAgICB0aGlzLnRhcmdldE5vZGUgPSB0YXJnZXROb2RlO1xuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xuICAgIC8vIEdldCBzaGVldCBjb3VudFxuICAgIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24gb25TdWNjZXNzKGluZm8pIHtcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbykge1xuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSBuZXcgU3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGluZm8udGl0bGUpO1xuICAgICAgICB2YXIgbG9hZGVkU2hlZXRDb3VudCA9IDA7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gaW5mby5zaGVldENvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIGkpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkU2hlZXRDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkZWRTaGVldENvdW50ID09IGluZm8uc2hlZXRDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBvbkxvYWRlZChzcHJlYWRzaGVldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXQuc2hlZXRzW3Jlc3BvbnNlLmZlZWQudGl0bGUuJHRdID0gbmV3IFNoZWV0KCk7XG5cbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZS5ncyRjZWxsLnJvdyAtIDE7XG4gICAgICAgICAgICAgICAgaWYgKHNoZWV0LnJvd3NbaW5kZXhdID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF0gPSBuZXcgUm93KGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF0ucm93Q2VsbHMucHVzaChuZXcgUm93Q2VsbChlLmdzJGNlbGwuY29sIC0gMSwgZS5jb250ZW50LiR0KSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gU29ydCByb3cgY2VsbHMgYnkgY29sIGluZGV4XG4gICAgICAgICAgICAkLmVhY2goc2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgcm93LnJvd0NlbGxzLnNvcnQoZnVuY3Rpb24oYzEsIGMyKSB7IHJldHVybiBjMS5jb2xJbmRleCAtIGMyLmNvbEluZGV4OyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbi8vICAgIGZ1bmN0aW9uIGxvYWRTZXR0aW5nc1NoZWV0KHNldHRpbmdzU2hlZXQsIHNwcmVhZHNoZWV0KSB7XG4vLyAgICAgICAgLy8gTWFwIGNlbGxzIHRvIGxpc3Rcbi8vICAgICAgICB2YXIgc2V0dGluZ3NMaXN0ID0ge307XG4vLyAgICAgICAgJC5lYWNoKHNldHRpbmdzU2hlZXQuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xuLy8gICAgICAgICAgICBpZiAoc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddID09IG51bGwpXG4vLyAgICAgICAgICAgICAgICBzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10gPSB7fTtcbi8vXG4vLyAgICAgICAgICAgIGlmIChlLmdzJGNlbGwuY29sID09IDEpXG4vLyAgICAgICAgICAgICAgICBzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10ua2V5ID0gZS5jb250ZW50LiR0O1xuLy8gICAgICAgICAgICBlbHNlXG4vLyAgICAgICAgICAgICAgICBpZiAoZS5ncyRjZWxsLmNvbCA9PSAyKVxuLy8gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XS52YWx1ZSA9IGUuY29udGVudC4kdDtcbi8vICAgICAgICB9KTtcbi8vXG4vLyAgICAgICAgLy8gTWFwIGxpc3QgdG8gb2JqZWN0XG4vLyAgICAgICAgJC5lYWNoKHNldHRpbmdzTGlzdCwgZnVuY3Rpb24oaSwgcykge1xuLy8gICAgICAgICAgICBpZiAoKHMua2V5ID09IG51bGwpIHx8IChzLnZhbHVlID09IG51bGwpKVxuLy8gICAgICAgICAgICAgICAgcmV0dXJuO1xuLy9cbi8vICAgICAgICAgICAgLy8gQ3JlYXRlIGlubmVyIG9iamVjdHNcbi8vICAgICAgICAgICAgdmFyIHBhdGggPSBzLmtleS5zcGxpdChcIi5cIik7XG4vLyAgICAgICAgICAgIHZhciBjdXJyZW50ID0gc3ByZWFkc2hlZXQuc2V0dGluZ3M7XG4vLyAgICAgICAgICAgICQuZWFjaChwYXRoLCBmdW5jdGlvbihqLCBrKSB7XG4vLyAgICAgICAgICAgICAgICBpZiAoY3VycmVudFtrXSA9PSBudWxsKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgaWYgKGogPT0gcGF0aC5sZW5ndGggLSAxKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50W2tdID0gcy52YWx1ZTtcbi8vICAgICAgICAgICAgICAgICAgICBlbHNlXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSB7fTtcbi8vICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W2tdO1xuLy8gICAgICAgICAgICB9KTtcbi8vICAgICAgICB9KTtcbi8vICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBvblN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2hlZXRDb3VudDogcmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiByZXNwb25zZS5mZWVkLnRpdGxlLiR0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gU3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIHRpdGxlKSB7XG4gICAgdGhpcy5rZXkgPSBzcHJlYWRzaGVldEtleTtcbiAgICB0aGlzLnRpdGxlID0gdGl0bGU7XG4gICAgdGhpcy5zaGVldHMgPSBuZXcgU2hlZXRzKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gU2hlZXRzKCkge1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBTaGVldCgpIHtcbiAgICB0aGlzLnJvd3MgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuU2hlZXQucHJvdG90eXBlLmhlYWRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnJvd3NbMF0udmFsdWVzKCk7XG59XG5cblNoZWV0LnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKHJvdywgY29sTmFtZSkge1xuICAgIHZhciBjb2xJbmRleCA9IHRoaXMuaGVhZGVyKCkuaW5kZXhPZihjb2xOYW1lKTtcbiAgICBpZiAoY29sSW5kZXggPT0gLTEpXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xuICAgICAgICBpZiAocm93Q2VsbC5jb2xJbmRleCA9PSBjb2xJbmRleCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcm93Q2VsbC52YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gUm93KHJvd0luZGV4KSB7XG4gICAgdGhpcy5yb3dJbmRleCA9IHJvd0luZGV4O1xuICAgIHRoaXMucm93Q2VsbHMgPSBbXTtcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5Sb3cucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkLm1hcCh0aGlzLnJvd0NlbGxzLCBmdW5jdGlvbihyb3dDZWxsLCBpKSB7XG4gICAgICAgIHJldHVybiByb3dDZWxsLnZhbHVlO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBSb3dDZWxsKGNvbEluZGV4LCB2YWx1ZSkge1xuICAgIHRoaXMuY29sSW5kZXggPSBjb2xJbmRleDtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2RlbCwgdXBkYXRlR3JhcGgpIHtcbiAgICBpbml0Tm9kZVZpc2liaWxpdHkobW9kZWwubm9kZUdyb3Vwcyk7XG5cbiAgICBmdW5jdGlvbiBpbml0Tm9kZVZpc2liaWxpdHkobm9kZUdyb3Vwcykge1xuICAgICAgICAvLyBDcmVhdGUgdmlzaWJpbGl0eSBjaGVja2JveGVzXG4gICAgICAgIHZhciBlID0gJChcIiNkM3NoZWV0LW5vZGUtdmlzaWJpbGl0eVwiKTtcbiAgICAgICAgJC5lYWNoKG5vZGVHcm91cHMuaXRlbXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cCkge1xuICAgICAgICAgICAgdmFyIGVJZCA9IG5vZGVWaXNpYmxpdHlDaGVja2JveElkKG5vZGVHcm91cCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBjaGVja2JveFxuICAgICAgICAgICAgZS5hcHBlbmQoXCI8ZGl2IGNsYXNzPVxcXCJjaGVja2JveFxcXCI+PGxhYmVsPlwiICtcbiAgICAgICAgICAgICAgICBcIjxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgaWQ9XFxcIlwiICsgZUlkICsgXCJcXFwiIGNoZWNrZWQ9XFxcImNoZWNrZWRcXFwiPlwiICsgbm9kZUdyb3VwLm5hbWUgKyBcIjwvbGFiZWw+PC9kaXY+XCIpO1xuXG4gICAgICAgICAgICAvLyBBZGQgY2xpY2sgaGFuZGxlclxuICAgICAgICAgICAgJChcIiNcIiArIGVJZCkuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlVmlldygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVZpZXcoKSB7XG4gICAgICAgIHVwZGF0ZUdyYXBoKG5ldyBWaWV3T3B0aW9ucyhnZXROb2RlVmlzaWJpbGl0eShtb2RlbC5ub2RlR3JvdXBzKSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5vZGVWaXNpYmlsaXR5KG5vZGVHcm91cHMpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICAkLmVhY2gobm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XG4gICAgICAgICAgICB2YXIgaXNWaXNpYmxlID0gJChcIiNcIiArIG5vZGVWaXNpYmxpdHlDaGVja2JveElkKG5vZGVHcm91cCkpLmlzKFwiOmNoZWNrZWRcIik7XG4gICAgICAgICAgICByZXN1bHRbbm9kZUdyb3VwLm5hbWVdID0gaXNWaXNpYmxlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub2RlVmlzaWJsaXR5Q2hlY2tib3hJZChub2RlR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIFwiZDNzaGVldC1ub2RlLXZpc2liaWxpdHktXCIgKyBub2RlR3JvdXAubmFtZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIFZpZXdPcHRpb25zKG5vZGVWaXNpYmlsaXR5KSB7XG4gICAgdGhpcy5ub2RlVmlzaWJpbGl0eSA9IG5vZGVWaXNpYmlsaXR5O1xuICAgIHJldHVybiB0aGlzO1xufSJdfQ==
