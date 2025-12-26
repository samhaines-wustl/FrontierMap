
/// This file will have the class for locations
/// Also will prep the locations

//Constants
const SVGNS = "http://www.w3.org/2000/svg";

//exports
export {Location};
export {locations};

//variables
let locations;

class Location {
    constructor(name, id, type, src, x, y, json) {
        this.name = name;
        this.id = id;
        this.type = type;
        this.src = "images/icons/" + src + ".png";
        this.x = x;
        this.y = y;
        this.iconSize = 48;
        this.fontSize = 32;
        this.json = json;
        this.markdown = 'markdown/locations/' + this.id + '.md';
        
        this.makeElement();
    }

    static prepareLocations(rawLocs) {
        let processedLocs = []
        rawLocs.forEach((loc) => {
            //Setting up objects
            processedLocs.push(new Location(loc.name, loc.id, loc.type, loc.icon_src, loc.x, loc.y, loc));
        });

        return processedLocs
    };

    static prepareLocationDropdown(locs, idArray) {
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

            locs.forEach((loc) => {
                if (idArray.includes(loc.id)) {
                    let option = document.createElement("option")
                    option.value = loc.name;
                    option.innerHTML = loc.name;
                    element.appendChild(option);
                }
            })
        });
    };

    static searchLocations() {
        //Search
        let searchText = document.getElementById("searchTextInput").value.toLowerCase().trim();
        //update search bar w/ trimmed value
        document.getElementById("searchTextInput").value = document.getElementById("searchTextInput").value.trim();
        if (!searchText) // Empty/Invalid string
            return true;
        locations.forEach((loc) => {
            let el = document.getElementById(loc.id + 'Icon');
            //First clears previous result
            el.classList.remove("search-result-highlight");
            //If text matches highlight
            if (loc.name.toLowerCase().indexOf(searchText) > -1)
                el.classList.add("search-result-highlight");
        })
    };

    makeElement() {
        //group element
        let g = document.createElementNS(SVGNS, 'g');
        g.addEventListener('mouseover', (e) => { //Reappends node so that it is drawn first (nothing covers text)
            document.getElementById('allIconGroup').appendChild(e.target.parentNode);
        });
        let that = this;
        g.addEventListener('click', function(e) { //Populates parsed information
            console.log(that.name + " information being populated");
            pullMarkdownAndUpdate(that.markdown, "informationTextBox");
        });
        //image
        let el = document.createElementNS(SVGNS, 'image');
        el.setAttributeNS(null, 'x', this.x-this.iconSize/2);
        el.setAttributeNS(null, 'y', this.y-this.iconSize/2);
        el.setAttributeNS(null, 'href', this.src);
        el.setAttributeNS(null, 'onerror', "this.setAttribute('href', 'images/icons/image_not_found.png')")
        el.setAttribute('originalX', this.x);
        el.setAttribute('originalY', this.y);
        el.classList.add("icon");
        el.classList.add("icon-" + this.type);
        el.id = this.id + 'Icon';
        //text
        let txt = document.createElementNS(SVGNS, "text");
        txt.setAttributeNS(null, 'filter', "url(#rounded-corners-2)")
        txt.setAttributeNS(null, 'x', this.x);
        txt.setAttributeNS(null, 'y', this.y-this.iconSize);
        txt.classList.add("icon-text");
        txt.classList.add("text-display-hover");
        txt.id = this.id + 'Text';
        txt.textContent = this.name;
        //Apending
        g.appendChild(el);
        g.appendChild(txt);
        g.classList.add("location-marker");
        g.id = this.id + 'Group';
        document.getElementById('allIconGroup').appendChild(g);
    };

    changeIconSize(newSize) {
        this.iconSize = newSize;

        let iconElement = document.getElementById(this.id + 'Icon');
        iconElement.style.width = this.iconSize + 'px';
        iconElement.setAttributeNS(null, 'x', this.x-this.iconSize/2);
        iconElement.setAttributeNS(null, 'y', this.y-this.iconSize/2);
    };

    changeFontSize(newSize) {
        this.fontSize = newSize;

        let textElement = document.getElementById(this.id + 'Text');
        textElement.style.fontSize = this.fontSize + 'px';
    };
}

await fetch('./json/manifest.json')
  .then(res => res.json())
  .then(fileList => {
    return Promise.allSettled(
      fileList.map(file => {
        return fetch(`./json/locations/${file}`).then(res => {
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
    locations = Location.prepareLocations(valueArray);
        console.log("Done all icons");
        console.log("Locations Fetch Complete");
  })
