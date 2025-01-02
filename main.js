
import locations from './locationsData.json' with {type: 'json'};

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


let displaySettings = {
    "town": true, 
    "cryptid": false, 
    "locale": true, 
    "envSite": true,
    "fountain": false,
    "biome": false,
    "faction": false,
    "text": true,
    "line": true
}

let adminSettings = {
    "admin": false, 
    "loggingCoords": false
}

let iconImages = {};
let visibleIcons = [];
let blankMap;


function main() {
    initializeDisplaySettings();


    // Event Listeners
    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
    canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY*-1))

    document.getElementById('toggleTown').addEventListener('click', function() {toggleDisplay('town')});
    document.getElementById('toggleCryptid').addEventListener('click', function() {toggleDisplay('cryptid')});
    document.getElementById('toggleEnvSite').addEventListener('click', function() {toggleDisplay('envSite')});
    document.getElementById('toggleFountain').addEventListener('click', function() {toggleDisplay('fountain')});
    document.getElementById('toggleBiome').addEventListener('click', function() {toggleDisplay('biome')});
    document.getElementById('toggleFaction').addEventListener('click', function() {toggleDisplay('faction')});
    document.getElementById('toggleText').addEventListener('click', function() {toggleDisplay('text')});
    document.getElementById('toggleLine').addEventListener('click', function() {toggleDisplay('line')});
    

    document.getElementById('distButton').addEventListener('click', calcDistance);


    // Ready, set, go
    updateVisibleIcons();
    loadAllImages();
    refreshDistSelection();
    draw();
}

function draw()
{
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
    ctx.translate( canvasWidth / 2, canvasHeight / 2 )
    ctx.scale(cameraZoom, cameraZoom)
    ctx.translate( -canvasWidth / 2 + cameraOffset.x, -canvasHeight / 2 + cameraOffset.y )
    ctx.clearRect(0,0, canvasWidth, canvasHeight)
    ctx.drawImage(blankMap, -1*blankMap.width/2, -1*blankMap.height/2);

    //Draw Towns
    drawIcons();

    //Draw Lines
    if (displaySettings.line)
        drawDistLines();

    //Draw Scale
    ctx.fillStyle = "#ffffff";
    ctx.font = FONT_SIZE*3+ "px Arial";
    ctx.fillText("8 mi", 4096 - 4096/20, 4096 - 4096/20);

    //Admin Stuff

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
    iconImages.Town_1 = new Image();
    iconImages.Town_1.src = 'images/icons/Town_1.png';
}

// Map Elements
function drawIcons() {
    visibleIcons.forEach((icon) => {
        ctx.drawImage(iconImages[icon.icon_src], icon.x - ICON_SIZE/2, icon.y - ICON_SIZE/2, ICON_SIZE, ICON_SIZE);
        if (displaySettings.text) {
            ctx.fillStyle = "#000000";
            ctx.font = FONT_SIZE+ "px Arial";
            ctx.fillText(icon.name, icon.x+ICON_SIZE/2, icon.y + ICON_SIZE/2);
        }
    });
}

// Other
function toggleDisplay(parameter) {
    displaySettings[parameter] = !displaySettings[parameter];
    updateVisibleIcons();
    refreshDistSelection();
    //console.log(visibleIcons);
}

function toggleConfigs(parameter) {
    adminSettings[parameter] = !adminSettings[parameter];
    updateVisibleIcons();
    refreshDistSelection();
    console.log(adminSettings);
}

function updateVisibleIcons() {
    visibleIcons = [];
    for (let i in locations) {
        if (locations[i].permission_level == "public" ? displaySettings[locations[i].type] : displaySettings.admin)
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

    document.getElementById("distResult").textContent = distanceInMiles + " mi";

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
        select1.add(new Option(icon.name));
        select2.add(new Option(icon.name));
    });
}

function initializeDisplaySettings() {
    for (let x in displaySettings) {
        document.getElementById(String("toggle"+x.replace(/^./, char => char.toUpperCase()))).checked = displaySettings[x];
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

