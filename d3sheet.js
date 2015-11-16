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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xuXG4gICAgdmFyIGQzc2hlZXQgPSB7XG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxuICAgICAgICBkYjoge30sXG4gICAgICAgIG1vZGVsOiB7fSxcbiAgICAgICAgbm9kZXM6IFtdXG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcblxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxuICAgICoqL1xuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xuXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xuXG4gICAgICAgIHZhciAkc3ZnQ29udGFpbmVySWQgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxuICAgICAgICAgICAgd2lkdGggPSAkc3ZnQ29udGFpbmVySWQud2lkdGgoKSxcbiAgICAgICAgICAgIGhlaWdodCA9ICRzdmdDb250YWluZXJJZC5oZWlnaHQoKTtcblxuICAgICAgICAvLyBDcmVhdGUgU1ZHIGVsZW1lbnRcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXG4gICAgICAgICAgICAuYXR0cigndmlld0JveCcsIFwiMCAwIFwiICsgd2lkdGggKyBcIiBcIiArIGhlaWdodCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGluZm8gcGFuZWxcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKTtcblxuICAgICAgICByZXR1cm4gZDNzaGVldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxuICAgICoqL1xuICAgIGQzc2hlZXQubG9hZCA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5KSB7XG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gcmVxdWlyZShcIi4vc3ByZWFkc2hlZXRcIik7XG4gICAgICAgIHNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbihzcHJlYWRzaGVldERhdGEpIHtcbiAgICAgICAgICAgIGQzc2hlZXQuZGIgPSBzcHJlYWRzaGVldERhdGE7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIERCXG4gICAgICAgICAgICB2YXIgbW9kZWwgPSByZXF1aXJlKFwiLi9tb2RlbFwiKTtcbiAgICAgICAgICAgIGQzc2hlZXQubW9kZWwgPSBtb2RlbChkM3NoZWV0LmRiKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGdyYXBoIGZyb20gbW9kZWxcbiAgICAgICAgICAgIHZhciBncmFwaCA9IHJlcXVpcmUoXCIuL2dyYXBoXCIpO1xuICAgICAgICAgICAgZDNzaGVldC5ncmFwaCA9IGdyYXBoKG1vZGVsKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXG4gICAgICAgICAgICB2YXIgZm9yY2UgPSByZXF1aXJlKFwiLi9mb3JjZVwiKTtcbiAgICAgICAgICAgIGZvcmNlKGdyYXBoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlbWVudHMoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEMyBsaWJyYXJ5IG5vdCBmb3VuZCFcIik7XG4gICAgICAgIGlmICh0eXBlb2YgJCA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xuICAgIH1cbn0oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdyYXBoKSB7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciBncmFwaCA9IHtcbiAgICAgICAgbm9kZXM6IFtdLFxuICAgICAgICBsaW5rczogW11cbiAgICB9XG5cbiAgICByZXR1cm4gZ3JhcGg7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYikge1xuICAgIHZhciBtb2RlbCA9IHt9O1xuXG4gICAgdmFyIGxpbmtTaGVldHMgPSBzZXBhcmF0ZU5vZGVBbmRMaW5rU2hlZXRzKGRiLCBtb2RlbCk7XG4gICAgbGlua1NoZWV0c1RvTW9kZWwobGlua1NoZWV0cywgbW9kZWwpO1xuXG4gICAgY29uc29sZS5sb2cobGlua1NoZWV0cyk7XG4gICAgY29uc29sZS5sb2cobW9kZWwpO1xuXG4gICAgZnVuY3Rpb24gbGlua1NoZWV0c1RvTW9kZWwobGlua1NoZWV0cywgbW9kZWwpIHtcbiAgICAgICAgJC5lYWNoKGxpbmtTaGVldHMsIGZ1bmN0aW9uKGksIGxpbmtTaGVldCkge1xuICAgICAgICAgICAgdmFyIHJlZmVyZW5jZXMgPSB7fTtcbiAgICAgICAgICAgICQuZWFjaChsaW5rU2hlZXQuZGF0YSwgZnVuY3Rpb24oaiwgcmVmKSB7XG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlc1tyZWZbbGlua1NoZWV0LnNvdXJjZSArIFwiSWRcIl1dID0gcmVmW2xpbmtTaGVldC50YXJnZXQgKyBcIklkXCJdO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1vZGVsW2xpbmtTaGVldC5zb3VyY2VdLnJlZmVyZW5jZXNbbGlua1NoZWV0LnRhcmdldF0gPSByZWZlcmVuY2VzO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXBhcmF0ZU5vZGVBbmRMaW5rU2hlZXRzKGRiLCBtb2RlbCkge1xuICAgICAgICB2YXIgbGlua1NoZWV0cyA9IHt9O1xuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKGRiKTtcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xuICAgICAgICAgICAgLy8gTGluayBzaGVldHMgaGF2ZSBkYXNoLXNlcGFyYXRlZCBuYW1lIGluIGZvcm0gPFNPVVJDRV9OQU1FPi08VEFSR0VUX05BTUU+XG4gICAgICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICAgIGlmICgobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSAmJlxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2Yobm9kZU5hbWVzWzBdKSA+IC0xKSAmJlxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2Yobm9kZU5hbWVzWzFdKSA+IC0xKSkge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsaW5rIHNoZWV0XG4gICAgICAgICAgICAgICAgbGlua1NoZWV0c1tzaGVldE5hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGRiW3NoZWV0TmFtZV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbm9kZSBzaGVldFxuICAgICAgICAgICAgICAgIG1vZGVsW3NoZWV0TmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY29yZHM6IGRiW3NoZWV0TmFtZV0sXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbGlua1NoZWV0cztcbiAgICB9XG5cbiAgICByZXR1cm4gbW9kZWw7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcbiAgICAvLyBHZXQgc2hlZXQgY291bnRcbiAgICBnZXRTaGVldENvdW50KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3Moc2hlZXRDb3VudCkge1xuICAgICAgICAvLyBMb2FkIGFsbCBzaGVldHNcbiAgICAgICAgbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgc2hlZXRDb3VudCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBzaGVldENvdW50KSB7XG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHt9O1xuICAgICAgICB2YXIgbG9hZGVkU2hlZXRDb3VudCA9IDA7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gc2hlZXRDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBzaGVldENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xuICAgICAgICByZXR1cm4gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgQ09MVU1OX0lOREVYX05BTUUgPSBbXTtcbiAgICAgICAgICAgIHZhciBkYXRhID0gc3ByZWFkc2hlZXRbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSBbXTtcblxuICAgICAgICAgICAgJC5lYWNoKHJlc3BvbnNlLmZlZWQuZW50cnksIGZ1bmN0aW9uKGksIGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5ncyRjZWxsLnJvdyA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIENPTFVNTl9JTkRFWF9OQU1FW2UuZ3MkY2VsbC5jb2xdID0gZS5jb250ZW50LiR0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZS5ncyRjZWxsLnJvdyAtIDI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhW2luZGV4XSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2luZGV4XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaW5kZXhdW0NPTFVNTl9JTkRFWF9OQU1FW2UuZ3MkY2VsbC5jb2xdXSA9IGUuY29udGVudC4kdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRDb3VudChzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59Il19
