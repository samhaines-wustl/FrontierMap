
import rawLocations from './json/locationsData.json' with {type: 'json'};
import rawFountains from './json/fountainsData.json' with {type: 'json'};


//Constants
const ICON_SIZE = 32;
const FONT_SIZE = ICON_SIZE/2;
const PIXEL_TO_MILES = 8/192*2; //This is 8mi for 196px on a 4096px, Am using size 2048 so multiple by 2
const SVGNS = "http://www.w3.org/2000/svg";
const MAX_ZOOM = 15
const MIN_ZOOM = 3
const ZOOM_SCALE = 1

let travelLines = [];
let settings = [];
let locations = [];

let currentZoom = 3
let svgMap = document.querySelector('#svgMap');
let allIconG = document.createElementNS(SVGNS, 'g');
allIconG.setAttribute('id', 'allIconGroup') ;

//Dragging for map
let drag = {
    elem: null,
    x: 0,
    y: 0,
    state: false
};
let delta = {
    x: 0,
    y: 0
};

//Reading cursor coords
let curosrPoint = svgMap.createSVGPoint();

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

    static fountainConstructor(x, y) {
        return new Location("TRF", "fountain", "Fountain_1", x, y);
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
        el.setAttributeNS(null, 'originalX', this.x);
        el.setAttributeNS(null, 'originalY', this.y);
        el.classList.add("icon");
        el.classList.add("icon-" + this.type);
        //text
        let txt = document.createElementNS(SVGNS, "text");
        txt.setAttributeNS(null, 'x', this.x);
        txt.setAttributeNS(null, 'y', this.y-ICON_SIZE);
        txt.classList.add("icon-text");
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
    //Preparing data
    prepareLocations();
    prepareEventListeners();
    
    //Drawing
    TravelLine.refreshDistSelection();
    Location.makeAllLocations();
    console.log("Done all icons");
    //Set up default map view
    resetMap();
    console.log("Finished in main");
}

function prepareLocations() {
    rawLocations.forEach((loc) => {
        locations.push(new Location(loc.name, loc.type, loc.icon_src, loc.x, loc.y, loc.permission_level));
    });
    rawFountains.forEach((loc) => {
        locations.push(Location.fountainConstructor(loc.x, loc.y));
    });
}

function prepareEventListeners() {
    //Mouse
        //Zoom map 
        /*
        $('.viewport').on('wheel', function(e) {
            //Get mouse coords
            console.log("test")
            let mouseCoords = getMapCoords(e.clientX, e.clientY)
            let transformOriginString = Math.min(Math.max((mouseCoords.x/2048*100).toFixed(0), 0),100) + '% ' + Math.min(Math.max((mouseCoords.y/2048*100).toFixed(0), 0),100) + '%'
            
            if (e.originalEvent.deltaY < 0)  {
                //Zoom in
                let newZoom = currentZoom+ZOOM_SCALE
                if (newZoom <= MAX_ZOOM) {
                    currentZoom = newZoom
                    setZoom(document.querySelector('#container'), currentZoom, transformOriginString)
                }
            }
            else {
                //Zoom out
                let newZoom = currentZoom - ZOOM_SCALE
                if (newZoom >= MIN_ZOOM) {
                    currentZoom = newZoom
                    setZoom(document.querySelector('#container'), currentZoom, transformOriginString)
                }
            }
        })
      
        //Dragging map
        $('.viewport').mousedown(function(e) {
            if (!drag.state && e.which == 1) {
                drag.elem = $('#container');
                drag.x = e.pageX;
                drag.y = e.pageY;
                drag.state = true;
            }
            return false;
        });
        $('.viewport').mousemove(function(e) {
            
            if (drag.state) {
                delta.x = e.pageX - drag.x;
                delta.y = e.pageY - drag.y;
            
                var cur_offset = $(drag.elem).offset();

                $(drag.elem).offset({
                    left: (cur_offset.left + delta.x),
                    top: (cur_offset.top + delta.y)
                });

                drag.x = e.pageX;
                drag.y = e.pageY;
            }
        });
        $('.viewport').mouseup(function() {
            if (drag.state) {
                drag.state = false;
            }
        });
        $('.viewport').on('contextmenu', function () {
            return false;
        });
        */
        //Mouse coordinates
        svgMap.addEventListener('mousemove',function(e) {
            let coords = getMapCoords(e.clientX, e.clientY);
            /*curosrPoint.x = e.clientX;
            curosrPoint.y = e.clientY;
            let loc = curosrPoint.matrixTransform(svgMap.getScreenCTM().inverse());
            // Use loc.x and loc.y here*/
            let el = document.getElementById('mouseCoords');
            el.innerHTML = "X: " + coords.x.toFixed(1) + ", Y: " + coords.y.toFixed(1);
        },false);

    //Buttons
    document.getElementById('recenterButton').addEventListener("click", function() {resetMap();})
    document.getElementById('distButton').addEventListener('click', function() {makeTravelLine();});


}

function makeTravelLine() {
    let loc1 = document.getElementById("distLoc1").value;
    let loc2 = document.getElementById('distLoc2').value;
    
    if (loc1 == 'Nothing Selected' || loc2 == 'Nothing Selected')
        return;
    else
        travelLines.push(new TravelLine(locations.find(o => o.name === loc1), locations.find(o => o.name === loc2)));
}

function notYetImplement() {
    console.log("Not yet implement");
    //console.log(settings);
}

//Zoom function
function setZoom(el, scale, transformOrigin) {
    console.log(transformOrigin)
    //el.style.transform = `scale(${scale/10})`;
    //el.style.transformOrigin = transformOrigin;
    el.style.transform = `scale(${scale/10})`
    el.style.transformOrigin = transformOrigin
    document.getElementById("zoomLevelDisplay").innerHTML = (scale/3).toFixed(1);
    scaleIconAndText(scale);
} 

function scaleIconAndText(scale) {
    let newIconSize = MAX_ZOOM/scale * ICON_SIZE/2 + ICON_SIZE/2;
    let newFontSize = MAX_ZOOM/scale * FONT_SIZE/2 + FONT_SIZE/2;
    $('.icon').css("width",  newIconSize + "px");
    $('.icon-text').css("font-size",  newFontSize + "px");
    let elements = document.getElementsByClassName('icon');

    for (let i = 0; i < elements.length; i++) {
        elements.item(i).setAttribute('x', elements.item(i).getAttribute('originalX') - newIconSize/2);
        elements.item(i).setAttribute('y', elements.item(i).getAttribute('originalY') - newIconSize/2);
    }
    
}

function resetMap() {
    currentZoom = 3;
    setZoom(document.querySelector('#container'), currentZoom, "50% 50%");
    let el = $('#container');
    el.offset({
        left: 50,
        top: 70
    });
}

function getMapCoords(x ,y) {
    let cursorPoint = svgMap.createSVGPoint();
    cursorPoint.x = x;
    cursorPoint.y = y;
    let loc = cursorPoint.matrixTransform(svgMap.getScreenCTM().inverse());
    return {x: loc.x, y: loc.y}
}

var panZoomTiger = svgPanZoom('#svgMap');

main();

