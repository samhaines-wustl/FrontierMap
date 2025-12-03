
// This file will have class for profiles

//Constants
const PROFILE_FILES = [
    'admin.json',
    'macarthurcaravan.json',
    'northernExpedition.json',
    'empty.json',
]

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
}

PROFILE_FILES.forEach(async (f) => {
    await fetch('./json/profiles/' + f)
    .then(res => res.json())
    .then(d => {
        profiles.push(new Profile(d.display_name, d.id, d.locations_found, d.quests, d.viewbox));
    })
});
console.log("Profiles Fetch Complete");
