
window.onload = function() {
    document.getElementById("adresse").addEventListener("input", completerAdresseAuto, false);
};

addEventListener("click", function (clique){
    if (clique.target!=document.getElementById("adresse")&&clique.target!=document.getElementById("selection")) {
        select.style.display = "none";
    }
});

var map = L.map("mapid").setView([46.603354, 1.8883335], 5);

var mainLayer=L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

var OPNVKarte = L.tileLayer('https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map <a href="https://memomaps.de/">memomaps.de</a> <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var Esri_Satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var Stamen_Watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    ext: 'jpg'
});

var Stamen_TerrainLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18
});


L.control.layers({
    "Normal": mainLayer,
    "Détail" : OpenTopoMap,
    "Transport" : OPNVKarte,
    "Satellite" : Esri_Satellite,
    "Couleur chaudes" : Stamen_Watercolor
}, {
    "Labels" : Stamen_TerrainLabels
}).addTo(map);

var contexte = "";
var requestURL = "https://geo.api.gouv.fr/regions";
var code = 0;
var selectListe ="";
var polygon;
var marker;
var layers=[];
var contours;
var cityCode=0;
var select = document.getElementById("selection");
var centreMarker;

appelAPI("REGIONS",requestURL);
// appelle l'API pour récupérer les data
function appelAPI (contexte, requestURL) {
    var request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
        var obj = request.response;
        // console.log (obj);
        if (obj != null) {
            switch (contexte) {
                case 'REGIONS':
                remplirListe("regions", listeDepartements,obj);
                break;
                case 'DEPARTEMENTS':
                remplirListe("departements", listeCommunes,obj);
                break;
                case 'COMMUNES':
                remplirListe("communes", afficherCommune,obj);
                break;
                case 'INFO_COMMUNE':
                afficherPolygon(obj);
                break;
                case 'ADRESSE': 
                displaySelection(obj);
                break;
                default:
                console.log(`Le contexte est inconnu : ${contexte}.`);
            }
        }
        else {
            console.log(`Aucune réponse.`);
        }
    }
};


function completerAdresseAuto() {

    var inputValeur = document.getElementById("adresse").value;
    if (inputValeur) {
        var adresseURL = 'https://api-adresse.data.gouv.fr/search/?q='+inputValeur;
        if (cityCode){
            appelAPI("ADRESSE",adresseURL+"&citycode="+cityCode);
        } else {
            appelAPI("ADRESSE",adresseURL);
        }
    } else {
        select.style.display = "none";
    }

};


function displaySelection(response) {
    if (Object.keys(response.features).length > 0) {
        select.style.display = "block";
        if(select.firstChild) select.removeChild(select.firstChild);
        var ul = document.createElement('ul');
        select.appendChild(ul);
        response.features.forEach(function (element) {
            var li = document.createElement('li');
            var ligneAdresse = document.createElement('span');
            var infosAdresse = document.createTextNode(element.properties.postcode + ' ' + element.properties.city);
            ligneAdresse.innerHTML = element.properties.name;
            li.onclick = function () { selectionAdresse(element); };
            li.appendChild(ligneAdresse);
            li.appendChild(infosAdresse);
            ul.appendChild(li);
        });
    } else {
        select.style.display = "none";
    }
}


function selectionAdresse(element) {
    document.getElementById("adresse").value = element.properties.name + " " + element.properties.postcode + " " + element.properties.city;
    select.style.display = "none";
    centreMarker=element.geometry.coordinates.reverse();
    afficherMarker(centreMarker);
}


// crée et met à jour la liste déroulante des départements
function listeDepartements() {
    // récupère la valeur de l'attribut "value" dans l'option sélectionnée de la liste des régions
    selectListe = document.getElementById("regions");
    if (selectListe.options[selectListe.selectedIndex].value.length>3) {
        supprimerListe("departements");
    } else if (requestURL.length > 0) { 
        code = selectListe.options[selectListe.selectedIndex].value;
        // appelle la fonction générique qui crée et met à jour la liste déroulante des départements
        requestURL = 'https://geo.api.gouv.fr/regions/' + code + '/departements';

        appelAPI ("DEPARTEMENTS", requestURL);
    }
}

