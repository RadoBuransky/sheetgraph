module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node) {
        console.log(node);
        $("#d3sheet-node-info h2").text(node.label);
        $("#d3sheet-node-sheet-name").text(node.sheetName);
        var ul = $("#d3sheet-node-properties");
        var propertyNames = Object.keys(node.properties);
        ul.empty();
        $.each(propertyNames, function(i, propertyName) {
            ul.append("<li><span class=\"d3sheet-node-property-name\">" + propertyName +
            ":</span> <span class=\"d3sheet-node-property-value\">" + node.properties[propertyName] + "</span></li>");
        });
    }

    return this;
}