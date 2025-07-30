map = new OpenLayers.Map("demoMap");
map.addLayer(new OpenLayers.Layer.OSM());
var markers = new OpenLayers.Layer.Markers("Station Locations");
map.addLayer(markers);
var filedata = "";
var allTextLines;
var request = new XMLHttpRequest();

var centerMarkerLayer = new OpenLayers.Layer.Markers("Center Marker");
map.addLayer(centerMarkerLayer);

request.open('GET', 'https://koppencalc.oijon.net/extracted-data.csv')
request.send(null)
request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
        var type = request.getResponseHeader('Content-Type');
        if (type.indexOf("text") !== 1) {
            var filedata = request.responseText;
            allTextLines = filedata.split(/\r?\n|\r|\n/g);
            
        }
    }
}

map.zoomToMaxExtent();


map.events.register("move", map, function() {
	updateLonLat();
	calcKoppen();
});

function moveCenterMarker(lng, lat) {
	map.removeLayer(map.getLayersByName("Center Marker")[0]);
	var centerMarkerLayer = new OpenLayers.Layer.Markers("Center Marker");
	map.addLayer(centerMarkerLayer);
	var lonLat = new OpenLayers.LonLat(lng, lat).transform(
	new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
	map.getProjectionObject());
	var marker = new OpenLayers.Marker(lonLat);
	var size = new OpenLayers.Size(10,10);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	var icon = new OpenLayers.Icon('img/crosshair.png', size, offset);

	centerMarkerLayer.addMarker(new OpenLayers.Marker(lonLat, icon));
	
	
}

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
	
	var distKM = distance * 111.1;
	
	if (parseFloat(distKM) < 500) {
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
			var percentSpringSummerPrecip = parseFloat(parseFloat(springSummerPrecip) / parseFloat(totalPrecip)) * 100;
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
				if ((parseFloat(totalPrecip)) <= (littlePrecipThreshold / 2)) {
					// BW
					console.log("Very dry. Is BW. (" + totalPrecip + " / 2 <= " + littlePrecipThreshold + ")");
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
			
			// used for w/s/f distinction
			var wettestSummer = -1;
			var driestSummer = 9999;
			var wettestWinter = -1;
			var driestWinter = 9999;
			
			winterAvgPrec = [];
			summerAvgPrec = [];
			
			if (parseFloat(document.getElementById('lat').value) < 0) {
				console.log("South of equator");
				summerAvgPrec.push(mmOfPrecipitation[9], mmOfPrecipitation[10], mmOfPrecipitation[11], mmOfPrecipitation[0], mmOfPrecipitation[1], mmOfPrecipitation[2]);
				winterAvgPrec.push(mmOfPrecipitation[3], mmOfPrecipitation[4], mmOfPrecipitation[5], mmOfPrecipitation[6], mmOfPrecipitation[7], mmOfPrecipitation[8]);
			} else {
				console.log("North of equator");
				winterAvgPrec.push(mmOfPrecipitation[9], mmOfPrecipitation[10], mmOfPrecipitation[11], mmOfPrecipitation[0], mmOfPrecipitation[1], mmOfPrecipitation[2]);
				summerAvgPrec.push(mmOfPrecipitation[3], mmOfPrecipitation[4], mmOfPrecipitation[5], mmOfPrecipitation[6], mmOfPrecipitation[7], mmOfPrecipitation[8]);
			}
			
			for (let i = 0; i < summerAvgPrec.length; i++) {
				if (summerAvgPrec[i] > wettestSummer) {
					wettestSummer = summerAvgPrec[i];
				}
				if (winterAvgPrec[i] > wettestWinter) {
					wettestWinter = winterAvgPrec[i];
				}
				if (summerAvgPrec[i] < driestSummer) {
					driestSummer = summerAvgPrec[i];
				}
				if (winterAvgPrec[i] < driestWinter) {
					driestWinter = winterAvgPrec[i];
				}
				
			}
			
			if (coldestMonth >= -3) {
				console.log("Temps barely (if at all) averages below freezing. Köppen climate is in group C...");
				if (hottestMonth > 22 & monthsAbove10 >= 4) {
					console.log("Hottest month averages above 22C. Ending letter must be a. (" + hottestMonth + "C)");
					if (parseFloat(wettestSummer / 10) > driestWinter & driestMonth < 40) {
						console.log("Wettest summer month (" + wettestSummer + ") is over 10x as wet as the driest winter month (" + driestWinter + "). Cwa.");
						koppenCode = "Cwa";
					} else if (parseFloat(wettestWinter / 3) > driestSummer & driestMonth < 40) {
						console.log("Wettest winter month (" + wettestWinter + ") is over 3x as wet as the driest summer month (" + driestSummer + "). Csa.");
						koppenCode = "Csa";
					} else {
						console.log("No significant precipitation change by season. Cfa.");
						koppenCode = "Cfa";
					}
				} else {
					console.log("Hottest month averages below 22C. Ending letter must be b or c. (" + hottestMonth + "C)");
					if (monthsAbove10 >= 4) {
						console.log("4 or more months averaging above 10c. (" + monthsAbove10 + ") Ending letter must be b.");
						if (parseFloat(wettestSummer / 10) > driestWinter & driestMonth < 40) {
							console.log("Wettest summer month (" + wettestSummer + ") is over 10x as wet as the driest winter month (" + driestWinter + "). Cwb.");
							koppenCode = "Cwb";
						} else if (parseFloat(wettestWinter / 3) > driestSummer & driestMonth < 40) {
							console.log("Wettest winter month (" + wettestWinter + ") is over 3x as wet as the driest summer month (" + driestSummer + "). Csb.");
							koppenCode = "Csb";
						} else {
							console.log("No significant precipitation change by season. Cfb.");
							koppenCode = "Cfb";
						}
					} else {
						console.log("3 or less months averaging above 10c. (" + monthsAbove10 + ") Ending letter must be c.");
						if (parseFloat(wettestSummer / 10) > driestWinter & driestMonth < 40) {
							console.log("Wettest summer month (" + wettestSummer + ") is over 10x as wet as the driest winter month (" + driestWinter + "). Cwc.");
							koppenCode = "Cwc";
						} else if (parseFloat(wettestWinter / 3) > driestSummer & driestMonth < 40) {
							console.log("Wettest winter month (" + wettestWinter + ") is over 3x as wet as the driest summer month (" + driestSummer + "). Csc.");
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
					if (parseFloat(wettestSummer / 10) > driestWinter & driestMonth < 40) {
							console.log("Wettest summer month (" + wettestSummer + ") is over 10x as wet as the driest winter month (" + driestWinter + "). Dwa.");
							koppenCode = "Dwa";
						} else if (parseFloat(wettestWinter / 3) > driestSummer & driestMonth < 40) {
							console.log("Wettest winter month (" + wettestWinter + ") is over 3x as wet as the driest summer month (" + driestSummer + "). Dsa.");
							koppenCode = "Dsa";
						} else {
							console.log("No significant precipitation change by season. Dfa.");
							koppenCode = "Dfa";
						}
				} else {
					console.log("Hottest month averages below 22C. Ending letter must be b, c, or d. (" + hottestMonth + "C)");
					if (monthsAbove10 >= 4) {
						console.log("4 or more months (" + monthsAbove10 + ") above 10C. Ending letter must be b.");
						if (parseFloat(wettestSummer / 10) > driestWinter & driestMonth < 40) {
							console.log("Wettest summer month (" + wettestSummer + ") is over 10x as wet as the driest winter month (" + driestWinter + "). Dwb.");
							koppenCode = "Dwb";
						} else if (parseFloat(wettestWinter / 3) > driestSummer & driestMonth < 40) {
							console.log("Wettest winter month (" + wettestWinter + ") is over 3x as wet as the driest summer month (" + driestSummer + "). Dsb.");
							koppenCode = "Dsb";
						} else {
							console.log("No significant precipitation change by season. Dfb.");
							koppenCode = "Dfb";
						}
					} else if (coldestMonth < -38) {
						console.log("Coldest month gets below -38C. Ending letter must be d.");
						if (parseFloat(wettestSummer / 10) > driestWinter & driestMonth < 40) {
							console.log("Wettest summer month (" + wettestSummer + ") is over 10x as wet as the driest winter month (" + driestWinter + "). Dwd.");
							koppenCode = "Dwd";
						} else if (parseFloat(wettestWinter / 3) > driestSummer & driestMonth < 40) {
							console.log("Wettest winter month (" + wettestWinter + ") is over 3x as wet as the driest summer month (" + driestSummer + "). Dsd.");
							koppenCode = "Dsd";
						} else {
							console.log("No significant precipitation change by season. Dfd.");
							koppenCode = "Dfd";
						}
					} else {
						console.log("1-3 months (" + monthsAbove10 + ") above 10C, with all above -38C. Ending letter must be c.");
						if (parseFloat(wettestSummer / 10) > driestWinter & driestMonth < 40) {
							console.log("Wettest summer month (" + wettestSummer + ") is over 10x as wet as the driest winter month (" + driestWinter + "). Dwc.");
							koppenCode = "Dwc";
						} else if (parseFloat(wettestWinter / 3) > driestSummer & driestMonth < 40) {
							console.log("Wettest winter month (" + wettestWinter + ") is over 3x as wet as the driest summer month (" + driestSummer + "). Dsc.");
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
	} else {
		koppenCode = "Too far from a station to reliably tell.";
	}
	
	climateColor(koppenCode);
	document.getElementById('stationLocation').innerHTML = ("Closest station is " + allTextLines[closestStation].split(',')[0] + " at a distance of " + distKM + "km (Coords: " + allTextLines[closestStation].split(',')[2] + ", " + allTextLines[closestStation].split(',')[1] + ")");
	document.getElementById('code').innerHTML = (koppenCode);
	
}

function climateColor(koppenCode) {
	switch(koppenCode) {
		case "Af":
			document.getElementById('colorbox').style.backgroundColor="rgba(0, 0, 254, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Am":
			document.getElementById('colorbox').style.backgroundColor="rgba(0, 119, 255, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Aw":
			document.getElementById('colorbox').style.backgroundColor="rgba(70, 169, 250, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "As":
			document.getElementById('colorbox').style.backgroundColor="rgba(70, 169, 250, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "BWh":
			document.getElementById('colorbox').style.backgroundColor="rgba(254, 0, 0, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "BWk":
			document.getElementById('colorbox').style.backgroundColor="rgba(254, 150, 149, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "BSh":
			document.getElementById('colorbox').style.backgroundColor="rgba(245, 163, 1, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "BSk":
			document.getElementById('colorbox').style.backgroundColor="rgba(255, 219, 99, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Csa":
			document.getElementById('colorbox').style.backgroundColor="rgba(255, 255, 0, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Csb":
			document.getElementById('colorbox').style.backgroundColor="rgba(198, 199, 0, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Csc":
			document.getElementById('colorbox').style.backgroundColor="rgba(150, 150, 0, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Cwa":
			document.getElementById('colorbox').style.backgroundColor="rgba(150, 255, 150, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Cwb":
			document.getElementById('colorbox').style.backgroundColor="rgba(99, 199, 100, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Cwc":
			document.getElementById('colorbox').style.backgroundColor="rgba(50, 150, 51, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Cfa":
			document.getElementById('colorbox').style.backgroundColor="rgba(198, 255, 78, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Cfb":
			document.getElementById('colorbox').style.backgroundColor="rgba(102, 255, 51, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Cfc":
			document.getElementById('colorbox').style.backgroundColor="rgba(51, 199, 1, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dsa":
			document.getElementById('colorbox').style.backgroundColor="rgba(255, 0, 254, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dsb":
			document.getElementById('colorbox').style.backgroundColor="rgba(198, 0, 199, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dsc":
			document.getElementById('colorbox').style.backgroundColor="rgba(150, 50, 149, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dsd":
			document.getElementById('colorbox').style.backgroundColor="rgba(150, 100, 149, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dwa":
			document.getElementById('colorbox').style.backgroundColor="rgba(171, 177, 255, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dwb":
			document.getElementById('colorbox').style.backgroundColor="rgba(90, 119, 219, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dwc":
			document.getElementById('colorbox').style.backgroundColor="rgba(76, 81, 181, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dwd":
			document.getElementById('colorbox').style.backgroundColor="rgba(50, 0, 135, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dfa":
			document.getElementById('colorbox').style.backgroundColor="rgba(0, 255, 255, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dfb":
			document.getElementById('colorbox').style.backgroundColor="rgba(56, 199, 255, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dfc":
			document.getElementById('colorbox').style.backgroundColor="rgba(0, 126, 125, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "Dfd":
			document.getElementById('colorbox').style.backgroundColor="rgba(0, 69, 94, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "ET":
			document.getElementById('colorbox').style.backgroundColor="rgba(178, 178, 178, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		case "EF":
			document.getElementById('colorbox').style.backgroundColor="rgba(104, 104, 104, 0.4)";
			document.getElementById('colorbox').style.color="white";
			break;
		default:
			document.getElementById('colorbox').style.backgroundColor="#rgba(204, 204, 204, 0.4)";
			document.getElementById('colorbox').style.color="white";
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
		moveCenterMarker(splitLon[1], splitLat[1]);
}
