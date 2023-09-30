import os

print("Type the directory where all GCOS data is in.")
# gcosDataDir = input()
gcosDataDir = "gcos-data"
stationdata = []
stationsFound = 0

"""
Station Array Structure:
0: Station name
1: Latitude
2: Longitude
3: Temp avg
4: Jan temp avg
5: Feb temp avg
...
15: Dec temp avg
16: precipitation total (mm)
17: avg jan prec
18: avg feb prec
...
28: avg dec prec
"""


for (dir_path, dir_names, file_names) in os.walk(gcosDataDir):
    for filename in file_names:
        if (filename.split(".")[1] == "TXT"):
            station = ["null"] * 29
            finishedLine = ""
            parsedInputs = 0
            fullpath = os.path.join(dir_path, filename)
            
            file = open(fullpath, 'r')
            alllines = file.readlines()
            file.close()

            for i, whyDoesThisVarExist in enumerate(alllines):
                stripline = alllines[i].strip()
                headersplit = stripline.split(": ")
                if (len(headersplit) == 2):
                    match (headersplit[0]):
                        case "Station Name":
                            station[0] = headersplit[1]
                        case "Latitude":
                            splitlat = headersplit[1].split()
                            latArray = [1] * 3
                            for j in splitlat:
                                if (j.endswith('d')):
                                    num = float(j.split('d')[0])
                                    latArray[1] = num
                                elif (j.endswith('m')):
                                    num = float(j.split('m')[0])
                                    latArray[2] = num / 60
                                elif (j == "S"):
                                    latArray[0] = -1
                            latitude = latArray[0] * (latArray[1] + latArray[2])
                            latitude = str(latitude)
                            station[1] = latitude
                        case "Longitude":
                            splitlon = headersplit[1].split()
                            lonArray = [1] * 3
                            for j in splitlon:
                                if (j.endswith('d')):
                                    num = float(j.split('d')[0])
                                    lonArray[1] = num
                                elif (j.endswith('m')):
                                    num = float(j.split('m')[0])
                                    lonArray[2] = num / 60
                                elif (j == "W"):
                                    lonArray[0] = -1
                            longitude = lonArray[0] * (lonArray[1] + lonArray[2])
                            longitude = str(longitude)
                            station[2] = longitude
                        case "Element 01":
                            tablelines = []
                            tablelinecount = 0
                            for j, whyDoesThisVarExist in enumerate(alllines):
                                if (j > i and tablelinecount < 3):
                                    striptableline = alllines[j].strip()
                                    if (striptableline.startswith("---")):
                                        tablelinecount += 1
                                    else:
                                        splitvalues = striptableline.split()
                                        if (len(splitvalues) >= 2):
                                            match (splitvalues[0]):
                                                case "Annual":
                                                    if (splitvalues[1] != "NA"):
                                                        station[3] = splitvalues[1]
                                                case "Ann-NCDC":
                                                    if (splitvalues[1] != "NA"):
                                                        station[3] = splitvalues[1]
                                                case "Jan":
                                                    station[4] = splitvalues[1]
                                                case "Feb":
                                                    station[5] = splitvalues[1]
                                                case "Mar":
                                                    station[6] = splitvalues[1]
                                                case "Apr":
                                                    station[7] = splitvalues[1]
                                                case "May":
                                                    station[8] = splitvalues[1]
                                                case "Jun":
                                                    station[9] = splitvalues[1]
                                                case "Jul":
                                                    station[10] = splitvalues[1]
                                                case "Aug":
                                                    station[11] = splitvalues[1]
                                                case "Sep":
                                                    station[12] = splitvalues[1]
                                                case "Oct":
                                                    station[13] = splitvalues[1]
                                                case "Nov":
                                                    station[14] = splitvalues[1]
                                                case "Dec":
                                                    station[15] = splitvalues[1]
                                elif (tablelinecount >= 3):
                                    break
                        case "Element 06":
                            tablelines = []
                            tablelinecount = 0
                            precipIndex = 1
                            for j, jValue in enumerate(alllines):
                                if (j > i and tablelinecount < 3):
                                    striptableline = alllines[j].strip()
                                    if (striptableline.startswith("---")):
                                        tablelinecount += 1
                                    else:
                                        splitvalues = striptableline.split()
                                        if (len(splitvalues) >= 2):
                                            match (splitvalues[0]):
                                                case "Statistic:":
                                                    for k, kValue in enumerate(splitvalues):
                                                        if (kValue == "MEANMLY"):
                                                            precipIndex = k                                         
                                                case "Annual":
                                                    if (splitvalues[1] != "NA"):
                                                        station[16] = splitvalues[precipIndex]
                                                case "Ann-NCDC":
                                                    if (splitvalues[1] != "NA"):
                                                        station[16] = splitvalues[precipIndex]
                                                case "Jan":
                                                    station[17] = splitvalues[precipIndex]
                                                case "Feb":
                                                    station[18] = splitvalues[precipIndex]
                                                case "Mar":
                                                    station[19] = splitvalues[precipIndex]
                                                case "Apr":
                                                    station[20] = splitvalues[precipIndex]
                                                case "May":
                                                    station[21] = splitvalues[precipIndex]
                                                case "Jun":
                                                    station[22] = splitvalues[precipIndex]
                                                case "Jul":
                                                    station[23] = splitvalues[precipIndex]
                                                case "Aug":
                                                    station[24] = splitvalues[precipIndex]
                                                case "Sep":
                                                    station[25] = splitvalues[precipIndex]
                                                case "Oct":
                                                    station[26] = splitvalues[precipIndex]
                                                case "Nov":
                                                    station[27] = splitvalues[precipIndex]
                                                case "Dec":
                                                    station[28] = splitvalues[precipIndex]
                                elif (tablelinecount >= 3):
                                    break
            stationdata.append(station)
writefile = open("extracted-data.csv", "w")
for station in stationdata:
    canWrite = True
    for index, value in enumerate(station):
        if (value == "null" or value == "NA"):
            canWrite = False
            break
        elif (value == "Trace"):
            station[index] = "0"
    if (canWrite):
        stationsFound += 1
        for index, data in enumerate(station):
            station[index] = data.strip()
            writefile.write(station[index])
            if (index != len(station) - 1):
                writefile.write(",")
        writefile.write("\n")
writefile.close()                     
                            

print(f"Found {stationsFound} stations!")
                