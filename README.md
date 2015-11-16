# d3sheet - Visualize Google Spreadsheet as a D3 force graph

**Teaser:** Without any code, create Google Spreadsheet with two worksheets like this ...

**Movie**

| Label                    | Actor                                 |
|--------------------------|---------------------------------------|
| The Terminator           | Arnold Schwarzenegger, Linda Hamilton |
| Dante's Peak             | Linda Hamilton                        |

**Actor**

| Label                 |
|-----------------------|
| Arnold Schwarzenegger |
| Linda Hamilton        |
| Pierce Brosnan        |

... and get visual graph representation like this:

**TODO**

## No need to write any code, just create a spreadsheet and publish it

The minimal required steps are to:
 
1. **Create a well-formed Google Spreadsheet** and
2. **Publish it so that it can be publicly accessed**. From the main menu in Google Spreadsheet choose **File** >
   **Publish to the web...**.

Meaning of well-formedness is described later, but it's simple. If you're too lazy to read, go ahead and check examples to
learn by them.

## Example 1: movies and actors

[Google Spreadsheet](https://docs.google.com/spreadsheets/d/145TdEqd9nbnRFWWGUM-tdedulewUvZjRpHP7C09pIaQ/)
[Graph](http://radoburansky.github.io/d3sheet/demo/movies-and-actors)

## Sheet rows are nodes

Single row in a sheet is a node in the graph. The only exception is the first row which contains column names.
Column names with special meaning are `id` and `label`.   

## Sheets are node groups

If you'd like to have different types of nodes, then put them into separate sheets. 

## Linking nodes

There are more ways how to link nodes. Choose whichever you like:

1. **Link by label** - Set label of linked node as a value of column named as linked node group. To link to more nodes
use comma-separated list of labels.
2. **Link by ids** - Set id of linked node as a value of column named as linked node group + **Id**. To link to more
nodes use comma-separated list of ids.
3. **Link by sheet** - Create new sheet named as **<source sheet>-<target sheet>** with two columns where in the
first row the first column contains name of column in source sheet and the second column contains name of column in
the target sheet. They both are used to identify nodes to be connected. They can be `id`, `label` or whatever you like.

