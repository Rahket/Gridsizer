var GridsizerDirection;
(function (GridsizerDirection) {
    GridsizerDirection[GridsizerDirection["X"] = 0] = "X";
    GridsizerDirection[GridsizerDirection["Y"] = 1] = "Y";
})(GridsizerDirection || (GridsizerDirection = {}));
export class Gridsizer {
    static bind(options = {
        handleColors: {
            normal: "#555",
            hover: "#777",
            active: "#467"
        }
    }) {
        document.querySelectorAll("[gs]:not([gs-bound])").forEach((element) => {
            new Gridsizer(element, options);
        });
    }
    constructor(element, options) {
        this.children = [];
        this.injectCSS(options);
        element.setAttribute("gs-bound", "");
        this.element = element;
        let children = element.querySelectorAll(":scope > [gs-element]");
        let siblings = [];
        children.forEach((child, index) => {
            let gridElement = new GridsizerElement(child, index);
            siblings.push(gridElement);
            this.children.push(gridElement);
        });
        this.children.forEach((child) => {
            child.siblings = siblings;
            child.init();
        });
    }
    injectCSS(options) {
        let style = document.createElement("style");
        style.innerHTML = `
            [gs] {display: flex;width: 100%;height: 100%;}
            [gs-cx] {display: flex;flex-direction: row;}
            [gs-cy] {display: flex;flex-direction: column;}
            [gs-element] {flex: 1;position: relative;}
            .resize-handle {background: ${options.handleColors.normal};z-index: 1;}
            .resize-handle:hover {background: ${options.handleColors.hover};}
            .resize-handle:active {background: ${options.handleColors.active};}
            .resize-handle.x {cursor: ew-resize;position: absolute;top: 0;bottom: 0;right: 0;width: 5px;}
            .resize-handle.y {cursor: ns-resize;position: absolute;left: 0;right: 0;bottom: 0;height: 5px;}`;
        document.head.appendChild(style);
    }
}
class GridsizerElement {
    constructor(element, index) {
        this.children = [];
        this.siblings = [];
        this.element = element;
        this.direction = element.getAttribute("gs-x") != null ? GridsizerDirection.X : GridsizerDirection.Y;
        this.index = index;
        let children = element.querySelectorAll(":scope > [gs-element]");
        let siblings = [];
        children.forEach((child, index) => {
            let gridElement = new GridsizerElement(child, index);
            siblings.push(gridElement);
            this.children.push(gridElement);
        });
        this.children.forEach((child) => {
            child.siblings = siblings;
            child.init();
        });
    }
    init() {
        if (this.index + 1 < this.siblings.length) {
            this.handle = this.createHandle();
            this.bindHandle();
        }
        else {
            this.handle = null;
        }
        if (this.index == 0) {
            this.createInitialStyleState();
        }
    }
    restructureElement() {
        let content;
        if (!this.element.querySelector(":scope > .content-full")) {
            content = document.createElement("div");
            content.classList.add("content-full");
            content.style.width = "100%";
            content.style.height = "100%";
            while (this.element.firstChild) {
                content.appendChild(this.element.firstChild);
            }
            this.element.appendChild(content);
        }
        else {
            content = this.element.querySelector(":scope > .content-full");
        }
        return content;
    }
    createHandle() {
        this.handleData = {
            enabled: false,
            startValue: 0,
            elementADimension: 0,
            elementBDimension: 0
        };
        let content = this.restructureElement();
        let handle = document.createElement("div");
        handle.classList.add("resize-handle", GridsizerDirection[this.direction].toLowerCase());
        content.appendChild(handle);
        return handle;
    }
    createInitialStyleState() {
        let parent = this.element.parentElement;
        let maxDimension = this.direction == GridsizerDirection.X ? parent.offsetWidth : parent.offsetHeight;
        let proportions = [];
        let minDimensions = [];
        this.siblings.forEach((sibling) => {
            let size = sibling.element.getAttribute("gs-x") || sibling.element.getAttribute("gs-y") || 0;
            proportions.push(size);
            let minDimension = sibling.element.getAttribute("gs-min") || GridsizerElement.MIN_DIMENSION;
            minDimensions.push(minDimension);
        });
        const minDimension = GridsizerElement.MIN_DIMENSION / maxDimension;
        proportions = proportions.map((size) => {
            if (typeof size == "number") {
                return Math.max(minDimension, size / maxDimension);
            }
            if (size.endsWith("%")) {
                return Math.max(minDimension, parseFloat(size) / 100);
            }
            else {
                return Math.max(minDimension, parseFloat(size) / maxDimension);
            }
        });
        minDimensions = minDimensions.map((size) => {
            if (typeof size == "number") {
                return size / maxDimension;
            }
            if (size.endsWith("%")) {
                return Math.max(minDimension, parseFloat(size) / 100);
            }
            else {
                return Math.max(minDimension, parseFloat(size) / maxDimension);
            }
        });
        let totalSize = proportions.reduce((a, b) => a + b, 0);
        if (totalSize < 1) {
            let deficit = 1 - totalSize;
            let deficitPerElement = deficit / proportions.filter(a => a == minDimension).length;
            proportions = proportions.map((size) => size == minDimension ? size + deficitPerElement : size);
        }
        totalSize = proportions.reduce((a, b) => a + b, 0);
        proportions = proportions.map((size) => size / totalSize);
        let enforcedDeficit = 0;
        proportions.forEach((size, index) => {
            if (size < minDimensions[index]) {
                enforcedDeficit += minDimensions[index] - size;
            }
        });
        if (enforcedDeficit > 0) {
            let needsResize = [];
            proportions = proportions.map((size, index) => {
                if (size > minDimensions[index]) {
                    needsResize.push(index);
                    return size;
                }
                else {
                    return minDimensions[index];
                }
            });
            let totalResizableDimension = proportions.filter((size, index) => needsResize.includes(index))
                .reduce((a, b) => a + b, 0);
            needsResize.forEach((index) => {
                proportions[index] = proportions[index] - (proportions[index] / totalResizableDimension) * enforcedDeficit;
            });
        }
        this.siblings.forEach((sibling, index) => {
            sibling.element.style.flexBasis = (proportions[index] * 100) + "%";
        });
    }
    bindHandle() {
        this.handle.onmousedown = (event) => {
            this.handleData.enabled = true;
            this.handleData.startValue = this.direction == GridsizerDirection.X ? event.clientX : event.clientY;
            this.handleData.elementADimension = parseFloat(this.element.style.flexBasis);
            this.handleData.elementBDimension = parseFloat(this.siblings[this.index + 1].element.style.flexBasis);
        };
        document.addEventListener("mouseup", () => {
            this.handleData.enabled = false;
        });
        document.addEventListener("mousemove", (event) => {
            if (!this.handleData.enabled) {
                return;
            }
            let newValue = this.direction == GridsizerDirection.X ? event.clientX : event.clientY;
            let diffValue = newValue - this.handleData.startValue;
            this.resize(diffValue);
        });
    }
    resize(diff) {
        let parent = this.element.parentElement;
        let maxDimension = this.direction == GridsizerDirection.X ? parent.offsetWidth : parent.offsetHeight;
        diff *= 100;
        diff /= maxDimension;
        let elementA = this;
        let elementB = this.siblings[this.index + 1];
        let elementAMinDimension = GridsizerElement.getElementMinDimensionPercentage(elementA) * 100;
        let elementBMinDimension = GridsizerElement.getElementMinDimensionPercentage(elementB) * 100;
        let elementANewDimension = this.handleData.elementADimension + diff;
        let elementBNewDimension = this.handleData.elementBDimension - diff;
        if (elementANewDimension < elementAMinDimension) {
            elementANewDimension = elementAMinDimension;
            elementBNewDimension = ((this.handleData.elementADimension + this.handleData.elementBDimension) - elementAMinDimension);
        }
        else if (elementBNewDimension < elementBMinDimension) {
            elementBNewDimension = elementBMinDimension;
            elementANewDimension = ((this.handleData.elementADimension + this.handleData.elementBDimension) - elementBMinDimension);
        }
        elementA.element.style.flexBasis = elementANewDimension + "%";
        elementB.element.style.flexBasis = elementBNewDimension + "%";
    }
    static getElementMinDimensionPercentage(gs) {
        let parent = gs.element.parentElement;
        let maxDimension = gs.direction == GridsizerDirection.X ? parent.offsetWidth : parent.offsetHeight;
        let minDimension = gs.element.getAttribute("gs-min") || GridsizerElement.MIN_DIMENSION;
        if (typeof minDimension == "number") {
            return minDimension / maxDimension;
        }
        if (minDimension.endsWith("%")) {
            return parseFloat(minDimension) / 100;
        }
        else {
            return parseFloat(minDimension) / maxDimension;
        }
    }
}
GridsizerElement.MIN_DIMENSION = 50;
Gridsizer.bind();
