(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.d3sheet = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
!function() {
    checkRequirements();

    var d3sheet = {
        ver: "1.0.0",
        db: {},
        model: {},
        nodes: []
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

        var $svgContainerId = $("#" + svgContainerId),
            width = $svgContainerId.width(),
            height = $svgContainerId.height();

        // Create SVG element
        d3.select("#" + svgContainerId)
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
            d3sheet.db = spreadsheetData;

            // Create model from DB
            var model = require("./model");
            d3sheet.model = model(d3sheet.db);

            // Create graph from model
            var graph = require("./graph");
            d3sheet.graph = graph(model);

            // Create D3 force layout from graph
            var force = require("./force");
            force(graph);
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
module.exports = function(graph) {
}
},{}],3:[function(require,module,exports){
module.exports = function(model) {
    var graph = {
        nodes: [],
        links: []
    }

    return graph;
}
},{}],4:[function(require,module,exports){
module.exports = function(db) {
    var model = {};

    var linkSheets = separateNodeAndLinkSheets(db, model);
    linkSheetsToModel(linkSheets, model);

    console.log(linkSheets);
    console.log(model);

    function linkSheetsToModel(linkSheets, model) {
        $.each(linkSheets, function(i, linkSheet) {
            var references = {};
            $.each(linkSheet.data, function(j, ref) {
                references[ref[linkSheet.source + "Id"]] = ref[linkSheet.target + "Id"];
            });

            model[linkSheet.source].references[linkSheet.target] = references;
        });
    }

    function separateNodeAndLinkSheets(db, model) {
        var linkSheets = {};
        var sheetNames = Object.keys(db);
        $.each(sheetNames, function(i, sheetName) {
            // Link sheets have dash-separated name in form <SOURCE_NAME>-<TARGET_NAME>
            var nodeNames = sheetName.split("-");
            if ((nodeNames.length == 2) &&
                (sheetNames.indexOf(nodeNames[0]) > -1) &&
                (sheetNames.indexOf(nodeNames[1]) > -1)) {
                // This is a link sheet
                linkSheets[sheetName] = {
                    source: nodeNames[0],
                    target: nodeNames[1],
                    data: db[sheetName]
                }
            }
            else {
                // This is a node sheet
                model[sheetName] = {
                    records: db[sheetName],
                    references: {}
                }
            }
        });

        return linkSheets;
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
            var COLUMN_INDEX_NAME = [];
            var data = spreadsheet[response.feed.title.$t] = [];

            $.each(response.feed.entry, function(i, e) {
                if (e.gs$cell.row == 1) {
                    COLUMN_INDEX_NAME[e.gs$cell.col] = e.content.$t;
                }
                else {
                    var index = e.gs$cell.row - 2;
                    if (data[index] == null) {
                        data[index] = {};
                    }
                    data[index][COLUMN_INDEX_NAME[e.gs$cell.col]] = e.content.$t;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvbW9kZWwuanMiLCJzcmMvc3ByZWFkc2hlZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XG4gICAgY2hlY2tSZXF1aXJlbWVudHMoKTtcblxuICAgIHZhciBkM3NoZWV0ID0ge1xuICAgICAgICB2ZXI6IFwiMS4wLjBcIixcbiAgICAgICAgZGI6IHt9LFxuICAgICAgICBtb2RlbDoge30sXG4gICAgICAgIG5vZGVzOiBbXVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XG5cbiAgICAvKipcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcblxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcblxuICAgICAgICB2YXIgJHN2Z0NvbnRhaW5lcklkID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgICAgIHdpZHRoID0gJHN2Z0NvbnRhaW5lcklkLndpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQgPSAkc3ZnQ29udGFpbmVySWQuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIFNWRyBlbGVtZW50XG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKVxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3ZpZXdCb3gnLCBcIjAgMCBcIiArIHdpZHRoICsgXCIgXCIgKyBoZWlnaHQpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBpbmZvIHBhbmVsXG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIGluZm9Db250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XG5cbiAgICAgICAgcmV0dXJuIGQzc2hlZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBMb2FkIGRhdGEgZnJvbSBzcHJlYWRzaGVldC5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xuICAgICAgICAvLyBMb2FkIHNwcmVhZHNoZWV0XG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHJlcXVpcmUoXCIuL3NwcmVhZHNoZWV0XCIpO1xuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXREYXRhKSB7XG4gICAgICAgICAgICBkM3NoZWV0LmRiID0gc3ByZWFkc2hlZXREYXRhO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBEQlxuICAgICAgICAgICAgdmFyIG1vZGVsID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWwoZDNzaGVldC5kYik7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBncmFwaCBmcm9tIG1vZGVsXG4gICAgICAgICAgICB2YXIgZ3JhcGggPSByZXF1aXJlKFwiLi9ncmFwaFwiKTtcbiAgICAgICAgICAgIGQzc2hlZXQuZ3JhcGggPSBncmFwaChtb2RlbCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBEMyBmb3JjZSBsYXlvdXQgZnJvbSBncmFwaFxuICAgICAgICAgICAgdmFyIGZvcmNlID0gcmVxdWlyZShcIi4vZm9yY2VcIik7XG4gICAgICAgICAgICBmb3JjZShncmFwaCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcbiAgICB9XG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCkge1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgZ3JhcGggPSB7XG4gICAgICAgIG5vZGVzOiBbXSxcbiAgICAgICAgbGlua3M6IFtdXG4gICAgfVxuXG4gICAgcmV0dXJuIGdyYXBoO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGIpIHtcbiAgICB2YXIgbW9kZWwgPSB7fTtcblxuICAgIHZhciBsaW5rU2hlZXRzID0gc2VwYXJhdGVOb2RlQW5kTGlua1NoZWV0cyhkYiwgbW9kZWwpO1xuICAgIGxpbmtTaGVldHNUb01vZGVsKGxpbmtTaGVldHMsIG1vZGVsKTtcblxuICAgIGNvbnNvbGUubG9nKGxpbmtTaGVldHMpO1xuICAgIGNvbnNvbGUubG9nKG1vZGVsKTtcblxuICAgIGZ1bmN0aW9uIGxpbmtTaGVldHNUb01vZGVsKGxpbmtTaGVldHMsIG1vZGVsKSB7XG4gICAgICAgICQuZWFjaChsaW5rU2hlZXRzLCBmdW5jdGlvbihpLCBsaW5rU2hlZXQpIHtcbiAgICAgICAgICAgIHZhciByZWZlcmVuY2VzID0ge307XG4gICAgICAgICAgICAkLmVhY2gobGlua1NoZWV0LmRhdGEsIGZ1bmN0aW9uKGosIHJlZikge1xuICAgICAgICAgICAgICAgIHJlZmVyZW5jZXNbcmVmW2xpbmtTaGVldC5zb3VyY2UgKyBcIklkXCJdXSA9IHJlZltsaW5rU2hlZXQudGFyZ2V0ICsgXCJJZFwiXTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtb2RlbFtsaW5rU2hlZXQuc291cmNlXS5yZWZlcmVuY2VzW2xpbmtTaGVldC50YXJnZXRdID0gcmVmZXJlbmNlcztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VwYXJhdGVOb2RlQW5kTGlua1NoZWV0cyhkYiwgbW9kZWwpIHtcbiAgICAgICAgdmFyIGxpbmtTaGVldHMgPSB7fTtcbiAgICAgICAgdmFyIHNoZWV0TmFtZXMgPSBPYmplY3Qua2V5cyhkYik7XG4gICAgICAgICQuZWFjaChzaGVldE5hbWVzLCBmdW5jdGlvbihpLCBzaGVldE5hbWUpIHtcbiAgICAgICAgICAgIC8vIExpbmsgc2hlZXRzIGhhdmUgZGFzaC1zZXBhcmF0ZWQgbmFtZSBpbiBmb3JtIDxTT1VSQ0VfTkFNRT4tPFRBUkdFVF9OQU1FPlxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lcyA9IHNoZWV0TmFtZS5zcGxpdChcIi1cIik7XG4gICAgICAgICAgICBpZiAoKG5vZGVOYW1lcy5sZW5ndGggPT0gMikgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKG5vZGVOYW1lc1swXSkgPiAtMSkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKG5vZGVOYW1lc1sxXSkgPiAtMSkpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbGluayBzaGVldFxuICAgICAgICAgICAgICAgIGxpbmtTaGVldHNbc2hlZXROYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBub2RlTmFtZXNbMF0sXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYltzaGVldE5hbWVdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIG5vZGUgc2hlZXRcbiAgICAgICAgICAgICAgICBtb2RlbFtzaGVldE5hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICByZWNvcmRzOiBkYltzaGVldE5hbWVdLFxuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VzOiB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGxpbmtTaGVldHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZGVsO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXksIG9uTG9hZGVkKSB7XG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XG4gICAgZ2V0U2hlZXRDb3VudChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24gb25TdWNjZXNzKHNoZWV0Q291bnQpIHtcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIHNoZWV0Q291bnQpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgc2hlZXRDb3VudCkge1xuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSB7fTtcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IHNoZWV0Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsb2FkZWRTaGVldENvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gc2hlZXRDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBvbkxvYWRlZChzcHJlYWRzaGVldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIENPTFVNTl9JTkRFWF9OQU1FID0gW107XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHNwcmVhZHNoZWV0W3Jlc3BvbnNlLmZlZWQudGl0bGUuJHRdID0gW107XG5cbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5yb3cgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBDT0xVTU5fSU5ERVhfTkFNRVtlLmdzJGNlbGwuY29sXSA9IGUuY29udGVudC4kdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGUuZ3MkY2VsbC5yb3cgLSAyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVtpbmRleF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtpbmRleF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkYXRhW2luZGV4XVtDT0xVTU5fSU5ERVhfTkFNRVtlLmdzJGNlbGwuY29sXV0gPSBlLmNvbnRlbnQuJHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBvblN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNoZWV0Q291bnQoc3ByZWFkc2hlZXRLZXksIG9uU3VjY2Vzcykge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvcHVibGljL2Z1bGw/YWx0PWpzb24taW4tc2NyaXB0XCIsXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgb25TdWNjZXNzKHJlc3BvbnNlLmZlZWQuZW50cnkubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSJdfQ==
