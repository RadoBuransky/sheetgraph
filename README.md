# d3sheet - visualize Google Spreadsheet as a D3 force graph

Without writing any code:
 
1. **Create a well-formed Google Spreadsheet**
2. **Publish it so that it can be publicly accessed**. From the main menu in Google Spreadsheet choose **File** >
   **Publish to the web...**
3. Use the spreadsheet's key to **visualize it as a graph** with nodes and links

Format of the spreadsheet is described later. But it's so self-explanatory that If you're too lazy to read, go ahead and
check following examples to learn by them.

## Example 1: movies and actors

- [Google Spreadsheet](https://docs.google.com/spreadsheets/d/145TdEqd9nbnRFWWGUM-tdedulewUvZjRpHP7C09pIaQ/)
- [Graph](http://radoburansky.github.io/d3sheet/demo/movies-and-actors)

## Documentation

Start with a blank Google Spreadsheet and publish it (File > Publish it to the web...). In the next chapters you will
learn how to create sheets to create nodes in the graph and how to create links (edges) between them.
 
### Sheets

To make it clear, sheet is a table. It contains rows and columns. A single spreadsheet can have more sheets. So
spreadsheet is document and sheet is table. Right?

Every sheet has a name and the name matters. There are three types of sheets determined by their name:

1. **Node sheet** - contains nodes
2. **Link sheet** - contains links
3. **Settings sheet** - contains various visualization settings

The logic is fairly simple. If the sheet name is in form `<SHEET_NAME>-<SHEET_NAME>` then it contains links, otherwise
it contains nodes. Links can be also created in a simpler way, you don't always have to create a separate sheet to
create links. This is explained later. 

### Node sheet

Single row in a node sheet represents a node in the graph. The only exception is the first row which contains names of columns.
**The first column** in a node sheet is used as a node label property. All other columns have one of two following meanings:

1. **Node property** - use it for whatever you like
2. **Link to another node** - column name determines which node property to use to create a link

*Tip: It is generally a good idea to have an globally unique `id` node property in all node sheets, but it is not
mandatory. This `id` node property can be then used to unambiguously link nodes, but you can create links using any
properties.*

**To create a link to a node** first create a column named as `<TARGET_SHEET_NAME>.<TARGET_NODE_PROPERTY_NAME>`. Then to
create actual link, put the target node's property value into the row representing source node. **To create more links
you can use comma-separated list** of target property values. Note that you can also create links using link sheets.

For example let's assume we have two node sheets `movie` and `actor`. To create a link from a movie to an actor using
hers/his name, create a column named `actor.name` in the `movie` sheet.

### Link sheet

Link sheet has a name in form `<SOURCE_SHEET_NAME>-<TARGET_SHEET_NAME>` where the first sheet name determines link source and the second
sheet name is the target. For example a sheet named `movie-actor` contains links from nodes representing movies to nodes
representing actors.

The first row contains names of source and target property names in form `<SHEET_NAME>.<PROPERTY_NAME>`. **The first
column** is link source and **the second column** is link target.

**The optional third column** is used as link label if exists. You can also add more columns to store **other link
properties**.

### Settings sheet

This optional sheet must be named `settings` and contains two columns where the first column contains setting key and
the second column contains setting value. List of available settings follows.

| Setting key           | Description                                                                                |
|-----------------------|--------------------------------------------------------------------------------------------|
| background-color      | CSS color used to paint background, for example #A011FF                                    |
| color                 | CSS color used for text in general                                                         |

### Style

Most of the styling can be changed in the settings sheet with the exception of some node and link styles which can be
set directly within node and link sheets.
 
#### Node fill and text colors

**Background color and text color of the very first cell** (first row, first column) of a node sheet is used to paint
nodes for the particular node sheet.   

#### Link line and text colors

There are two ways how to style links depending on how links are defined:
 
1. **Link sheet** - set background color and text color of the very first cell in the link sheet
2. **Link column** - set background color and text color of the cell in the first row of that column