// These imports are static and therefore cannot be in a try-catch. Switch to dynamic
//import rawLocations from './json/locationsData.json' with {type: 'json'};
//import rawLocationsInformation from './json/locationsInformation.json' with {type: 'json'};


fetch('./json/manifest.json')
  .then(res => res.json())
  .then(fileList => {
    return Promise.allSettled(
      fileList.map(file => {
        return fetch(`./locations/${file}`).then(res => {
            if (!res.ok) {
                return `Couldn't find ${file}`;
            }
            return res.json()
        })
    })
    );
  })
  .then(jsonDataArray => {
    let valueArray = jsonDataArray.map(obj => obj.value)
    locations = prepareLocations(valueArray);
    parseLocationsInformation(valueArray);

    
    Location.makeAllLocations(locations);
    console.log("Done all icons");
    
    prepareSelectDropdown();
    resetView();

    console.log("Fetch Complete")
  })

//Constants
const ICON_SIZE = 48;
const ICON_TEXT_FONT_SIZE = 32;
const PIXEL_TO_MILES = 8/192*2; //This is 8mi for 196px on a 4096px, I'm using size 2048 so multiple by 2
const SVGNS = "http://www.w3.org/2000/svg";

let travelLines = [];
let settings = [];
let locations = [];
let biomes = [];
let locationsInformation = {};

let toggleTextDisplay = false;
let toggleBiomeDisplay = false;
let toggleGridDisplay = false;
let toggleAllLocDisplay = false;


let allIconG = document.createElementNS(SVGNS, 'g');
allIconG.setAttribute('id', 'allIconGroup');

let allBiomesG = document.createElementNS(SVGNS, 'g');
allBiomesG.setAttribute('id', 'allBiomesGroup');

let allTLinesG = document.createElementNS(SVGNS, 'g');
allTLinesG.setAttribute('id', 'allTLinesG');

let gridG = document.createElementNS(SVGNS, 'g');
gridG.setAttribute('id', 'gridGroup');


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
    constructor(name, type, src, x, y, found) {
        this.name = name;
        this.type = type;
        this.src = "images/icons/" + src + ".png";
        this.x = x;
        this.y = y;
        this.found = found;
    }

    static makeAllLocations(locs) {
        locs.forEach((loc) => loc.makeElement());
    }

    makeElement() {
        //group element
        let g = document.createElementNS(SVGNS, 'g');
        g.addEventListener('mouseover', (e) => { //Reappends node so that it is drawn first (nothing covers text)
            allIconG.appendChild(e.target.parentNode);
        });
        let that = this;
        g.addEventListener('click', function(e) {
            populateInformation(that.name);
        });
        //image
        let el = document.createElementNS(SVGNS, 'image');
        el.setAttributeNS(null, 'x', this.x-ICON_SIZE/2);
        el.setAttributeNS(null, 'y', this.y-ICON_SIZE/2);
        el.setAttributeNS(null, 'href', this.src);
        el.setAttributeNS(null, 'onerror', "this.setAttribute('href', 'images/icons/image_not_found.png')")
        el.setAttribute('originalX', this.x);
        el.setAttribute('originalY', this.y);
        el.setAttribute("searchName", this.name.toLowerCase());
        el.classList.add("icon");
        el.classList.add("icon-" + this.type);
        //text
        let txt = document.createElementNS(SVGNS, "text");
        txt.setAttributeNS(null, 'filter', "url(#rounded-corners-2)")
        txt.setAttributeNS(null, 'x', this.x);
        txt.setAttributeNS(null, 'y', this.y-ICON_SIZE);
        txt.classList.add("icon-text");
        txt.classList.add("text-display-hover");
        txt.textContent = this.name;
        //Apending
        g.appendChild(el);
        g.appendChild(txt);
        if (!this.found) {
            g.classList.add("location-hidden");
            g.classList.add("hidden");
        }
        g.classList.add("location-marker")
        allIconG.appendChild(g);
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
        allTLinesG.appendChild(g);
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
    /*
    locations = prepareLocations(rawLocations);
    parseLocationsInformation(rawLocationsInformation);
    */
    biomes = prepareBiomes();
    prepareEventListeners();

    //Drawing
    Biome.makeAllBiomes(biomes, 2048, 2048);
    console.log("Done all biomes");
    /*
    Location.makeAllLocations(locations);
    console.log("Done all icons");
    */
    makeGrid(100, 5, "red");
    console.log("Done with Grid");
    appendGroupsToCanvas();
    console.log("All groups appended");

    

    resetView();

    //Gets rid of lag when first displaying biomes
    toggleBiomeDisplay = toggleDisplaySwitch(toggleBiomeDisplay,  "hidden", "biome-area");
    setTimeout(function() {
        toggleBiomeDisplay = toggleDisplaySwitch(toggleBiomeDisplay,  "hidden", "biome-area")
    }, 5);

    console.log("Finished in main");
}

