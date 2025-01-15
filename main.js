const elem = document.getElementById('panzoom-element');
const panzoom = Panzoom(elem, {
  maxScale: 10,
});
panzoom.pan(0, 0, {relative:true});
panzoom.zoom(.6, { animate: true });
panzoom.zoomOut();

// Panning and pinch zooming are bound automatically (unless disablePan is true).
// There are several available methods for zooming
// that can be bound on button clicks or mousewheel.
//button.addEventListener('click', panzoom.zoomIn)
elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);


import rawLocations from './json/locationsData.json' with {type: 'json'};
import rawFountains from './json/fountainsData.json' with {type: 'json'};

//Zoom and Canvas Stuff
let canvas = document.getElementById("panzoom-element");
let ctx = canvas.getContext('2d');


let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;


//Other Stuff
const ICON_SIZE = 128;
const FONT_SIZE = ICON_SIZE/2;
const PIXEL_TO_MILES = 8/192/2; //This is 8mi for 196px on a 4096px, Am using size 8192 so divided by 2

let distLines = [];

let iconImages = {};
let settings = [];
let visibleIcons = [];
let locations = [];
let blankMap;

class IconCategory {
    constructor(name, count) {
        this.name = name;
        this.count = count;
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
        let input = document.createElement("input");

        input.type = 'checkbox';
        input.checked = this.val;
        let currentIndex = settings.length;
        input.addEventListener('click', function() {settings[currentIndex].click()});

        let node = document.createTextNode(" "+ this.display + ":");
        div.appendChild(node);
        div.appendChild(input);
    }

    click() {
        this.val = !this.val;
        this.onClickFunc();
    }
}

class Location {
    constructor(name, type, src, x, y, level) {
        this.name = name;
        this.type = type;
        this.src = src;
        this.x = x;
        this.y = y;
        this.level = level;
        this.visible = false;
        this.iconSize = ICON_SIZE;
        this.fontSize = FONT_SIZE;
    }

    static fountainConstructor(x, y, permission_level) {
        return new Location("TRF", "fountain", "Fountain_1", x, y, permission_level);
    }

    draw() {
        if (this.visible) {
            let iconImage;
            if (Object.hasOwn(iconImages, this.src))
                iconImage = iconImages[this.src];
            else
                iconImage = iconImages['image_not_found'];
            ctx.drawImage(iconImage, this.x - this.iconSize/2, this.y - this.iconSize/2, this.iconSize, this.iconSize);

            if (settings.find(o => o.name === "text").val && this.name != "TRF")
                drawText();
        }
    }

    drawText() {
        ctx.fillStyle = "#000000";
        ctx.font = this.fontSize+ "px Arial";
        ctx.fillText(this.name, this.x+this.iconSize/2, this.y + this.iconSize/2);
    }
}

function main() {
    locations = rawLocations.concat(initializeFountains());
    prepareSettings();
    loadAllImages();

    document.getElementById('distButton').addEventListener('click', calcDistance);

    ctx.scale(.12,.12);

    // Ready, set, go
    updateVisibleIcons();
    refreshDistSelection();
    draw();
}

let t = new Image();
t.src = 'images/PipTheTroll.png';

function draw() {
    let img = new Image();
    img.src = 'images/mapBase.webp';
    ctx.drawImage(t, 0, 0);

    /*
    //Draw Locations
    drawIcons();

    //Draw Lines
    if (settings.find(o => o.name === "line").val)
        drawDistLines();

    //Draw Scale
    ctx.fillStyle = "#ffffff";
    ctx.font = FONT_SIZE*3+ "px Arial";
    ctx.fillText("8 mi", 4096 - 4096/20, 4096 - 4096/20);

    //Admin Stuff
    if (settings.find(o => o.name === "grid").val)
        drawCoordGrid();
    */
    //Repeat the map
    requestAnimationFrame( draw );
}

main();

// Prep Images
function loadAllImages() {
    blankMap = new Image();
    blankMap.src = 'images/mapBase.webp';

    loadIcons();
}

function loadIcons() {
    //Location
    let prefix = 'images/icons/';

    //Image not found
    iconImages.image_not_found = new Image();
    iconImages.image_not_found.src = prefix + 'image_not_found.png';

    //Rest of images
    let iconFileData = [
        new IconCategory("Bottle", 1), 
        new IconCategory("Cactus", 2),
        new IconCategory("Cryptid", 4),
        new IconCategory("Food", 1),
        new IconCategory("Fountain", 1),
        new IconCategory("Horse", 2),
        new IconCategory("Mine", 1),
        new IconCategory("Money", 3),
        new IconCategory("Mountain", 4),
        new IconCategory("Saloon", 1),
        new IconCategory("Temple", 1),
        new IconCategory("Town", 2),
        new IconCategory("Tree", 1),
        new IconCategory("Vase", 2)
    ];
    iconFileData.forEach((category) => {
        for (let i = 1; i <= category.count; i++) {
            let imageName = category.name + "_" + i;
            iconImages[imageName] = new Image();
            iconImages[imageName].src = prefix + imageName + '.png';
        }
    });
}

