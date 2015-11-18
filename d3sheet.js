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
        spreadsheet(spreadsheetKey, function(spreadsheetData) {
            d3sheet.spreadsheet = spreadsheetData;

            // Create model from spreadsheet
            var model = require("./model");
            d3sheet.model = model(d3sheet.spreadsheet);

            // Create graph from model
            var graph = require("./graph");
            d3sheet.graph = graph(d3sheet.model);

            // Create D3 force layout from graph
            var force = require("./force");
            force(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg);
        });
    }

    function checkRequirements() {
        if (typeof d3 === "undefined")
            throw new Error("D3 library not found!");
        if (typeof $ === "undefined")
            throw new Error("jQuery not found!");
    }
}();
},{"./force":2,"./graph":3,"./model":4,"./spreadsheet":5}],2:[function(require,module,exports){
module.exports = function(graph, svgContainerId, svg) {
    var node = [],
        link = [],
        linkLabel = [];

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

    function restart() {
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

        node = svg.selectAll(".node").data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("x", 0)
            .attr("y", 0)
//            .attr("id", nodeId)
            .call(force.drag);
//            .on("click", function(node) {
//                modelController.showInfo(node, model);
//                view.selectNode(node);
//            });

        var circle = node.append("circle")
            .attr("r", 30); // TODO: Settings

//        node.append("text")
//            .attr("dy", ".35em")
//            .attr("text-anchor", "middle")
//            .text(nodeText);

        selectAll();
        force.start();
    }

    function selectAll() {
        node = svg.selectAll(".node");
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
    }
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
        });
    });

    // Create links
    $.each(model.sheets, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // For all link names
            $.each(sheet.linkNames, function(k, linkName) {
                // For all target nodes
                $.each(node[linkName], function(l, targetIndex) {
                    var link = {
                        source: node.graphIndex,
                        target: targetIndex
                    };
                    graph.links.push(link);
                });
            });
        });
    });

    return graph;
}
},{}],4:[function(require,module,exports){
module.exports = function(spreadsheet) {
    var model = {
        sheets: {},
        settings: {}
    };

    var sheetTypes = getSheetTypes(spreadsheet);
    model.sheets = getGraph(spreadsheet, sheetTypes.nodesSheetNames);
    if (sheetTypes.settingsSheetName != null)
        model.settings = spreadsheet[sheetTypes.settingsSheetName];

    function getGraph(spreadsheet, nodeSheetNames) {
        // Create nodes with properties
        var sheets = {};
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            sheets[nodeSheetName] = getNodes(spreadsheet[nodeSheetName]);
        });

        // Create link names
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinkNames(sheets, spreadsheet[nodeSheetName], nodeSheetName);
        });

        // Create links from node sheets
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinks(sheets, spreadsheet[nodeSheetName], nodeSheetName);
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
                            if (row[colName].indexOf(targetNode[linkTarget.propertyName]) > -1) {
                                if (source.nodes[i][linkTarget.sheetName] == null)
                                    source.nodes[i][linkTarget.sheetName] = [];

                                // Add index of the target node to the source node
                                source.nodes[i][linkTarget.sheetName].push(k);
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
                    source.linkNames.push(linkTarget.sheetName);
            });
        }

        function getNodes(nodeSheet) {
            var result = {
                label: nodeSheet.header[0],
                propertyNames: [],
                linkNames: [],
                nodes: []
            };

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                result.nodes.push(getNodeProperties(row));
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
        var sheetNames = Object.keys(spreadsheet);
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
        if ((linkNames.length == 2) &&
            (sheets[linkNames[0]] != null) &&
            (sheets[linkNames[0]].propertyNames.indexOf(linkNames[1]) > -1)) {
            return {
                sheetName: linkNames[0],
                propertyName: linkNames[1]
            }
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
},{}],5:[function(require,module,exports){
module.exports = function(spreadsheetKey, onLoaded) {
    // Get sheet count
    getSheetCount(spreadsheetKey, function onSuccess(sheetCount) {
        // Load all sheets
        loadSheets(spreadsheetKey, sheetCount);
    });

    function loadSheets(spreadsheetKey, sheetCount) {
        var spreadsheet = {};
        var loadedSheetCount = 0;
        for (i = 1; i <= sheetCount; i++) {
            loadSheet(spreadsheet, spreadsheetKey, i).then(function() {
                loadedSheetCount += 1;
                if (loadedSheetCount == sheetCount) {
                    onLoaded(spreadsheet);
                }
            })
        }
    }

    function loadSheet(spreadsheet, spreadsheetKey, sheetIndex) {
        return getSheet(spreadsheetKey, sheetIndex, function(response) {
            var sheet = spreadsheet[response.feed.title.$t] = {
                header: [],
                rows: [],
            };

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

    function getSheet(spreadsheetKey, sheetIndex, onSuccess) {
        return $.ajax({
            url: "https://spreadsheets.google.com/feeds/cells/" + spreadsheetKey + "/" + sheetIndex + "/public/values?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: onSuccess
        });
    }

    function getSheetCount(spreadsheetKey, onSuccess) {
        $.ajax({
            url: "https://spreadsheets.google.com/feeds/worksheets/" + spreadsheetKey + "/public/full?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: function(response) {
                onSuccess(response.feed.entry.length);
            }
        });
    }
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcclxuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XHJcblxyXG4gICAgdmFyIGQzc2hlZXQgPSB7XHJcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXHJcbiAgICAgICAgc3ZnQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgaW5mb0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIHN2Zzoge30sXHJcbiAgICAgICAgc3ByZWFkc2hlZXQ6IHt9LFxyXG4gICAgICAgIG1vZGVsOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXHJcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XHJcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIHN2Z0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LXN2Z1wiO1xyXG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcclxuXHJcbiAgICAgICAgaWYgKGluZm9Db250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xyXG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgU1ZHIGVsZW1lbnRcclxuICAgICAgICBkM3NoZWV0LnN2ZyA9IGQzLnNlbGVjdChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxyXG4gICAgICAgICAgICAuYXR0cigndmlld0JveCcsIFwiMCAwIFwiICsgd2lkdGggKyBcIiBcIiArIGhlaWdodCk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBpbmZvIHBhbmVsXHJcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gZDNzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQubG9hZCA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5KSB7XHJcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHJlcXVpcmUoXCIuL3NwcmVhZHNoZWV0XCIpO1xyXG4gICAgICAgIHNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbihzcHJlYWRzaGVldERhdGEpIHtcclxuICAgICAgICAgICAgZDNzaGVldC5zcHJlYWRzaGVldCA9IHNwcmVhZHNoZWV0RGF0YTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWwoZDNzaGVldC5zcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxyXG4gICAgICAgICAgICB2YXIgZ3JhcGggPSByZXF1aXJlKFwiLi9ncmFwaFwiKTtcclxuICAgICAgICAgICAgZDNzaGVldC5ncmFwaCA9IGdyYXBoKGQzc2hlZXQubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBmb3JjZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xyXG4gICAgICAgICAgICBmb3JjZShkM3NoZWV0LmdyYXBoLCBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkLCBkM3NoZWV0LnN2Zyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlbWVudHMoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBkMyA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgJCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IG5vdCBmb3VuZCFcIik7XHJcbiAgICB9XHJcbn0oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdyYXBoLCBzdmdDb250YWluZXJJZCwgc3ZnKSB7XHJcbiAgICB2YXIgbm9kZSA9IFtdLFxyXG4gICAgICAgIGxpbmsgPSBbXSxcclxuICAgICAgICBsaW5rTGFiZWwgPSBbXTtcclxuXHJcbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICBzZWxlY3RBbGwoKTtcclxuXHJcbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxyXG4gICAgICAgIC5zaXplKFt3aWR0aCwgaGVpZ2h0XSlcclxuICAgICAgICAubGlua0Rpc3RhbmNlKDMwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmNoYXJnZSgtNTAwMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ncmF2aXR5KDAuNSkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ub2RlcyhncmFwaC5ub2RlcylcclxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgLm9uKFwidGlja1wiLCBvblRpY2spO1xyXG5cclxuICAgIHJlc3RhcnQoKTtcclxuXHJcbiAgICBmdW5jdGlvbiByZXN0YXJ0KCkge1xyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIik7XHJcblxyXG4vLyAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpLmRhdGEoZ3JhcGgubGlua3MpXHJcbi8vICAgICAgICAgICAgLmVudGVyKClcclxuLy8gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4vLyAgICAgICAgICAgIC50ZXh0KGxpbmtUZXh0KVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcclxuXHJcbiAgICAgICAgbm9kZSA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKS5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgMClcclxuLy8gICAgICAgICAgICAuYXR0cihcImlkXCIsIG5vZGVJZClcclxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZyk7XHJcbi8vICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24obm9kZSkge1xyXG4vLyAgICAgICAgICAgICAgICBtb2RlbENvbnRyb2xsZXIuc2hvd0luZm8obm9kZSwgbW9kZWwpO1xyXG4vLyAgICAgICAgICAgICAgICB2aWV3LnNlbGVjdE5vZGUobm9kZSk7XHJcbi8vICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBjaXJjbGUgPSBub2RlLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMzApOyAvLyBUT0RPOiBTZXR0aW5nc1xyXG5cclxuLy8gICAgICAgIG5vZGUuYXBwZW5kKFwidGV4dFwiKVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuLy8gICAgICAgICAgICAudGV4dChub2RlVGV4dCk7XHJcblxyXG4gICAgICAgIHNlbGVjdEFsbCgpO1xyXG4gICAgICAgIGZvcmNlLnN0YXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2VsZWN0QWxsKCkge1xyXG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XHJcbiAgICAgICAgbGluayA9IHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKTtcclxuICAgICAgICBsaW5rTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25UaWNrKCkge1xyXG4gICAgICAgIGxpbmsuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lnk7IH0pO1xyXG5cclxuICAgICAgICBsaW5rTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnkgKyBkLnRhcmdldC55KS8yOyB9KTtcclxuXHJcbiAgICAgICAgbm9kZS5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC54ICsgXCIsXCIgKyBkLnkgKyBcIilcIjtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcclxuICAgIHZhciBncmFwaCA9IHtcclxuICAgICAgICBub2RlczogW10sXHJcbiAgICAgICAgbGlua3M6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZvciBhbGwgc2hlZXRzXHJcbiAgICAkLmVhY2gobW9kZWwuc2hlZXRzLCBmdW5jdGlvbihpLCBzaGVldCkge1xyXG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcclxuICAgICAgICAkLmVhY2goc2hlZXQubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcclxuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcclxuICAgICAgICAgICAgbm9kZS5ncmFwaEluZGV4ID0gZ3JhcGgubm9kZXMucHVzaChub2RlKSAtIDE7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgbGlua3NcclxuICAgICQuZWFjaChtb2RlbC5zaGVldHMsIGZ1bmN0aW9uKGksIHNoZWV0KSB7XHJcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xyXG4gICAgICAgICQuZWFjaChzaGVldC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIGxpbmsgbmFtZXNcclxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LmxpbmtOYW1lcywgZnVuY3Rpb24oaywgbGlua05hbWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgdGFyZ2V0IG5vZGVzXHJcbiAgICAgICAgICAgICAgICAkLmVhY2gobm9kZVtsaW5rTmFtZV0sIGZ1bmN0aW9uKGwsIHRhcmdldEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmsgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZS5ncmFwaEluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHRhcmdldEluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKGxpbmspO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGdyYXBoO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xyXG4gICAgdmFyIG1vZGVsID0ge1xyXG4gICAgICAgIHNoZWV0czoge30sXHJcbiAgICAgICAgc2V0dGluZ3M6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBzaGVldFR5cGVzID0gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCk7XHJcbiAgICBtb2RlbC5zaGVldHMgPSBnZXRHcmFwaChzcHJlYWRzaGVldCwgc2hlZXRUeXBlcy5ub2Rlc1NoZWV0TmFtZXMpO1xyXG4gICAgaWYgKHNoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWUgIT0gbnVsbClcclxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0W3NoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWVdO1xyXG5cclxuICAgIGZ1bmN0aW9uIGdldEdyYXBoKHNwcmVhZHNoZWV0LCBub2RlU2hlZXROYW1lcykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBub2RlcyB3aXRoIHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgc2hlZXRzID0ge307XHJcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIHNoZWV0c1tub2RlU2hlZXROYW1lXSA9IGdldE5vZGVzKHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmsgbmFtZXNcclxuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua05hbWVzKHNoZWV0cywgc3ByZWFkc2hlZXRbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgbGlua3MgZnJvbSBub2RlIHNoZWV0c1xyXG4gICAgICAgICQuZWFjaChub2RlU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBjcmVhdGVMaW5rcyhzaGVldHMsIHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIGxpbmtzIGZyb20gbGluayBzaGVldHNcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua3Moc2hlZXRzLCBub2RlU2hlZXQsIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHNoZWV0c1tub2RlU2hlZXROYW1lXTtcclxuXHJcbiAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgcm93c1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCBjb2x1bW5zXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBPYmplY3Qua2V5cyhyb3cpO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGxpbmsgY29sdW1uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBwYXJzZUNvbHVtbkxpbmtOYW1lKGNvbE5hbWUsIHNoZWV0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goc2hlZXRzW2xpbmtUYXJnZXQuc2hlZXROYW1lXS5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgbWF0Y2hlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvd1tjb2xOYW1lXS5pbmRleE9mKHRhcmdldE5vZGVbbGlua1RhcmdldC5wcm9wZXJ0eU5hbWVdKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5ub2Rlc1tpXVtsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLm5vZGVzW2ldW2xpbmtUYXJnZXQuc2hlZXROYW1lXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlIHRvIHRoZSBzb3VyY2Ugbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ub2Rlc1tpXVtsaW5rVGFyZ2V0LnNoZWV0TmFtZV0ucHVzaChrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua05hbWVzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBzaGVldHNbbm9kZVNoZWV0TmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgbGluayBuYW1lc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LmhlYWRlciwgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUocHJvcGVydHlOYW1lLCBzaGVldHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2UubGlua05hbWVzLnB1c2gobGlua1RhcmdldC5zaGVldE5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgbGFiZWw6IG5vZGVTaGVldC5oZWFkZXJbMF0sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGxpbmtOYW1lczogW10sXHJcbiAgICAgICAgICAgICAgICBub2RlczogW11cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2goZ2V0Tm9kZVByb3BlcnRpZXMocm93KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHByb3BlcnR5IG5hbWVzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQuaGVhZGVyLCBmdW5jdGlvbihpLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnByb3BlcnR5TmFtZXMucHVzaChjb2xOYW1lKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BlcnRpZXMocm93KSB7XHJcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBPYmplY3Qua2V5cyhyb3cpO1xyXG4gICAgICAgICAgICAkLmVhY2goY29sTmFtZXMsIGZ1bmN0aW9uKGksIGNvbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQcm9wZXJ0aWVzW2NvbE5hbWVdID0gcm93W2NvbE5hbWVdO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNoZWV0cztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldFR5cGVzKHNwcmVhZHNoZWV0KSB7XHJcbiAgICAgICAgdmFyIHNoZWV0VHlwZXMgPSB7XHJcbiAgICAgICAgICAgIG5vZGVzU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIGxpbmtTaGVldE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgc2V0dGluZ3NTaGVldE5hbWU6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgICAgICQuZWFjaChzaGVldE5hbWVzLCBmdW5jdGlvbihpLCBzaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWUgPSBzaGVldE5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgbGlua1NoZWV0ID0gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSlcclxuICAgICAgICAgICAgaWYgKChsaW5rU2hlZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnNvdXJjZSkgPiAtMSkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnRhcmdldCkgPiAtMSkpIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMubGlua1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHNoZWV0VHlwZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBzaGVldHMpIHtcclxuICAgICAgICB2YXIgbGlua05hbWVzID0gY29sTmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgaWYgKChsaW5rTmFtZXMubGVuZ3RoID09IDIpICYmXHJcbiAgICAgICAgICAgIChzaGVldHNbbGlua05hbWVzWzBdXSAhPSBudWxsKSAmJlxyXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0ucHJvcGVydHlOYW1lcy5pbmRleE9mKGxpbmtOYW1lc1sxXSkgPiAtMSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0TmFtZTogbGlua05hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiBsaW5rTmFtZXNbMV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSkge1xyXG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xyXG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2RlbDtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXksIG9uTG9hZGVkKSB7XHJcbiAgICAvLyBHZXQgc2hlZXQgY291bnRcclxuICAgIGdldFNoZWV0Q291bnQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhzaGVldENvdW50KSB7XHJcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXHJcbiAgICAgICAgbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgc2hlZXRDb3VudCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBzaGVldENvdW50KSB7XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0ge307XHJcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gc2hlZXRDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIGkpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBsb2FkZWRTaGVldENvdW50ICs9IDE7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBzaGVldENvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICB2YXIgc2hlZXQgPSBzcHJlYWRzaGVldFtyZXNwb25zZS5mZWVkLnRpdGxlLiR0XSA9IHtcclxuICAgICAgICAgICAgICAgIGhlYWRlcjogW10sXHJcbiAgICAgICAgICAgICAgICByb3dzOiBbXSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS5ncyRjZWxsLnJvdyA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hlZXQuaGVhZGVyW2UuZ3MkY2VsbC5jb2wgLSAxXSA9IGUuY29udGVudC4kdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGUuZ3MkY2VsbC5yb3cgLSAyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdW3NoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV1dID0gZS5jb250ZW50LiR0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldENvdW50KHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhyZXNwb25zZS5mZWVkLmVudHJ5Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSJdfQ==
