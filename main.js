
import rawLocations from './json/locationsData.json' with {type: 'json'};

//Constants
const ICON_SIZE = 32;
const ICON_TEXT_FONT_SIZE = 16;
const PIXEL_TO_MILES = 8/192*2; //This is 8mi for 196px on a 4096px, Am using size 2048 so multiple by 2
const SVGNS = "http://www.w3.org/2000/svg";

let travelLines = [];
let settings = [];
let locations = [];

let textDisplaySetting = "hover";


let allIconG = document.createElementNS(SVGNS, 'g');
allIconG.setAttribute('id', 'allIconGroup') ;
let svgCanvas;

class SVGCanvas {
    static DEFAULT_VIEWBOX = {x:0, y: 50, w: 6000, h: 6000}
    static DEFAULT_SCALE = .33

    constructor(image, container) {
        this.image = image;
        this.container = container;
        this.size = {w: this.image.clientWidth, h: this.image.clientHeight}

        this.isPanning = false;
        this.viewBox = SVGCanvas.DEFAULT_VIEWBOX;
        this.scale = SVGCanvas.DEFAULT_SCALE;
        this.startPoint = {x:0,y:0};

        this.resetView();
        console.log("SVGCanvas constructed")
    }

    addZoomEvents() {
        let that = this;
        this.container.onmousewheel = function(e) {
            e.preventDefault();
            var w = that.viewBox.w;
            var h = that.viewBox.h;
            var mx = e.offsetX;//mouse x  
            var my = e.offsetY;    
            var dw = -1*w*Math.sign(e.deltaY)*0.05;
            var dh = -1*h*Math.sign(e.deltaY)*0.05;
            var dx = dw*mx/that.size.w;
            var dy = dh*my/that.size.h;
            that.viewBox = { 
                x:that.viewBox.x+dx,
                y:that.viewBox.y+dy,
                w:that.viewBox.w-dw,
                h:that.viewBox.h-dh
            };
            that.scale = that.size.w/that.viewBox.w;
            that.image.setAttribute('viewBox', `${that.viewBox.x} ${that.viewBox.y} ${that.viewBox.w} ${that.viewBox.h}`);
        }
    }

    addPanEvents() {
        let that = this;
        that.container.onmousedown = function(e){
            that.isPanning = true;
            that.startPoint = {x:e.x,y:e.y};   
        }
         
        that.container.onmousemove = function(e){
            if (that.isPanning) {
                var endPoint = {x:e.x,y:e.y};
                var dx = (that.startPoint.x - endPoint.x)/that.scale;
                var dy = (that.startPoint.y - endPoint.y)/that.scale;
                var movedViewBox = {
                    x:that.viewBox.x+dx,
                    y:that.viewBox.y+dy,
                    w:that.viewBox.w,
                    h:that.viewBox.h
                };
                that.image.setAttribute('viewBox', `${movedViewBox.x} ${movedViewBox.y} ${movedViewBox.w} ${movedViewBox.h}`);
            }
        }
         
        that.container.onmouseup = function(e){
            if (that.isPanning){ 
                var endPoint = {x:e.x,y:e.y};
                var dx = (that.startPoint.x - endPoint.x)/that.scale;
                var dy = (that.startPoint.y - endPoint.y)/that.scale;
                that.viewBox = {
                    x:that.viewBox.x+dx,
                    y:that.viewBox.y+dy,
                    w:that.viewBox.w,
                    h:that.viewBox.h
                };
                that.image.setAttribute('viewBox', `${that.viewBox.x} ${that.viewBox.y} ${that.viewBox.w} ${that.viewBox.h}`);
                that.isPanning = false;
            }
        }
         
        that.container.onmouseleave = function(e){
            that.isPanning = false;
        }
    }

