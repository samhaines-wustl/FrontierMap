
// This file is for shared functions across classes

function pullMarkdownAndUpdate(fileSRC, elementID) {
    var converter = new showdown.Converter();
    fetch(fileSRC) 
    .then(res => {
        if (!res.ok) {
            return "# Error no .md found"
        }
        return res.text()
    })
    .then(result => {
        document.getElementById(elementID).innerHTML = converter.makeHtml(result);
    })
    .catch(error => console.log(error.message));
}

console.log("SuperHelper load complete")