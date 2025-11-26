
import {locations} from './Locations.js';
import {Location} from './Locations.js';

import {TravelLine} from './TravelLines.js';
import {travelLines} from './TravelLines.js';

import {Profile} from './Profiles.js';
import {profiles} from './Profiles.js';

//Constants
const ICON_SIZE = 48;
const ICON_TEXT_FONT_SIZE = 32;
const SVGNS = "http://www.w3.org/2000/svg";

let settings = [];
let biomes = [];

let toggleTextDisplay = false;
let toggleBiomeDisplay = false;
let toggleGridDisplay = false;
let toggleAllLocDisplay = false;


let allBiomesG = document.getElementById('allBiomesGroup');

let gridG = document.getElementById('gridGroup');

let svgCanvas;

class SVGCanvas {
    //Old viewbox {x:1000, y: 900, w: 3000, h: 3000}
    static DEFAULT_VIEWBOX = {x:1000, y: 150, w: 3000, h: 3000}
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
        Location.searchLocations();
    });

    document.getElementById("searchTextInput").addEventListener("keyup", function (e) {
        if (e.key === 'Enter') {
            Location.searchLocations();
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

    document.getElementById("profileSelect").addEventListener("change", function(e) {
        changeProfile();
    })

    //Distance event listeners

    document.getElementById("distanceCalculate").addEventListener("click", function(e) {
        
        let startLocName = document.getElementById("distanceCalculationStart").value;
        let endLocName = document.getElementById("distanceCalculationEnd").value;

        // Calculation portion
        if (startLocName == "Nothing Selected" || endLocName == "Nothing Selected") {
            console.log("At least one end point is invalid");
        }
        else if (startLocName == endLocName) {
            console.log("Same location picked");
        }
        else {
            travelLines.push(new TravelLine(locations.find((element) => element.name == startLocName), locations.find((element) => element.name == endLocName)));
        }
    });
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

function changeProfile() {
    let newLocationsShowing = profiles.find((p) => p.id == document.getElementById("profileSelect").value).getLocationsFound();
        Array.prototype.forEach.call(document.getElementsByClassName("location-marker"), function(g) {
            g.classList.add("hidden");
        });
        newLocationsShowing.forEach((id) => {
            document.getElementById(id + "Group").classList.remove("hidden");
        });
    Location.prepareLocationDropdown(locations, newLocationsShowing);
}

function resetView() {
    svgCanvas.resetView();
    setFontSize(ICON_TEXT_FONT_SIZE);
    setIconSize(ICON_SIZE);
    setOpacity(.3);
    changeProfile();
}

main();
