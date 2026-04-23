$(document).ready(function () {

let sortedClasses = [];

const myHeaders = new Headers();
myHeaders.append("Accept", "application/json");


const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

//Primer fetch a la API para conseguir la lista de clases
fetch("https://www.dnd5eapi.co/api/2014/classes", requestOptions)
    .then((response) => response.text())
    .then(function(result) {
        console.log(result);
        let classesList = result.results;
    })
    .catch((error) => console.error(error));
})

function renderClassList() {
    $('classesCont').empty();
    sortedClasses.forEach(function (classDetails) {

    
    });


    let classesHTML = `
                        <div class="classes col-2">
                        <div class="card">
                            <img src="/ASSETS/IMG/BarbarianIMG.png" class="card-img-top" alt="BarbarianIMG">
                            <div class="card-img-overlay">
                                <h5 class="card-title">${name}</h5>
                                <p class="card-text"><span class="class-hitDie">${hitDie}</span></p>
                                <p class="card-text"><span class="class-Proficiency-1">${saveProficiency1}</span> & <span></span class="class-Proficiency-1">${saveProficiency2}></p>
                                <a href="#" class="btn selectClassBtn">Select class</a>
                            </div>
                        </div>
                    </div>
    `;
    $("classesCont").append(classesHTML);
}