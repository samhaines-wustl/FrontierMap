
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

let currentZoom = 3
let svgMap = document.querySelector('#svgMap');
let zoomMap = document.querySelector('#zoom');
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


function main() {
    //Preparing data
    
    //Drawing
    console.log("Done all icons");
    //Set up default map view
    console.log("Finished in main");
    //var panZoomTiger = svgPanZoom('#svgMap', {zoomScaleSensitivity: 0.2});
}


function prepareEventListeners() {
    //Mouse
        //Zoom map 
        
        /*$('.viewport').on('wheel', function(e) {
            //Get mouse coords
            let mouseCoords = getMapCoords(e.clientX, e.clientY)
            let transformOriginString = Math.min(Math.max((mouseCoords.x/2048*100).toFixed(0), 0),100) + '% ' + Math.min(Math.max((mouseCoords.y/2048*100).toFixed(0), 0),100) + '%'
            
            if (e.originalEvent.deltaY < 0)  {
                //Zoom in
                let newZoom = currentZoom*ZOOM_SCALE
                if (newZoom <= MAX_ZOOM) {
                    currentZoom = newZoom
                    newZoomFunction(e.clientX, e.clientY, currentZoom)
                    //setZoom(document.querySelector('#container'), currentZoom, transformOriginString)
                }
            }
            else {
                //Zoom out
                let newZoom = currentZoom/ZOOM_SCALE
                if (newZoom >= .2) {
                    currentZoom = newZoom
                    newZoomFunction(e.clientX, e.clientY, currentZoom)
                    //setZoom(document.querySelector('#container'), currentZoom, transformOriginString)
                }
            }
        }) */
        
        //Dragging map
        $('#svgMap').mousedown(function(e) {
            if (!drag.state && e.which == 1) {
                drag.elem = $('#container');
                drag.x = e.pageX;
                drag.y = e.pageY;
                drag.state = true;
            }
            return false;
        });
        $('#svgMap').mousemove(function(e) {
            
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
        $('#svgMap').mouseup(function() {
            if (drag.state) {
                drag.state = false;
            }
        });
        $('#svgMap').on('contextmenu', function () {
            return false;
        });
        
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


function notYetImplement() {
    console.log("Not yet implement");
    //console.log(settings);
} 

function getMapCoords(x ,y) {
    let cursorPoint = svgMap.createSVGPoint();
    cursorPoint.x = x;
    cursorPoint.y = y;
    let loc = cursorPoint.matrixTransform(svgMap.getScreenCTM().inverse());
    return {x: loc.x, y: loc.y}
}

function zoomAtPoint(zoomScale, point, zoomAbsolute) {
    var originalState = this.viewport.getOriginalState();
  
    if (!zoomAbsolute) {
      // Fit zoomScale in set bounds
      if (
        this.getZoom() * zoomScale <
        this.options.minZoom * originalState.zoom
      ) {
        zoomScale = (this.options.minZoom * originalState.zoom) / this.getZoom();
      } else if (
        this.getZoom() * zoomScale >
        this.options.maxZoom * originalState.zoom
      ) {
        zoomScale = (this.options.maxZoom * originalState.zoom) / this.getZoom();
      }
    } else {
      // Fit zoomScale in set bounds
      zoomScale = Math.max(
        this.options.minZoom * originalState.zoom,
        Math.min(this.options.maxZoom * originalState.zoom, zoomScale)
      );
      // Find relative scale to achieve desired scale
      zoomScale = zoomScale / this.getZoom();
    }
    //^Getting zoomScale value
    //Viewport is svg object
    //point is mousepoint
  
    var oldCTM = this.viewport.getCTM(),
      relativePoint = point.matrixTransform(oldCTM.inverse()),
      modifier = this.svg
        .createSVGMatrix()
        .translate(relativePoint.x, relativePoint.y)
        .scale(zoomScale)
        .translate(-relativePoint.x, -relativePoint.y),
      newCTM = oldCTM.multiply(modifier);
  
    if (newCTM.a !== oldCTM.a) {
      this.viewport.setCTM(newCTM);
    }
}

function setCTM(element, matrix) {
    var m = matrix;
    var s = "matrix(" + m.a + "," + m.b + "," + m.c + "," + m.d + "," + m.e + "," + m.f + ")";
    
    element.setAttributeNS(null, "transform", s);
}

var svgEl = document.getElementById('svgMap');
var zoomEl = document.getElementById('zoom');
var zoomScale = 1;

svgEl.addEventListener('wheel', function(e) {
    var delta = e.wheelDeltaY;
    zoomScale = Math.pow(1.1, delta/360);
    
    var p = svgEl.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    
    p = p.matrixTransform( svgEl.getCTM().inverse() );
    
    var zoomMat = svgEl.createSVGMatrix()
            .translate(p.x, p.y)
            .scale(zoomScale)
            .translate(-p.x, -p.y);
    
    setCTM(zoomEl, zoomEl.getCTM().multiply(zoomMat));
    return false
});

//var elementHere = document.querySelector('#svgMap');
////panzoom(elementHere);

$('#svgMap').hover(function (){
    $('body').css('overflow','hidden');
}, function (){
    $('body').css('overflow','auto');
})


main();
