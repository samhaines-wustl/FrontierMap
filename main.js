
import rawLocations from './json/locationsData.json' with {type: 'json'};
import rawFountains from './json/fountainsData.json' with {type: 'json'};


//Constants
const ICON_SIZE = 32;
const FONT_SIZE = ICON_SIZE/2;
const PIXEL_TO_MILES = 8/192*2; //This is 8mi for 196px on a 4096px, Am using size 2048 so multiple by 2
const SVGNS = "http://www.w3.org/2000/svg";
const MAX_ZOOM = 15
const MIN_ZOOM = 3
const ZOOM_SCALE = 1.1

let travelLines = [];
let settings = [];
let locations = [];



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
        console.log("constructed")
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
        this.viewbox = SVGCanvas.DEFAULT_VIEWBOX
        this.scale = SVGCanvas.DEFAULT_SCALE
        this.image.setAttribute('viewBox', `${this.viewbox.x} ${this.viewbox.y} ${this.viewbox.w} ${this.viewbox.h}`); 
    }
}


function main() {
    let svgCanvas = new SVGCanvas(document.getElementById("svgMap"), document.getElementById("svgContainer"))
    svgCanvas.addZoomEvents();
    svgCanvas.addPanEvents();

    //Preparing data
    prepareEventListeners()

    console.log("Preparation Complete");
    //Drawing
    console.log("Done all icons");
    console.log("Finished in main");
}


function prepareEventListeners() {

        //Mouse coordinates
        SVG_IMAGE.addEventListener('mousemove',function(e) {
            let coords = getMapCoords(e.clientX, e.clientY);
            /*curosrPoint.x = e.clientX;
            curosrPoint.y = e.clientY;
            let loc = curosrPoint.matrixTransform(svgMap.getScreenCTM().inverse());
            // Use loc.x and loc.y here */
            let el = document.getElementById('mouseCoords');
            el.innerHTML = "X: " + coords.x.toFixed(1) + ", Y: " + coords.y.toFixed(1);
        },false);
        
}

function getMapCoords(x ,y) {
    let cursorPoint = svgMap.createSVGPoint();
    cursorPoint.x = x;
    cursorPoint.y = y;
    let loc = cursorPoint.matrixTransform(svgMap.getScreenCTM().inverse());
    return {x: loc.x, y: loc.y}
}

main();
