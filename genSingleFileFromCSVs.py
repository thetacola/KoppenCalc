import os
import csv

csvDataDir = "gcos-data/noaa-csvs/access"
stationData = []

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


for (dir_path, dir_names, file_names) in os.walk(csvDataDir):
    for filename in file_names:
            station = [None] * 29
            with open(dir_path + "/" + filename) as csvfile:
                reader = csv.DictReader(csvfile)
                tempAdd = 0
                precipAdd = 0
                for row in reader:
                    try:
                        station[0] = row['NAME'].strip("'").strip()
                        station[0] = station[0].replace(',', '-')
                        station[1] = row['LATITUDE'].strip("'").strip()
                        station[2] = row['LONGITUDE'].strip("'").strip()
                        station[4 + tempAdd] = (float(row['MLY-TAVG-NORMAL'].strip("'").strip()) - 32)  * (5/9)
                        station[17 + precipAdd] = (float(row['MLY-PRCP-NORMAL'].strip("'").strip()) * 2.54)
                    except:
                        continue
                    tempAdd += 1
                    precipAdd += 1
            allTemps = 0
            for i in range(12):
                if (station[4 + i] != None):
                    allTemps += float(station[4 + i])
            allPrecips = 0
            for i in range(12):
                if (station[17 + i] != None):
                    allPrecips += float(station[17 + i])
            station[3] = allTemps / 12
            station[16] = allPrecips
            stationData.append(station)

writefile = open("extracted-data.csv", "a")
for station in stationData:
    canWrite = True
    for index, value in enumerate(station):
        if (value == "null" or value == "NA" or value == None):
            canWrite = False
            break
        elif (value == "Trace"):
            station[index] = "0"
    if (canWrite):
        stationsFound += 1
        for index, data in enumerate(station):
            writefile.write(str(station[index]))
            if (index != len(station) - 1):
                writefile.write(",")
        writefile.write("\n")
writefile.close()      