//Prep Settings
function prepareSettings() {
    settings.push(new Setting("Towns", "town", "Public", true, updateVisibleIcons)),
    settings.push(new Setting("Cryptids", "cryptid", "Public", true, updateVisibleIcons)),
    settings.push(new Setting("Locales", "locale", "Public", true, updateVisibleIcons)),
    settings.push(new Setting("Environmental Sites", "envSite", "Public", true, updateVisibleIcons)),
    settings.push(new Setting("Fountains", "fountain", "Public", true, updateVisibleIcons)),
    settings.push(new Setting("Text", "text", "Public", true, notYetImplement)),
    settings.push(new Setting("Biomes", "biome", "Public", false, notYetImplement)),
    settings.push(new Setting("Factions", "faction", "Public", true, notYetImplement)),
    settings.push(new Setting("Lines", "line", "Public", true, notYetImplement)),
    settings.push(new Setting("Grid", "grid", "Admin", false, notYetImplement)),
    settings.push(new Setting("Admin", "admin", "Admin", false, notYetImplement))
};

function notYetImplement() {
    console.log("Not yet implement");
}

// Map Elements
function drawIcons() {
    visibleIcons.forEach((icon) => {
        let iconImage;
        if (Object.hasOwn(iconImages, icon.icon_src))
            iconImage = iconImages[icon.icon_src];
        else
            iconImage = iconImages['image_not_found'];

        ctx.drawImage(iconImage, icon.x - ICON_SIZE/2, icon.y - ICON_SIZE/2, ICON_SIZE, ICON_SIZE);

        if (settings.find(o => o.name === "text").val && Object.hasOwn(icon, 'name')) {
            ctx.fillStyle = "#000000";
            ctx.font = FONT_SIZE+ "px Arial";
            ctx.fillText(icon.name, icon.x+ICON_SIZE/2, icon.y + ICON_SIZE/2);
        }
    });
}


function updateVisibleIcons() {
    visibleIcons = [];
    for (let i in locations) {
        if (locations[i].permission_level == "public" ? settings.find(o => o.name === locations[i].type).val : settings.find(o => o.name === 'admin').val)
            visibleIcons.push(locations[i]);
    }
}

function calcDistance() {
    let loc1 = document.getElementById("distLoc1").value;
    let loc2 = document.getElementById('distLoc2').value;
    
    if (loc1 == 'Nothing Selected' || loc2 == 'Nothing Selected')
        return;

    let coords = [
        {
            "x": locations.find(x => x.name === loc1).x, 
            "y": locations.find(x => x.name === loc1).y
        },
        {
        "x": locations.find(x => x.name === loc2).x, 
        "y": locations.find(x => x.name === loc2).y
        }
    ];
    let xDif = coords[0].x - coords[1].x;
    let yDif = coords[0].y - coords[1].y; 

    let distanceInPixels = Math.sqrt(xDif*xDif + yDif*yDif);
    let distanceInMiles = (distanceInPixels*PIXEL_TO_MILES).toFixed(1);

    //Updating line Storage Array
    distLines.push({
        'x1': coords[0].x,
        'y1': coords[0].y,
        'x2': coords[1].x,
        'y2': coords[1].y,
        'name1': loc1,
        'name2': loc2,
        'distance': distanceInMiles
    });

    let table = document.getElementById('distTable')
    let row = table.insertRow(-1)
    let cells = [row.insertCell(0),row.insertCell(1),row.insertCell(2),row.insertCell(3)];
    cells[0].innerHTML = distLines.at(-1).name1;
    cells[1].innerHTML = distLines.at(-1).name2;
    cells[2].innerHTML = distLines.at(-1).distance;
    cells[3].innerHTML = '<button>X</button>';
    cells[3].addEventListener('click', function() {removeDistLines(this.parentNode.rowIndex)});
}

function drawDistLines() {
    distLines.forEach((l) => {
        //Starting Circle
        ctx.beginPath();
            ctx.arc(l.x1,l.y1, ICON_SIZE/8,0,2*Math.PI);
            ctx.fillStyle = '#B42E15';
            ctx.fill();
        ctx.stroke();
        //Line b/w
        //ctx.setLineDash([48,32])
        ctx.beginPath();
            ctx.lineWidth = 10;
            ctx.strokeStyle = '#B42E15';
            ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        //Ending Circle
        ctx.beginPath();
            ctx.arc(l.x2,l.y2, ICON_SIZE/8,0,2*Math.PI);
            ctx.fillStyle = '#B42E15';
            ctx.fill();
        ctx.stroke();
    })
}

function removeDistLines(index) {
    document.getElementById('distTable').deleteRow(index);
    distLines.splice(index-1, 1);
}

// Refresh distance selection
function refreshDistSelection() {
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
    visibleIcons.forEach((icon) => {
        if (Object.hasOwn(icon, 'name')) {
            select1.add(new Option(icon.name));
            select2.add(new Option(icon.name));
        }
    });
}

function initializeFountains() {
    return rawFountains.map(f => ({...f, icon_src: "Fountain_1", type: "fountain"}));
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

//main();

