/// This file will have the class for Quests

//Constants

//exports
export {Quest};
export {quests};

//varaibles
let quests = [];

class Quest {
    constructor(name, nickname, id, color, info, reward, completed) {
        this.name = name;
        this.nickname = nickname;
        this.id = id;
        this.color = color;
        this.info = info;
        this.reward = reward;
        this.completed = completed;
        this.parsedInformation = this.parseInformation();

        this.makeElement();
    }

    makeElement() {
        // Overall group element
        let bigSpan = document.createElement("span");
        bigSpan.id = this.id;
        let that = this;
        bigSpan.addEventListener('click', function(e) { //Populates parsed information
            console.log("Quest: " + that.id + " information being populated");
            document.getElementById("informationTextBox").innerHTML = that.parsedInformation;
        });
        if (this.completed) 
            bigSpan.style.textDecoration = "line-through"
        //Span for color box
        let boxSpan = document.createElement("span");
        boxSpan.style.color = this.color;
        boxSpan.classList.add("biome-key-color");
        boxSpan.innerHTML = "&#9632";
        
        // Text title
        let text = document.createTextNode(" - " + this.nickname);

        //Appending
        bigSpan.appendChild(boxSpan);
        bigSpan.appendChild(text);
        bigSpan.appendChild(document.createElement("br"));
        document.getElementById("questDetail").append(bigSpan);
    }

    parseInformation() {
        let header, status, info, reward;
        header = status = info = reward = "";

        header = "<h2>" + this.name + "</h2>";
        status = "<p><i>" + (this.completed ? "Completed!" : "Ongoing")+ "</i></p>";
        info = "<p>" + this.info + "</p>";
        reward = "<p> <b>Reward: </b>" + this.reward + "</p>";

        let parsedInfo = header + status + info + reward;

        return parsedInfo;
    }
}

await fetch('./json/quests.json')
  .then(res => res.json())
  .then(jsonDataArray => {
    console.log(jsonDataArray);
    jsonDataArray.forEach((q) => {
        quests.push(new Quest(q.name, q.nickname, q.id, q.color, q.info, q.reward, q.completed))
    });
    /*x
    let valueArray = jsonDataArray.map(obj => obj.value)
    locations = Location.prepareLocations(valueArray);
        console.log("Done all icons");
    //parseLocationsInformation(valueArray);
    
    Location.prepareLocationDropdown(locations, false);
        console.log("Fetch Complete"); */
  })