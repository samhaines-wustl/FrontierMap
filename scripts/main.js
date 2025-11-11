
import {locations} from './locations.js';
import {Location} from './locations.js'

//Constants
const ICON_SIZE = 48;
const ICON_TEXT_FONT_SIZE = 32;
const PIXEL_TO_MILES = 8/192*2; //This is 8mi for 196px on a 4096px, I'm using size 2048 so multiple by 2
const SVGNS = "http://www.w3.org/2000/svg";

let travelLines = [];
let settings = [];
let biomes = [];

let toggleTextDisplay = false;
let toggleBiomeDisplay = false;
let toggleGridDisplay = false;
let toggleAllLocDisplay = false;
let toggleCustomIconDisplay = false;


let allBiomesG = document.getElementById('allBiomesGroup');

let allTravelLinesGroup = document.getElementById('allTravelLinesGroup');

let gridG = document.getElementById('gridGroup');

let svgCanvas;

class SVGCanvas {
    static DEFAULT_VIEWBOX = {x:1000, y: 900, w: 3000, h: 3000}
    static DEFAULT_SCALE = .75 //Set for the drag speed

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

class TravelLine {
    constructor(loc1, loc2) {
        this.loc1 = loc1;
        this.loc2 = loc2;
        this.distance = this.calcDistance();
        this.r = "5px";

        let index = this.addToTable();
        this.makeElements(index);
    }

    static removeTravelLine(index) {
        document.getElementById('distanceTable').deleteRow(index);
        document.getElementById('line'+index).remove();
        travelLines.splice(index-1, 1);
    }

    calcDistance() {
        let xDif = this.loc1.x - this.loc2.x
        let yDif = this.loc1.y - this.loc2.y

        let distPixels = Math.sqrt(xDif**2 + yDif**2)
        return (distPixels*PIXEL_TO_MILES).toFixed(1);
    }

    addToTable() {
        let table = document.getElementById('distanceTable')
        let row = table.insertRow(-1)
        let cells = [row.insertCell(0),row.insertCell(1),row.insertCell(2),row.insertCell(3)];
        cells[0].innerHTML = this.loc1.name;
        cells[1].innerHTML = this.loc2.name;
        cells[2].innerHTML = this.distance;
        cells[3].innerHTML = '<button>X</button>';
        cells[3].addEventListener('click', function() {TravelLine.removeTravelLine(this.parentNode.rowIndex)});
        return (cells[3].parentNode.rowIndex);
    }

    makeElements(indexID) {
        //group element
        let g = document.createElementNS(SVGNS, 'g');
        g.setAttribute('id', 'line' + indexID);
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
        allTravelLinesGroup.appendChild(g);
    }
}

class Biome {

    constructor(name, src) {
        this.name = name;
        this.src = "images/biomes/" + src;
    }

    static makeAllBiomes(biomes, width, height) {
        biomes.forEach((b) => b.makeElement());
    }

