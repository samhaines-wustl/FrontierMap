
import rawLocations from './json/locationsData.json' with {type: 'json'};
import rawFountains from './json/fountainsData.json' with {type: 'json'};

//Zoom and Canvas Stuff
let canvas = document.getElementById("canvas")
let ctx = canvas.getContext('2d')

let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 }
let cameraZoom = .15
const MAX_ZOOM = 1.5
const MIN_ZOOM = 0.05
const SCROLL_SENSITIVITY = 0.0005

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;


//Other Stuff
const ICON_SIZE = 128;
const FONT_SIZE = ICON_SIZE/2;
const PIXEL_TO_MILES = 8/192/2; //This is 8mi for 196px on a 4096px, Am using size 8192 so divided by 2

let distLines = [];
let travelLines = [];
let iconImages = [];
let settings = [];
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
        this.onClickFunc(this.name, this.val);
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
        this.visible = settings.find(o => o.name === this.type).val;
        this.iconSize = ICON_SIZE;
        this.fontSize = FONT_SIZE;
    }

    static fountainConstructor(x, y, permission_level) {
        return new Location("TRF", "fountain", "Fountain_1", x, y, permission_level);
    }

    static drawAllLocations() {
        locations.forEach((loc) => loc.draw());
    }

    static updateVisibility(type, visibleVal) {
        locations.forEach( (loc) => {
            if (loc.type == type)
                loc.visible = visibleVal;
        });
        TravelLine.refreshDistSelection();
    }

    draw() {
        if (this.visible) {
            if (this.level == 'public' || settings.find(o => o.name === 'admin').val) {
                let iconImage;
                if (Object.hasOwn(iconImages, this.src))
                    iconImage = iconImages[this.src];
                else
                    iconImage = iconImages['image_not_found'];
                ctx.drawImage(iconImage, this.x - this.iconSize/2, this.y - this.iconSize/2, this.iconSize, this.iconSize);
    
                if (settings.find(o => o.name === "text").val && this.name != "TRF")
                    this.drawText();
            }
        }
    }

    drawText() {
        ctx.fillStyle = "#000000";
        ctx.font = this.fontSize+ "px Arial";
        ctx.fillText(this.name, this.x+this.iconSize/2, this.y + this.iconSize/2);
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





function main() {
    //Preparing data
    prepareSettings();
    prepareLocations();
    loadAllImages();

    // Event Listeners
    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
    canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY*-1))

    document.getElementById('distButton').addEventListener('click', prepareTravelLines);


    //Drawing
    TravelLine.refreshDistSelection();
    draw();
}

function draw() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
    ctx.translate( canvasWidth / 2, canvasHeight / 2 )
    ctx.scale(cameraZoom, cameraZoom)
    ctx.translate( -canvasWidth / 2 + cameraOffset.x, -canvasHeight / 2 + cameraOffset.y )
    ctx.clearRect(0,0, canvasWidth, canvasHeight)
    ctx.drawImage(blankMap, -1*blankMap.width/2, -1*blankMap.height/2);

    //Draw Locations
    //drawIcons();
    Location.drawAllLocations();

    //Draw Lines
    TravelLine.drawAllLines();

    //Draw Scale
    ctx.fillStyle = "#ffffff";
    ctx.font = FONT_SIZE*3+ "px Arial";
    ctx.fillText("8 mi", 4096 - 4096/20, 4096 - 4096/20);

    //Admin Stuff
    if (settings.find(o => o.name === "grid").val)
        drawCoordGrid();

    //Repeat the map
    requestAnimationFrame( draw );
}

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
        new IconCategory("City", 2),
        new IconCategory("Cryptid", 4),
        new IconCategory("Food", 1),
        new IconCategory("Fountain", 1),
        new IconCategory("Horse", 2),
        new IconCategory("Mine", 1),
        new IconCategory("Money", 3),
        new IconCategory("Mountain", 5),
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
    console.log(iconImages);
}

//Prep Settings
function prepareSettings() {
    settings.push(new Setting("Towns", "town", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Cryptids", "cryptid", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Locales", "locale", "Public", true, Location.updateVisibility)),
    settings.push(new Setting("Environmental Sites", "envSite", "Public", true, Location.updateVisibility)),
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
















// All Zoom and Scroll Stuff

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e)
{
    if (e.touches && e.touches.length == 1)
    {
        return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
    else if (e.clientX && e.clientY)
    {
        return { x: e.clientX, y: e.clientY }        
    }
}

let isDragging = false
let dragStart = { x: 0, y: 0 }

function onPointerDown(e)
{
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
}

function onPointerUp(e)
{
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e)
{
    if (isDragging)
    {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
    }
}

function handleTouch(e, singleTouchHandler)
{
    if ( e.touches.length == 1 )
    {
        singleTouchHandler(e)
    }
    else if (e.type == "touchmove" && e.touches.length == 2)
    {
        isDragging = false
        handlePinch(e)
    }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e)
{
    e.preventDefault()
    
    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
    
    // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
    let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
    
    if (initialPinchDistance == null)
    {
        initialPinchDistance = currentDistance
    }
    else
    {
        adjustZoom( null, currentDistance/initialPinchDistance )
    }
}

function adjustZoom(zoomAmount, zoomFactor)
{
    if (!isDragging)
    {
        if (zoomAmount)
        {
            cameraZoom += zoomAmount
        }
        else if (zoomFactor)
        {
            //console.log(zoomFactor)
            cameraZoom = zoomFactor*lastZoom
        }
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
        
        //console.log(zoomAmount)
    }
}


main();