    resetView() {
        this.viewBox = SVGCanvas.DEFAULT_VIEWBOX
        this.scale = SVGCanvas.DEFAULT_SCALE
        this.startPoint = {x:0,y:0};
        this.image.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`); 
    }
}

class Setting {
    constructor(display, name, level, initial, onClickFunc) {
        this.display = display;
        this.name = name;
        this.level = level;
        this.val = false;
        if (typeof initial == "boolean")
            this.val = initial;
        this.onClickFunc = onClickFunc;

        //Creating element
        this.createElement();
    }
    createElement() {
        let div;
        switch (this.level) {
            case "Public":
                div = document.getElementById('publicSettings');
                break;
            case "Admin":
                div = document.getElementById('adminSettings');
                break;
        }

        // Holds everything
        let smallerDiv = document.createElement("div");
        smallerDiv.style.lineHeight = "24px";

        //Linebreak
        let linebreak = document.createElement("br");

        //Set up label, input, and span node
        let label = document.createElement("label");
        label.classList.add("switch");

        let input = document.createElement("input");
        input.type = 'checkbox';
        input.checked = this.val;

        let span = document.createElement("span");
        span.classList.add("slider");
        span.classList.add("round");

        let currentIndex = settings.length;
        input.addEventListener('click', function() {settings[currentIndex].click()});

        let text = document.createTextNode(" "+ this.display + ": ");

        //Appending Nodes
        label.appendChild(input);
        label.appendChild(span);

        smallerDiv.appendChild(text);
        smallerDiv.appendChild(label);

        div.appendChild(smallerDiv);
        div.appendChild(linebreak);
    }

    click() {
        this.val = !this.val;
        this.onClickFunc(this.name, this.val);
    }
}

class Location {
    constructor(name, type, src, x, y) {
        this.name = name;
        this.type = type;
        this.src = "images/icons/" + src + ".png";
        this.x = x;
        this.y = y;
    }

    static makeAllLocations() {
        locations.forEach((loc) => loc.makeElement());
        svgMap.appendChild(allIconG);
    }

    makeElement() {
        //group element
        let g = document.createElementNS(SVGNS, 'g');
        g.addEventListener('mouseover', (e) => { //Reappends node so that it is drawn first (nothing covers text)
            allIconG.appendChild(e.target.parentNode);
        })
        //image
        let el = document.createElementNS(SVGNS, 'image');
        el.setAttributeNS(null, 'x', this.x-ICON_SIZE/2);
        el.setAttributeNS(null, 'y', this.y-ICON_SIZE/2);
        el.setAttributeNS(null, 'href', this.src);
        el.setAttributeNS(null, 'onerror', "this.setAttribute('href', 'images/icons/image_not_found.png')")
        el.setAttributeNS(null, 'originalX', this.x);
        el.setAttributeNS(null, 'originalY', this.y);
        el.setAttribute("searchName", this.name.toLowerCase());
        el.classList.add("icon");
        el.classList.add("icon-" + this.type);
        //text
        let txt = document.createElementNS(SVGNS, "text");
        txt.setAttributeNS(null, 'x', this.x);
        txt.setAttributeNS(null, 'y', this.y-ICON_SIZE);
        txt.classList.add("icon-text");
        txt.classList.add("text-display-hover");
        txt.textContent = this.name;
        //Apending
        g.appendChild(el);
        g.appendChild(txt);
        allIconG.appendChild(g);
    }
}

class TravelLine {
    constructor(loc1, loc2) {
        this.loc1 = loc1;
        this.loc2 = loc2;
        this.distance = this.calcDistance();
        this.r = "5px";

        this.addToTable();
        this.makeElements();
    }

    static removeTravelLine(index) {
        document.getElementById('distTable').deleteRow(index);
        travelLines.splice(index-1, 1);
    }

    static refreshDistSelection() {
        let select1 = document.getElementById('distLoc1');
        let select2 = document.getElementById('distLoc2');
        
        //Clear out selects
        while (select1.options.length > 0) {
            select1.remove(0);
            select2.remove(0);
            }
    
        //Prep new selects
        select1.add(new Option("Nothing Selected"));
        select2.add(new Option("Nothing Selected"));
        locations.forEach((icon) => {
            if (icon.type != 'fountain') {
                select1.add(new Option(icon.name));
                select2.add(new Option(icon.name));
            }
        });
    }

    calcDistance() {
        let xDif = this.loc1.x - this.loc2.x
        let yDif = this.loc1.y - this.loc2.y

        let distPixels = Math.sqrt(xDif**2 + yDif**2)
        return (distPixels*PIXEL_TO_MILES).toFixed(1);
    }

    addToTable() {
        let table = document.getElementById('distTable')
        let row = table.insertRow(-1)
        let cells = [row.insertCell(0),row.insertCell(1),row.insertCell(2),row.insertCell(3)];
        cells[0].innerHTML = this.loc1.name;
        cells[1].innerHTML = this.loc2.name;
        cells[2].innerHTML = this.distance;
        cells[3].innerHTML = '<button>X</button>';
        cells[3].addEventListener('click', function() {TravelLine.removeTravelLine(this.parentNode.rowIndex)});
    }

    makeElements() {
        //group element
        let g = document.createElementNS(SVGNS, 'g');
        //first circle
        let c1 = document.createElementNS(SVGNS, 'circle')
        c1.setAttributeNS(null, 'cx', this.loc1.x);
        c1.setAttributeNS(null, 'cy', this.loc1.y);
        c1.setAttributeNS(null, 'r', this.r);
        c1.classList.add("travel-dot");
        //second circle
        let c2 = document.createElementNS(SVGNS, 'circle')
        c2.setAttributeNS(null, 'cx', this.loc2.x);
        c2.setAttributeNS(null, 'cy', this.loc2.y);
        c2.setAttributeNS(null, 'r', this.r);
        c2.classList.add("travel-dot");
        //dotted line
        let line = document.createElementNS(SVGNS, 'line');
        line.setAttributeNS(null, "x1", this.loc1.x);
        line.setAttributeNS(null, 'y1', this.loc1.y);
        line.setAttributeNS(null, "x2", this.loc2.x);
        line.setAttributeNS(null, 'y2', this.loc2.y);
        line.classList.add("travel-line");
        //Append
        g.appendChild(c1);
        g.appendChild(c2);
        g.appendChild(line);
        svgMap.appendChild(g);
    }
}

function main() {
    svgCanvas = new SVGCanvas(document.getElementById("svgMap"), document.getElementById("svgContainer"));
    

    //Preparing data
    //prepareSettings();
    prepareLocations();
    prepareEventListeners();

    //Drawing
    Location.makeAllLocations();
    console.log("Done all icons");
    console.log("Finished in main");
}

function prepareLocations() {
    rawLocations.forEach((loc) => {
        locations.push(new Location(loc.name, loc.type, loc.icon_src, loc.x, loc.y, loc.permission_level));
    });
}

function prepareEventListeners() {
    svgCanvas.addZoomEvents();
    svgCanvas.addPanEvents();

    document.getElementById("resetView").addEventListener("click", function(e) {
        svgCanvas.resetView();
        resetFontSize();
    });

    document.getElementById("toggleText").addEventListener("click", function(e) {
        if (textDisplaySetting.localeCompare("hover") == 0) {
            textDisplaySetting = "shown"
            this.textContent = "Hide All Text"
            Array.prototype.forEach.call(document.getElementsByClassName("icon-text"), function(t) {
                t.classList.remove("text-display-hover");
            })
        }
        else {
            textDisplaySetting = "hover"
            this.textContent = "Show All Text"
            Array.prototype.forEach.call(document.getElementsByClassName("icon-text"), function(t) {
                t.classList.add("text-display-hover");
            })
        }
        
    });

    document.getElementById("fontSizeSlider").oninput = function(e) {
        let newFontSize = this.value;
        document.getElementById("fontSizeDisplay").textContent = newFontSize;
        Array.prototype.forEach.call(document.getElementsByClassName("icon-text"), function (t) {
            t.style.fontSize = newFontSize + "px";
        })
    };

    document.getElementById("startSearch").onclick = function(e) {
        let searchText = document.getElementById("searchTextInput").value.toLowerCase().trim();
        //update search bar w/ trimmed value
        document.getElementById("searchTextInput").value = document.getElementById("searchTextInput").value.trim();
        if (!searchText) //Empty/Invalid string
            return true;
        Array.prototype.forEach.call(document.getElementsByClassName("icon"), function (i) {
            //First clears previous result
            i.classList.remove("search-result-highlight");
            //If text matches highlight
            if (i.getAttribute("searchName").indexOf(searchText) > -1)
                i.classList.add("search-result-highlight");
        })
    };

    document.getElementById("clearSearch").onclick = function(e) {
        Array.prototype.forEach.call(document.getElementsByClassName("icon"), function (i) {
            i.classList.remove("search-result-highlight");
        });
        document.getElementById("searchTextInput").value = "";
    };
        
}

function resetFontSize() {
    let newFontSize = ICON_TEXT_FONT_SIZE;
    document.getElementById("fontSizeDisplay").textContent = newFontSize;
    document.getElementById("fontSizeSlider").value = newFontSize
    Array.prototype.forEach.call(document.getElementsByClassName("icon-text"), function (t) {
        t.style.fontSize = newFontSize + "px";
    })
}




main();