function prepareLocations(rawLocs) {
    let processedLocs = []
    rawLocs.forEach((loc) => {
        //Setting up objects
        processedLocs.push(new Location(loc.name, loc.type, loc.icon_src, loc.x, loc.y, loc.found));

        //Setting up select dropdown
        /*
        Array.prototype.forEach.call(document.getElementsByClassName("distance-location-select"), function(element) {
            if (loc.found || toggleAllLocDisplay) {
                let option = document.createElement("option")
                option.value = loc.name;
                option.innerHTML = loc.name;
                element.appendChild(option);
            }
        });*/
    });
    return processedLocs
}

function prepareSelectDropdown() {
    Array.prototype.forEach.call(document.getElementsByClassName("distance-location-select"), function(element) {
        //Clear out previous options
        while (element.firstChild) {
            element.removeChild(element.lastChild);
        }
        // Add Nothing Selected option
        let option = document.createElement("option")
        option.value = "Nothing Selected";
        option.innerHTML = "Nothing Selected";
        element.appendChild(option);

        locations.forEach((loc) => {
            if (loc.found || toggleAllLocDisplay) {
                let option = document.createElement("option")
                option.value = loc.name;
                option.innerHTML = loc.name;
                element.appendChild(option);
            }
        })
    });
}

function prepareEventListeners() {
    svgCanvas.addZoomEvents();
    svgCanvas.addPanEvents();

    document.getElementById("resetView").addEventListener("click", function(e) {
        resetView();
    });

    document.getElementById("fontSizeSlider").oninput = function(e) {
        setFontSize(this.value);
    };

    document.getElementById("iconSizeSlider").oninput = function(e) {
        setIconSize(this.value);
    };

    document.getElementById('opacitySlider').oninput = function(e) {
        setOpacity(this.value);
    }

    document.getElementById("startSearch").addEventListener("click", function(e) {
        searchLocations();
    });

    document.getElementById("searchTextInput").onkeyup = function (e) {
        if (e.key === 'Enter') {
            searchLocations();
        }
    };
    

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
        prepareSelectDropdown();
    });

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

function parseLocationsInformation(rawLocsInfo) {
    rawLocsInfo.forEach((locInfo) => {
        let header, blurb, places, people, other = "";
        header = blurb = places = people = other = "";

        header = "<h2>" + locInfo.name + "</h2>";
        blurb = "<p>" + locInfo.blurb + "</p>";

        //Places
        if (locInfo.places && locInfo.places != "") { //Checks if not empty
            places = "<div> Places <ul>";
            locInfo.places.forEach( (place) => {
                let [name, info] = place.split(':')
                places += "<li>";
                places +=  `<b>${name}</b>: ${info}`;
                places += "</li>";
            })
            places += "</ul></div></br>";
        }

        //People
        if (locInfo.people && locInfo.people != "") { //Checks if not empty
            people = "<div> People <ul>";
            locInfo.people.forEach( (person) => {
                let [name, info] = person.split(':')
                people += "<li>";
                people +=  `<b>${name}</b>: ${info}`;
                people += "</li>";
            })
            people += "</ul></div></br>";
        }

        other = "<i>" + locInfo.misc + "</i>";

        let parsedInfo = header + blurb + places + people + other;
        
        locationsInformation[locInfo.name.toLowerCase()] = parsedInfo;
    });
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
    Array.prototype.forEach.call(document.getElementsByClassName("icon-text"), function (t) {
        t.style.fontSize = fontSize + "px";
    });
}

function setIconSize(iconSize) {
    document.getElementById("iconSizeDisplay").textContent = iconSize;
    document.getElementById("iconSizeSlider").value = iconSize
    Array.prototype.forEach.call(document.getElementsByClassName("icon"), function (t) {
        t.style.width = iconSize + "px";
        t.setAttributeNS(null, 'x', t.getAttribute('originalX') - iconSize/2)
        t.setAttributeNS(null, 'y', t.getAttribute('originalY') - iconSize/2)
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
        onText :: button text display when on
        offText :: button text display when off
        className :: class that gets added/removed for toggle functionality
        elementsClass :: class name for elements to add className to
        element :: button element

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

function appendGroupsToCanvas() {
    svgMap.appendChild(allBiomesG);
    svgMap.appendChild(allIconG);
    svgMap.appendChild(allTLinesG);
    svgMap.appendChild(gridG);
}

function resetView() {
    svgCanvas.resetView();
    setFontSize(ICON_TEXT_FONT_SIZE, ICON_SIZE);
    setIconSize(ICON_SIZE);
    setOpacity(.3);
}

function searchLocations() {
    //Clear Past Search
    Array.prototype.forEach.call(document.getElementsByClassName("icon"), function (i) {
        i.classList.remove("search-result-highlight");
    });

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

function populateInformation(name) {
    console.log(name.toLowerCase() + " information being populated")
    let informationContent = (name.toLowerCase() in locationsInformation) ? locationsInformation[name.toLowerCase()] : "No information for:</br>" + name 
    document.getElementById("informationTextBox").innerHTML = informationContent
}

main();