    makeElement() {
        let el = document.createElementNS(SVGNS, 'image');
        el.setAttributeNS(null, 'href', this.src);
        el.setAttributeNS(null, 'onerror', "this.setAttribute('href', 'images/icons/image_not_found.png')")
        el.classList.add("biome-area");
        el.classList.add("hidden");
        allBiomesG.appendChild(el);
    }
}

function main() {
    svgCanvas = new SVGCanvas(document.getElementById("svgMap"), document.getElementById("svgContainer"));

    //Preparing data
    //prepareSettings();
    biomes = prepareBiomes();
    prepareEventListeners();

    //Drawing
    Biome.makeAllBiomes(biomes, 2048, 2048);
    console.log("Done all biomes");
    makeGrid(100, 5, "red");
    console.log("Done with Grid");


    resetView();

    //Gets rid of lag when first displaying biomes
    toggleBiomeDisplay = toggleDisplaySwitch(toggleBiomeDisplay,  "hidden", "biome-area");
    setTimeout(function() {
        toggleBiomeDisplay = toggleDisplaySwitch(toggleBiomeDisplay,  "hidden", "biome-area")
    }, 50);

    console.log("Finished in main");

    resetView();
}

function prepareEventListeners() {
    //Canvas event listeners

    svgCanvas.addZoomEvents();
    svgCanvas.addPanEvents();

    //Setting event listeners

    document.getElementById("resetView").addEventListener("click", function(e) {
        resetView();
    });

    document.getElementById("fontSizeSlider").addEventListener("input", function(e) {
        setFontSize(this.value);
    });

    document.getElementById("iconSizeSlider").addEventListener("input", function(e) {
        setIconSize(this.value);
    });

    document.getElementById('opacitySlider').addEventListener("input",function(e) {
        setOpacity(this.value);
    });

    document.getElementById("startSearch").addEventListener("click", function(e) {
        searchLocations();
    });

    document.getElementById("searchTextInput").addEventListener("keyup", function (e) {
        if (e.key === 'Enter') {
            searchLocations();
        }
    });
    
    document.getElementById("toggleText").addEventListener("click", function(e) {
        toggleTextDisplay = toggleDisplaySwitch(toggleTextDisplay, "text-display-hover", "icon-text");
    });

    document.getElementById("toggleBiomes").addEventListener("click", function(e) {
        toggleBiomeDisplay = toggleDisplaySwitch(toggleBiomeDisplay, "hidden", "biome-area");
        document.getElementById("biomeKeyDetail").open = toggleBiomeDisplay;
    });

    document.getElementById("toggleGrid").addEventListener("click", function(e) {
        toggleGridDisplay = toggleDisplaySwitch(toggleGridDisplay, "hidden", "coordinate-grid"); 
    });

    document.getElementById("toggleHidden").addEventListener("click", function(e) {
        toggleAllLocDisplay = toggleDisplaySwitch(toggleAllLocDisplay, "hidden", "location-hidden");
        Location.prepareLocationDropdown(locations, toggleAllLocDisplay);
    });

    //Distance event listeners

    document.getElementById("distanceCalculate").addEventListener("click", function(e) {
        let startLocName = document.getElementById("distanceCalculationStart").value;
        let endLocName = document.getElementById("distanceCalculationEnd").value;

        // Calculation portion
        if (startLocName == "Nothing Selected" || endLocName == "Nothing Selected" ) {
            console.log("At least one end point is invalid");
        }
        else {
            travelLines.push(new TravelLine(locations.find((element) => element.name == startLocName), locations.find((element) => element.name == endLocName)))
        }
    });

    //Custom Icon Listeners

    document.getElementById("customIconXSlider").addEventListener("input", function(e) {
        document.getElementById("customIconXDisplay").textContent = this.value;
        document.getElementsByClassName("icon-custom")[0].setAttributeNS(null, 'x', this.value-ICON_SIZE/2);
    });

    document.getElementById("customIconYSlider").addEventListener("input", function(e) {
        document.getElementById("customIconYDisplay").textContent = this.value;
        document.getElementsByClassName("icon-custom")[0].setAttributeNS(null, 'y', this.value-ICON_SIZE/2);

    });

    document.getElementById("toggleCustomIcon").addEventListener("click", function(e) {
        toggleCustomIconDisplay = toggleDisplaySwitch(toggleCustomIconDisplay, "hidden", "icon-custom"); 
    })
}

function prepareBiomes() {
    return [
        new Biome("Death Basin", "Death_Basin.webp"),
        new Biome("Desert", "Desert.webp"),
        new Biome("Flooded Valley", "Flooded_Valley.webp"),
        new Biome("Mesa", "Mesa.webp"),
        new Biome("Mountains", "Mountains.webp"),
        new Biome("Nokomont Midlands", "Nokomont_Midlands.webp"),
        new Biome("West Badlands", "West_Badlands.webp")
    ]
}

function makeGrid(increment, radius, color) {
    /*
        increment :: x and y step for how often a dot is placed
            should be power of 2 b/c map is 2048/2048
        radius :: radius of cirlce
        color :: color of circle and text
    */

    for (let x = 0; x <= 2048; x += increment) { 
        for (let y = 0; y <= 2048; y += increment) {
            let el = document.createElementNS(SVGNS, 'circle');
            el.setAttributeNS(null, 'cx', x);
            el.setAttributeNS(null, 'cy', y);
            el.setAttributeNS(null, 'r', radius);
            el.setAttributeNS(null, 'fill', color);
            el.classList.add("coordinate-grid");
            el.classList.add("hidden");
            gridG.appendChild(el);

            let txt = document.createElementNS(SVGNS, "text");
            txt.setAttributeNS(null, 'x', x);
            txt.setAttributeNS(null, 'y', y);
            txt.classList.add("coordinate-grid");
            txt.classList.add("hidden");
            txt.textContent = "(" + x + "," + y + ")";
            gridG.appendChild(txt);
        }
    }
}

function setFontSize(fontSize) {
    document.getElementById("fontSizeDisplay").textContent = fontSize;
    document.getElementById("fontSizeSlider").value = fontSize

    Array.prototype.forEach.call(locations, function (l) {
        l.changeFontSize(fontSize);
    });
}

function setIconSize(iconSize) {
    document.getElementById("iconSizeDisplay").textContent = iconSize;
    document.getElementById("iconSizeSlider").value = iconSize

    Array.prototype.forEach.call(locations, function (l) {
        l.changeIconSize(iconSize);
    });
}

function setOpacity(opacity) {
    document.getElementById("opacityDisplay").textContent = opacity
    document.getElementById("opacitySlider").value = opacity
    Array.prototype.forEach.call(document.getElementsByClassName("biome-area"), function (t) {
        t.style.opacity = opacity
    })
}

function toggleDisplaySwitch(setting, className, elementsClass) {
    
    /*
        setting :: global variable for toggle
        className :: class that gets added/removed for toggle functionality
        elementsClass :: class name for elements to add className to

    */

    if (!setting) { //Setting is off -> on
        Array.prototype.forEach.call(document.getElementsByClassName(elementsClass), function(t) {
                t.classList.remove(className);
        });
        return true
    }
    else { //Setting is on -> off
        Array.prototype.forEach.call(document.getElementsByClassName(elementsClass), function(t) {
                t.classList.add(className);
        });
        return false
    }
}

function resetView() {
    svgCanvas.resetView();
    setFontSize(ICON_TEXT_FONT_SIZE);
    setIconSize(ICON_SIZE);
    setOpacity(.3);
}

function searchLocations() {
    //Search
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
}

main();
