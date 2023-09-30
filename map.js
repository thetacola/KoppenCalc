map = new OpenLayers.Map("demoMap");
map.addLayer(new OpenLayers.Layer.OSM());
var markers = new OpenLayers.Layer.Markers("Station Locations");
map.addLayer(markers);
var filedata = "";
var allTextLines;
var request = new XMLHttpRequest();
request.open('GET', 'http://koppencalc.oijon.net/extracted-data.csv')
request.send(null)
request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
        var type = request.getResponseHeader('Content-Type');
        if (type.indexOf("text") !== 1) {
            var filedata = request.responseText;
            allTextLines = filedata.split(/\r?\n|\r|\n/g);
            for (let i = 0; i < allTextLines.length; i++) {
                var entries = allTextLines[i].split(',');
                var lonLat = new OpenLayers.LonLat(entries[2], entries[1]).transform(
                new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
                map.getProjectionObject());
                markers.addMarker(new OpenLayers.Marker(lonLat));
            }
        }
    }
}

map.zoomToMaxExtent();


map.events.register("move", map, function() {
	updateLonLat();
});

function calcKoppen() {
		
	// find closest station
	
	let x1 = document.getElementById('long').value;
	let y1 = document.getElementById('lat').value;
	var distance = 9999999999;
	var closestStation = -1;
	for (let i = 0; i < allTextLines.length; i++) {
		var entries = allTextLines[i].split(',');
		let x2 = entries[2];
		let y2 = entries[1];
		let newdistance = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
		if (newdistance < distance) {
			distance = newdistance;
			closestStation = i;
		}
	}
	
	// calculate köppen from climate of nearest station
	// TODO: average out the 3 closest stations to get a more accurate climate
	
	var climatedata = allTextLines[closestStation];
	var splitData = climatedata.split(",");
	
	var koppenCode = "";
	
	var temps = [];
	var mmOfPrecipitation = [];
	
	var avgtemp = splitData[3];
	var totalPrecip = splitData[16];
	
	temps.push(splitData[4], splitData[5], splitData[6], splitData[7], splitData[8], splitData[9], splitData[10], splitData[11], splitData[12], 
			   splitData[13], splitData[14], splitData[15]);
	mmOfPrecipitation.push(splitData[17], splitData[18], splitData[19], splitData[20], splitData[21], splitData[22], splitData[23], splitData[24], splitData[25], 
			   splitData[26], splitData[27], splitData[28]);
	
	console.log("-----");
	
	// Group A: Tropical Climates
	
	var hot = true;
	var canBeTropical = true;
	for (let i = 0; i < temps.length; i++) {
		if (parseFloat(temps[i]) < 18) {
			hot = false;
			canBeTropical = false;
		}
	}
	
	var canBeAf = true;
	var tropicalPrecipitationMin = parseFloat(100 - (totalPrecip / 25));
	if (hot) {
		console.log("Hot enough to be tropical.");
		for (let i = 0; i < mmOfPrecipitation.length; i++) {
			if (parseFloat(mmOfPrecipitation[i]) < 60) {
				canBeAf = false;
				console.log("Too dry for Af, not neccessarially for A.");
				break;
			}
			if (parseFloat(mmOfPrecipitation[i]) < tropicalPrecipitationMin) {
				canBeTropical = false;
				console.log("Cannot be tropical, too dry.");
				break;
			}
		}
	} else {
		console.log("Cannot be tropical, too cold.");
	}
	
	// Definetely tropical at this point, check if Af, Am, As, or Aw
	if (canBeTropical) {
		console.log("Wet enough to be tropical. Köppen climate is in group A...");
		var driestMonth = -1;
		var driestPrecipAmount = 999999;
		for (let i = 0; i < mmOfPrecipitation.length; i++) {
			if (parseFloat(mmOfPrecipitation[i]) < driestPrecipAmount) {
				driestMonth = i;
				driestPrecipAmount = parseFloat(mmOfPrecipitation[i]);
			}
		}
		
		if (canBeAf) {
			koppenCode = "Af";
			console.log("If it can be Af, it must be Af.");
		} else if (parseFloat(document.getElementById('lat').value) < 0) {   // determines if north or south of the equator
			// south of equator
			console.log("South of equator.");
			if (driestMonth == 5) {
				// not the best way to determine monsoon climates, but the dries month is right after the winter solstice...
				console.log("Driest month is one with winter solstice. (" + driestMonth + ") Is Am.");
				koppenCode = "Am";
			}
			else if (4 < driestMonth & driestMonth <= 9) {
				// including a bit of spring and fall here just in case
				console.log("Driest month is one in winter. (" + (driestMonth + 1) + ") Is Aw.");
				koppenCode = "Aw";
			} else {
				console.log("Driest month is one in summer. (" + (driestMonth + 1) + ") Is As.");
				koppenCode = "As";
			}
		} else {
			// north of equator
			console.log("North of equator.");
			if (driestMonth == 11) {
				// not the best way to determine monsoon climates, but the dries month is right after the winter solstice...
				console.log("Driest month is one with winter solstice. (" + (driestMonth + 1) + ") Is Am.");
				koppenCode = "Am";
			}
			else if (4 < driestMonth & driestMonth <= 9) {
				// including a bit of spring and fall here just in case
				console.log("Driest month is one in summer. (" + (driestMonth + 1) + ") Is As.");
				koppenCode = "As";
			} else {
				console.log("Driest month is one in winter. (" + (driestMonth + 1) + ") Is Aw.");
				koppenCode = "Aw";
			}
		}
	}
	
	// Group B: arid climates
	
	littlePrecipThreshold = parseFloat(avgtemp) * 20; // defined here, also used for group E
	// equator specific threshold
	if (parseFloat(document.getElementById('lat').value) < 0) {
		springSummerPrecip = parseFloat(mmOfPrecipitation[9] + mmOfPrecipitation[10] + mmOfPrecipitation[11] + mmOfPrecipitation[0] + mmOfPrecipitation[1] + mmOfPrecipitation[2]);
		var percentSpringSummerPrecip = (springSummerPrecip / totalPrecip) * 100;
		if (percentSpringSummerPrecip >= 70) {
			littlePrecipThreshold += 280;
		} else if (percentSpringSummerPrecip >= 30) {
			littlePrecipThreshold += 140;
		}
	} else {
		springSummerPrecip = parseFloat(mmOfPrecipitation[3] + mmOfPrecipitation[4] + mmOfPrecipitation[5] + mmOfPrecipitation[6] + mmOfPrecipitation[7] + mmOfPrecipitation[8]);
		var percentSpringSummerPrecip = (springSummerPrecip / totalPrecip) * 100;
		if (percentSpringSummerPrecip >= 70) {
			littlePrecipThreshold += 280;
		} else if (percentSpringSummerPrecip >= 30) {
			littlePrecipThreshold += 140;
		}
	}
	
	hotEnoughForB = false;
	for (let i = 0; i < temps.length; i++) {
		if (parseFloat(temps[i]) > 10) {
			hotEnoughForB = true;
		}
	}
	
	if (parseFloat(totalPrecip) <= parseFloat(littlePrecipThreshold)) {
		console.log("Dry enough for B.");
		if (hotEnoughForB) {
			console.log("Hot and dry. Is B.");
			// at this point its def B
			if ((parseFloat(totalPrecip) / 2) <= littlePrecipThreshold) {
				// BW
				console.log("Very dry. Is BW.");
				if (parseFloat(avgtemp) > 18) {
					console.log("Avg temp above 18 Celcius. Is BWh. (" + avgtemp + "C)");
					koppenCode = "BWh";
				} else {
					console.log("Avg temp below 18 Celcius. Is BWk. (" + avgtemp + "C)");
					koppenCode = "BWk";
				}
			} else {
				// BS
				console.log("Dry, but not very dry. Is BS.");
				if (avgtemp > 18) {
					console.log("Avg temp above 18 Celcius. Is BSh.");
					koppenCode = "BSh";
				} else {
					console.log("Avg temp below 18 Celcius. Is BSk.");
					koppenCode = "BSk";
				}
			}
		}
	}
	
	if (koppenCode == "") {	
		// Group C: Temperate climates
		// Also includes Group D: Continental climates
		
		var coldestMonth = 999;
		for (let i = 0; i < temps.length; i++) {
			if (parseFloat(temps[i]) < coldestMonth) {
				coldestMonth = parseFloat(temps[i]);
			}
		}
		
		var hottestMonth = -999;
		for (let i = 0; i < temps.length; i++) {
			if (parseFloat(temps[i]) > hottestMonth) {
				hottestMonth = temps[i];
			}
		}
		
		var driestMonth = 999;
		for (let i = 0; i < mmOfPrecipitation.length; i++) {
			if (parseFloat(mmOfPrecipitation[i]) < driestMonth) {
				driestMonth = parseFloat(mmOfPrecipitation[i]);
			}
		}
		
		var wettestMonth = -999;
		for (let i = 0; i < mmOfPrecipitation.length; i++) {
			if (parseFloat(mmOfPrecipitation[i]) > wettestMonth) {
				wettestMonth = parseFloat(mmOfPrecipitation[i]);
			}
		}
		
		var monthsAbove10 = 0;
		for (let i = 0; i < temps.length; i++) {
			if (parseFloat(temps[i]) > 10) {
				monthsAbove10 += 1;
			}
		}
		
		// using -3C as cutoff, some use 0C
		
		if (coldestMonth >= -3) {
			console.log("Temps barely (if at all) averages below freezing. Köppen climate is in group C...");
			if (hottestMonth > 22 & monthsAbove10 >= 4) {
				console.log("Hottest month averages above 22C. Ending letter must be a. (" + hottestMonth + "C)");
				if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
					console.log("Wettest month is over 10x as wet as the driest month. Cwa.");
					koppenCode = "Cwa";
				} else if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
					console.log("Wettest month is over 3x as wet as the driest month. Csa.");
					koppenCode = "Csa";
				} else {
					console.log("No significant precipitation change by season. Cfa.");
					koppenCode = "Cfa";
				}
			} else {
				console.log("Hottest month averages below 22C. Ending letter must be b or c. (" + hottestMonth + "C)");
				if (monthsAbove10 >= 4) {
					console.log("4 or more months averaging above 10c. (" + monthsAbove10 + ") Ending letter must be b.");
					if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 10x as wet as the driest month. Cwb.");
						koppenCode = "Cwb";
					} else if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 3x as wet as the driest month. Csb.");
						koppenCode = "Csb";
					} else {
						console.log("No significant precipitation change by season. Cfb.");
						koppenCode = "Cfb";
					}
				} else {
					console.log("3 or less months averaging above 10c. (" + monthsAbove10 + ") Ending letter must be c.");
					if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 10x as wet as the driest month. Cwc.");
						koppenCode = "Cwc";
					} else if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 3x as wet as the driest month. Csc.");
						koppenCode = "Csc";
					} else {
						console.log("No significant precipitation change by season. Cfc.");
						koppenCode = "Cfc";
					}
				}
			}
		} else if (hottestMonth >= 10) {
			console.log("At least one monthly temp averages below freezing, and the hottest month gets above 10C. Köppen climate is in group D...");
			if (hottestMonth >= 22) {
				console.log("Hottest month averages above 22C. Ending letter must be a. (" + hottestMonth + "C)");
				if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 10x as wet as the driest month. Dwa.");
						koppenCode = "Dwa";
					} else if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 3x as wet as the driest month. Dsa.");
						koppenCode = "Dsa";
					} else {
						console.log("No significant precipitation change by season. Dfa.");
						koppenCode = "Dfa";
					}
			} else {
				console.log("Hottest month averages below 22C. Ending letter must be b, c, or d. (" + hottestMonth + "C)");
				if (monthsAbove10 >= 4) {
					console.log("4 or more months (" + monthsAbove10 + ") above 10C. Ending letter must be b.");
					if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 10x as wet as the driest month. Dwb.");
						koppenCode = "Dwb";
					} else if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 3x as wet as the driest month. Dsb.");
						koppenCode = "Dsb";
					} else {
						console.log("No significant precipitation change by season. Dfb.");
						koppenCode = "Dfb";
					}
				} else if (coldestMonth < -38) {
					console.log("Coldest month gets below -38C. Ending letter must be d.");
					if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 10x as wet as the driest month. Dwd.");
						koppenCode = "Dwd";
					} else if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 3x as wet as the driest month. Dsd.");
						koppenCode = "Dsd";
					} else {
						console.log("No significant precipitation change by season. Dfd.");
						koppenCode = "Dfd";
					}
				} else {
					console.log("1-3 months (" + monthsAbove10 + ") above 10C, with all above -38C. Ending letter must be c.");
					if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 10x as wet as the driest month. Dwc.");
						koppenCode = "Dwc";
					} else if ((wettestMonth / 10) > driestMonth & driestMonth < 40) {
						console.log("Wettest month is over 3x as wet as the driest month. Dsc.");
						koppenCode = "Dsc";
					} else {
						console.log("No significant precipitation change by season. Dfc.");
						koppenCode = "Dfc";
					}
				}
			}
		} else {
			console.log("Hottest month is below 10C. (" + hottestMonth + "C) Köppen climate is in group E...");
			if (hottestMonth > 0) {
				console.log("Hottest month is above freezing. (" + hottestMonth + "C) Is ET.");
				koppenCode = "ET";
			} else {
				console.log("Hottest month is below freezing. (" + hottestMonth + "C) Is EF.");
				koppenCode = "EF";
			}
		}
	}
	
	if (koppenCode == "") {
		alert("It appears that something is broken with the Köppen Calculator at this location!");
	}
	
	
	
	var distKM = distance * 111.1;
	
	climateColor(koppenCode);
	document.getElementById('stationLocation').innerHTML = ("Closest station is " + allTextLines[closestStation].split(',')[0] + " at a distance of " + distKM + "km (Coords: " + allTextLines[closestStation].split(',')[2] + ", " + allTextLines[closestStation].split(',')[1] + ")");
	document.getElementById('code').innerHTML = (koppenCode);
	
}

