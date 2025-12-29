console.log("Profile.js started");
// This file will have class for profiles

//Constants
const PROFILE_FILES = [
    'admin.json',
    'macarthurcaravan.json',
    'northernExpedition.json',
    'empty.json',
]

import {locations} from './Locations.js';
import {quests} from './Quests.js';

//Exports
export {Profile};
export {profiles};

//variables
let profiles = [];

class Profile {
    constructor(name, id, locationsFound, quests, viewBox) {
        this.display_name = name;
        this.id = id;
        this.locationsFound = locationsFound;
        this.quests = quests;
        this.viewBox = viewBox;

        this.makeElement();
    }

    static makeGenericProfile(name, id) {
        return new Profile(
            name,
            id,
            (id == 'admin') ? locations.map((l) => l.id): [],
            (id == 'admin') ? quests.map((q) => q.id): [],
            {
                "x": 35,
                "y": -75,
                "w": 6550,
                "h": 6550
            }
        )
    }

    getLocationsFound() {
        return this.locationsFound;
    }

    getQuests() {
        return this.quests;
    }

    getViewBox() {
        return this.viewBox;
    }

    getID() {
        return this.id;
    }

    makeElement() {
        let optionElement = document.createElement("option");
        optionElement.value = this.id;
        optionElement.innerHTML = this.display_name;

        document.getElementById('profileSelect').appendChild(optionElement);
    }

    prepareLocationsFound() {
        if (this.id == 'admin') { //admin profile
            return ['test']
        }
        else { //empty profile
            return []
        }
    }
}

await fetch('./json/profiles.json')
  .then(res => res.json())
  .then(jsonDataArray => {
    jsonDataArray.forEach((d) => {
        profiles.push(new Profile(d.display_name, d.id, d.locations_found, d.quests, d.viewbox));
    });
    profiles.push(Profile.makeGenericProfile('Admin', 'admin'));
    profiles.push(Profile.makeGenericProfile('Empty', 'empty'));

    console.log("Profiles.js loaded");
})

