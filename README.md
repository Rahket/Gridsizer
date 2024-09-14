# Gridsizer

### A simple, lightweight grid resizer

https://rahket.github.io/Gridsizer

### Usage

Gridsizer automatically runs when imported. It is available as a js or ts file.

### Page setup:

* Your outer container should have the [gs] attribute.
* Gridsizer elements can recursively nest. Each cell should have a `gs-element` attribute and either a `gs-x` or `gs-y` attribute.
* Nested containers should be marked with `gs-cx` or `gs-cy` depending on if they contain nested horizontal or vertical cells.
* You can specify a preferred size for each cell by giving `gs-x` or `gs-y` a value (in percent relative to the container or px).
* You can also specify a minimum size for each cell with `gs-min`, also in percent or px.

### Example: 
```
<div gs gs-cx>
    <div gs-element gs-x="200px" gs-min="250px"></div>
    <div gs-element gs-x="1600px"></div>
    <div gs-element gs-x gs-cy gs-min="150px">
        <div gs-element gs-y="100%"></div>
        <div gs-element gs-y gs-cx gs-min="300px">
            <div gs-element gs-x="65%"></div>
            <div gs-element gs-x="35%"></div>
        </div>
    </div>
</div>
```