function climateColor(koppenCode) {
	switch(koppenCode) {
		case "Af":
			document.getElementById('body').style.backgroundColor="#0000FE";
			document.getElementById('body').style.color="white";
			break;
		case "Am":
			document.getElementById('body').style.backgroundColor="#0077FF";
			document.getElementById('body').style.color="white";
			break;
		case "Aw":
			document.getElementById('body').style.backgroundColor="#46A9Fa";
			document.getElementById('body').style.color="white";
			break;
		case "As":
			document.getElementById('body').style.backgroundColor="#46A9Fa";
			document.getElementById('body').style.color="white";
			break;
		case "BWh":
			document.getElementById('body').style.backgroundColor="#FE0000";
			document.getElementById('body').style.color="white";
			break;
		case "BWk":
			document.getElementById('body').style.backgroundColor="#FE9695";
			document.getElementById('body').style.color="black";
			break;
		case "BSh":
			document.getElementById('body').style.backgroundColor="#F5A301";
			document.getElementById('body').style.color="white";
			break;
		case "BSk":
			document.getElementById('body').style.backgroundColor="#FFDB63";
			document.getElementById('body').style.color="black";
			break;
		case "Csa":
			document.getElementById('body').style.backgroundColor="#FFFF00";
			document.getElementById('body').style.color="black";
			break;
		case "Csb":
			document.getElementById('body').style.backgroundColor="#C6C700";
			document.getElementById('body').style.color="black";
			break;
		case "Csc":
			document.getElementById('body').style.backgroundColor="#969600";
			document.getElementById('body').style.color="white";
			break;
		case "Cwa":
			document.getElementById('body').style.backgroundColor="#96FF96";
			document.getElementById('body').style.color="black";
			break;
		case "Cwb":
			document.getElementById('body').style.backgroundColor="#63C764";
			document.getElementById('body').style.color="black";
			break;
		case "Cwc":
			document.getElementById('body').style.backgroundColor="#329633";
			document.getElementById('body').style.color="white";
			break;
		case "Cfa":
			document.getElementById('body').style.backgroundColor="#C6FF4E";
			document.getElementById('body').style.color="black";
			break;
		case "Cfb":
			document.getElementById('body').style.backgroundColor="#66FF33";
			document.getElementById('body').style.color="black";
			break;
		case "Cfc":
			document.getElementById('body').style.backgroundColor="#33C701";
			document.getElementById('body').style.color="white";
			break;
		case "Dsa":
			document.getElementById('body').style.backgroundColor="#FF00FE";
			document.getElementById('body').style.color="black";
			break;
		case "Dsb":
			document.getElementById('body').style.backgroundColor="#C600C7";
			document.getElementById('body').style.color="white";
			break;
		case "Dsc":
			document.getElementById('body').style.backgroundColor="#963295";
			document.getElementById('body').style.color="white";
			break;
		case "Dsd":
			document.getElementById('body').style.backgroundColor="#966495";
			document.getElementById('body').style.color="white";
			break;
		case "Dwa":
			document.getElementById('body').style.backgroundColor="#ABB1FF";
			document.getElementById('body').style.color="black";
			break;
		case "Dwb":
			document.getElementById('body').style.backgroundColor="#5A77DB";
			document.getElementById('body').style.color="white";
			break;
		case "Dwc":
			document.getElementById('body').style.backgroundColor="#4C51B5";
			document.getElementById('body').style.color="white";
			break;
		case "Dwd":
			document.getElementById('body').style.backgroundColor="#320087";
			document.getElementById('body').style.color="white";
			break;
		case "Dfa":
			document.getElementById('body').style.backgroundColor="#00FFFF";
			document.getElementById('body').style.color="black";
			break;
		case "Dfb":
			document.getElementById('body').style.backgroundColor="#38C7FF";
			document.getElementById('body').style.color="black";
			break;
		case "Dfc":
			document.getElementById('body').style.backgroundColor="#007E7D";
			document.getElementById('body').style.color="white";
			break;
		case "Dfd":
			document.getElementById('body').style.backgroundColor="#00455E";
			document.getElementById('body').style.color="white";
			break;
		case "ET":
			document.getElementById('body').style.backgroundColor="#B2B2B2";
			document.getElementById('body').style.color="white";
			break;
		case "EF":
			document.getElementById('body').style.backgroundColor="#686868";
			document.getElementById('body').style.color="white";
			break;
	}
}

function updateLonLat() {
	var center = (map.getCenter().transform(
        map.getProjectionObject(), // transform from WGS 1984
        new OpenLayers.Projection("EPSG:4326")).toString());
		var splitCoords = center.split(',');
		var splitLon = splitCoords[0].split('=');
		var splitLat = splitCoords[1].split('=');
		
		document.getElementById('long').value = splitLon[1];
		document.getElementById('lat').value = splitLat[1];
}
