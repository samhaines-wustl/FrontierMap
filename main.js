
import iconData from './iconData.json' with {type: 'json'};

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
const ICON_SIZE = 256;


let displaySettings = {
    "admin": false, 
    "town": false, 
    "cryptid": false, 
    "locale": false, 
    "envSite": false,
    "fountain": false,
    "biome": false,
    "faction": false
}

let iconImages = {};
let blankMap;

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

    //Repeat the map
    requestAnimationFrame( draw );
}

//Prep Icons
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
    for (let i in iconData) {
        if (iconData[i].permission_level == "public" ? displaySettings[iconData[i].type] : displaySettings.admin)
            ctx.drawImage(iconImages[iconData[i].icon], iconData[i].x - ICON_SIZE/2, iconData[i].y - ICON_SIZE/2, ICON_SIZE, ICON_SIZE);
    }
}

// Other
function toggleDisplay(parameter) {
    displaySettings[parameter] = !displaySettings[parameter];
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
            console.log(zoomFactor)
            cameraZoom = zoomFactor*lastZoom
        }
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
        
        console.log(zoomAmount)
    }
}


// Event Listeners
canvas.addEventListener('mousedown', onPointerDown)
canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
canvas.addEventListener('mouseup', onPointerUp)
canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
canvas.addEventListener('mousemove', onPointerMove)
canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY*-1))

document.getElementById('buttonTown').addEventListener('click', function() {toggleDisplay('town')});


console.log(displaySettings);
// Ready, set, go
loadAllImages();
draw()