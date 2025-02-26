
import rawLocations from './json/locationsData.json' with {type: 'json'};
import rawFountains from './json/fountainsData.json' with {type: 'json'};


//Other Stuff
const ICON_SIZE = 32;
const FONT_SIZE = ICON_SIZE/2;
const PIXEL_TO_MILES = 8/192/2; //This is 8mi for 196px on a 4096px, Am using size 8192 so divided by 2
const SVGNS = "http://www.w3.org/2000/svg";

let distLines = [];
let travelLines = [];
let settings = [];
let locations = [];


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

    static fountainConstructor(x, y, permission_level) {
        return new Location("TRF", "fountain", "Fountain_1", x, y, permission_level);
    }

    static makeAllLocations() {
        locations.forEach((loc) => loc.makeElement());
    }

    makeElement() {
        //group element
        let g = document.createElementNS(SVGNS, 'g');
        g.addEventListener('mouseover', (e) => { //Reappends node so that it is drawn first (nothing covers text)
            document.getElementById("SVG_Map").appendChild(e.target.parentNode);
        })
        //image
        let el = document.createElementNS(SVGNS, 'image');
        el.setAttributeNS(null, 'x', this.x-ICON_SIZE/2);
        el.setAttributeNS(null, 'y', this.y-ICON_SIZE/2);
        el.setAttributeNS(null, 'href', this.src);
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
        document.getElementById("SVG_Map").appendChild(g);
    }
}

class TravelLine {
    constructor(loc1, loc2) {
        this.loc1 = loc1;
        this.loc2 = loc2;
        this.distance = this.calcDistance();

        this.addToTable();
    }

    static removeTravelLine(index) {
        document.getElementById('distTable').deleteRow(index);
        travelLines.splice(index-1, 1);
    }

    static drawAllLines() {
        travelLines.forEach((l) => l.draw());
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
            if (icon.type != 'fountain' && icon.visible && (icon.level == 'public' || settings.find(o => o.name === 'admin').val)) {
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

    draw() {
    //Starting Circle
        ctx.beginPath();
        ctx.arc(this.loc1.x,this.loc1.y, ICON_SIZE/8,0,2*Math.PI);
        ctx.fillStyle = '#B42E15';
        ctx.fill();
        ctx.stroke();
   //Line b/w
   //ctx.setLineDash([48,32])
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#B42E15';
        ctx.moveTo(this.loc1.x, this.loc1.y);
        ctx.lineTo(this.loc2.x, this.loc2.y);
        ctx.stroke();
   //Ending Circle
        ctx.beginPath();
        ctx.arc(this.loc2.x,this.loc2.y, ICON_SIZE/8,0,2*Math.PI);
        ctx.fillStyle = '#B42E15';
        ctx.fill();
        ctx.stroke(); 
    }
}

/*
    SVG Testing
*/

const MAX_ZOOM = 15
const MIN_ZOOM = 3
let currentZoom = 3
let zoomScale = 1

function setZoom(el, scale) {
    el.style.transform = `scale(${scale/10})`;
    el.style.transformOrigin = `50% 50%`;
    document.getElementById("zoomLevelDisplay").innerHTML = (scale/3).toFixed(1);
  }
  
  var drag = {
      elem: null,
      x: 0,
      y: 0,
      state: false
  };
  var delta = {
      x: 0,
      y: 0
  };
  
  
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

  document.getElementById('vp1').addEventListener("wheel", (e) => wheelTest(e.deltaY*-1));
  document.getElementById('recenter').addEventListener("click", function() {recenterMap();})

function recenterMap() {
    setZoom(document.querySelector('#container'), currentZoom)
    let el = $('#container');
    el.offset({
        left: 30,
        top: 50
    });
    currentZoom = 3;
}

recenterMap();

function wheelTest(va) {
    if (va > 1)
        currentZoom = Math.min(MAX_ZOOM, currentZoom+zoomScale)
    else
        currentZoom = Math.max(MIN_ZOOM, currentZoom-zoomScale)
    setZoom(document.querySelector('#container'), currentZoom)
}
    
// Find your root SVG element
var svg = document.querySelector('svg');

// Create an SVGPoint for future math
var pt = svg.createSVGPoint();

// Get point in global SVG space
function cursorPoint(evt){
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

svg.addEventListener('mousemove',function(evt){
  var loc = cursorPoint(evt);
  // Use loc.x and loc.y here
  let el = document.getElementById('mouseCoords');
  el.innerHTML = "X: " + loc.x.toFixed(1) + ", Y: " + loc.y.toFixed(1);
},false);





/*
Normal
*/
function main() {
    //Preparing data
    prepareSettings();
    prepareLocations();

    document.getElementById('distButton').addEventListener('click', prepareTravelLines);


    //Drawing
    TravelLine.refreshDistSelection();
    draw();
    console.log("Done Main");
    //let c = new Location(rawLocations[0].name, rawLocations[0].type, rawLocations[0].icon_src, rawLocations[0].x, rawLocations[0].y)
    //c.makeElement();
    Location.makeAllLocations();
    console.log("Done all icons")
}

function draw() {
    
}

//Prep Settings
function prepareSettings() {
    settings.push(new Setting("Towns", "town", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Cryptids", "cryptid", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Locales", "locale", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Env. Sites", "envSite", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Fountains", "fountain", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Text", "text", "Public", false, notYetImplement)),
    settings.push(new Setting("Biomes", "biome", "Public", false, notYetImplement)),
    settings.push(new Setting("Factions", "faction", "Public", true, notYetImplement)),
    settings.push(new Setting("Lines", "line", "Public", true, notYetImplement)),
    settings.push(new Setting("Grid", "grid", "Admin", false, notYetImplement)),
    settings.push(new Setting("Admin", "admin", "Admin", false, TravelLine.refreshDistSelection))
};

function prepareLocations() {
    rawLocations.forEach((loc) => {
        locations.push(new Location(loc.name, loc.type, loc.icon_src, loc.x, loc.y, loc.permission_level));
    });
    rawFountains.forEach((loc) => {
        locations.push(Location.fountainConstructor(loc.x, loc.y, loc.permission_level));
    });
}

function prepareTravelLines() {
    let loc1 = document.getElementById("distLoc1").value;
    let loc2 = document.getElementById('distLoc2').value;
    
    if (loc1 == 'Nothing Selected' || loc2 == 'Nothing Selected')
        return;
    else
        travelLines.push(new TravelLine(locations.find(o => o.name === loc1), locations.find(o => o.name === loc2)));
    console.log(travelLines);
}

function notYetImplement() {
    console.log("Not yet implement");
    //console.log(settings);
}

function drawCoordGrid() {
    for (let x = -4000; x <= 3800; x +=200) {
        for (let y = -3600; y <= 4200; y += 200) {
            //Dot
            ctx.beginPath();
            ctx.arc(x,y, 2,0,2*Math.PI);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.stroke();
            //Text
            ctx.fillStyle = "#000000";
            ctx.font = "16px Arial";
            ctx.fillText(" (" + x + "," + y + ")", x, y);
        }
    }
}

main();

