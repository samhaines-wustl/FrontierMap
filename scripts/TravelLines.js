/// This file will have the class for TravelLines

//Constants
const SVGNS = "http://www.w3.org/2000/svg";
const PIXEL_TO_MILES = 8/192*2; //This is 8mi for 196px on a 4096px, I'm using size 2048 so multiple by 2

//exports
export {TravelLine};
export {travelLines};

//varaibles
let totalLines = 0;
let travelLines = [];


class TravelLine {

    constructor(loc1, loc2) {
        this.loc1 = loc1;
        this.loc2 = loc2;
        this.distance = this.calcDistance();
        this.r = "5px";

        this.index = totalLines;
        totalLines++;
        this.addToTable();
        this.makeElements(this.index);
    }

    static removeTravelLine(index) {
        let row = document.getElementById('tableLine' + index);
        row.parentNode.removeChild(row);
        document.getElementById('line'+index).remove();
        // Index that needs to be removed
        let pos = travelLines.map(e => e.index).indexOf(index); 
        travelLines.splice(pos, 1);
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
        row.id = 'tableLine' + this.index;
        let cells = [row.insertCell(0),row.insertCell(1),row.insertCell(2),row.insertCell(3)];
        cells[0].innerHTML = this.loc1.name;
        cells[1].innerHTML = this.loc2.name;
        cells[2].innerHTML = this.distance;
        cells[3].innerHTML = '<button>X</button>';
        let that = this;
        cells[3].addEventListener('click', function() {TravelLine.removeTravelLine(that.index)});
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
        allTravelLinesGroup.appendChild(g);
    }
}