// crée et met à jour la liste déroulante des communes
function listeCommunes() {
    // récupère la valeur de l'attribut "value" dans l'option sélectionnée de la liste des départements
    selectListe = document.getElementById("departements");
    if (selectListe.options[selectListe.selectedIndex].value.length>3) {
        supprimerListe("communes");
        
    } else if (requestURL.length > 0) {
        code = selectListe.options[selectListe.selectedIndex].value;
    // appelle la fonction générique qui crée et met à jour la liste déroulante des communes
    requestURL = 'https://geo.api.gouv.fr/departements/' + code + '/communes';
    appelAPI ("COMMUNES", requestURL);
}
};

function supprimerListe(listeAcreer){

    effacerLayers();
    var idListeTab = ["regions", "departements", "communes"];
    for(let i = idListeTab.indexOf(listeAcreer); i < idListeTab.length; i++) {
        if (document.getElementById(idListeTab[i])) {
            document.getElementById("formulaire").removeChild(document.getElementById(idListeTab[i]));
            document.getElementById("formulaire").removeChild(document.getElementById("para" + idListeTab[i]));
        }
    };
    cityCode=null;
}

// fonction générique qui crée et met à jour les listes déroulantes avec 3 arguments en entrée
function remplirListe(listeAcreer, fctOnChange, tabObjets) {
    //tri l'objet JSON entrant a partir du nom
    tabObjets.sort((a, b) => (strNoAccent(a.nom) > strNoAccent(b.nom)) ? 1 : -1);

    var formul = document.getElementById("formulaire");
    // supprime les listes existantes pour les recréer ensuite
    supprimerListe(listeAcreer);

    // création de la liste concernée
    var select = document.createElement("select");
    formul.appendChild(select);
    select.id = listeAcreer;
    select.onchange = fctOnChange;
    var paraVide = document.createElement("p");
    paraVide.id = "para" + listeAcreer;
    formul.appendChild(paraVide);
    var option = document.createElement("option");
    option.textContent = "--Toutes les "+listeAcreer+" de France--";
    // option.disabled = true;
    select.appendChild(option);
    // création des éléments options de la liste
    for ( let objet of tabObjets ) {
        option = document.createElement("option");
        option.textContent = objet.nom;
        option.value = objet.code;
        select.appendChild(option);
    };
};

function afficherCommune() {
    var commune = document.getElementById("communes");
    code = commune.options[commune.selectedIndex].value;
    cityCode = commune.options[commune.selectedIndex].value;
    requestURL = 'https://geo.api.gouv.fr/communes/' + code + '?fields=code,nom,surface,population,centre,codesPostaux,contour';
    if (requestURL.length > 0) {
        appelAPI ("INFO_COMMUNE", requestURL);
    }
};



function afficherPolygon(objet) {

    effacerLayers();
    if (objet.contour.type=="MultiPolygon") {
        for (let i = 0; i < objet.contour.coordinates.length ; i++) {
            contours=objet.contour.coordinates[i][0];
            for ( let contour of contours) {
                contour.reverse();
            }
            polygon=L.polygon(contours,{ color : 'red' }).addTo(map);
            map.fitBounds(polygon.getBounds());
            layers.push(polygon);
        }
    } else if (objet.contour.type=="Polygon") {
        contours=objet.contour.coordinates[0]
        for ( let contour of contours) {
            contour.reverse();
        }
        polygon = L.polygon(contours, {color: 'green'} ).addTo(map);
        map.fitBounds(polygon.getBounds());
        layers.push(polygon);
    }  
};

function effacerLayers(){
    if (layers.length>0){
        for (let layer of layers) {
            map.removeLayer(layer);
        }
        layers=[];
    }
}

function afficherMarker(centreMarker) {
    effacerLayers();
    marker = L.marker(centreMarker).addTo(map);
    map.setView(centreMarker,18);
    layers.push(marker);
}


function strNoAccent(chaineEntree) {
  let i=0,
  b="áàâäãåçéèêëíïîìñóòôöõúùûüýÁÀÂÄÃÅÇÉÈÊËÍÏÎÌÑÓÒÔÖÕÚÙÛÜÝ",
  c="aaaaaaceeeeiiiinooooouuuuyAAAAAACEEEEIIIINOOOOOUUUUY",
  chaineSortie="";
  for(i = 0; i < chaineEntree.length; i++) {
    let e = chaineEntree.charAt(i);
    chaineSortie += (b.indexOf(e) !== -1) ? c.charAt(b.indexOf(e)) : e;
}
return chaineSortie;}

