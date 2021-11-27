#This is the latest and greatest code to download NJ child care centers (03-06-18)

import requests, csv, bs4, re, PyPDF2, datetime
from bs4 import BeautifulSoup
from PyPDF2 import PdfFileReader
from datetime import date, datetime

#Defining function which retrieves director's name from inspection reports website

def directorName(websiteLink):
    gotoLink = requests.get(websiteLink)
    gotoLinkBs = BeautifulSoup(gotoLink.text,"html.parser")
    DirectorArea = gotoLinkBs.select('div [class="cclwebCenterInfo"]')


    DirectorMatch = re.compile('Director - (.*)')

    DirectorName = DirectorMatch.search(str(DirectorArea))
    returnVal = DirectorName.group()[11:-5]
    return returnVal

#---------------------------------------------
#Defining function which retrieves center's email address and license expiration date by downloading inspection
#reports (pdf) and extracting all text from page 1 of the report

def inspectionRpt(childCareData):

#Part 1 - creating email and date regex for use in part 5 so it can identify any string that looks like an email address
#and date    
    emailRegex = re.compile(r'''(
    [a-zA-Z0-9._%+-]+
    @
    [a-zA-Z0-9.-]+
    (\.[a-zA-Z]{2,3})
    )''', re.VERBOSE)

#Regex for license expiration date is complex because extracted content from pdf inspection report can vary materially from report to report.
#Expression for licenseExpRegex provides maximum flexbility while enuring we don't capture any dates other than regular and temporary
#license epxiration dates.  DateRegex then captures the latest of multiple license expiration dates (if there are multiple license expiration
#dates listed)
    licenseExpRegex = re.compile(r'License Status:(.*?)(Phone|Fax|Due|Initial|Reinspect)', re.DOTALL)
    dateRegex = re.compile(r'[0-9]+[.-/][0-9]+[.-/][0-9]+')

#For loop to go through every child care in the list that will be passed as an argument to inspectionRpt function
#in the main program
    for i in range(len(childCareData)):
        returnExpDate = []
        returnEmail = ''

#Part 2 - finding inspection reports' names, which then helps determine URLs of inspection report pdfs
        gotoLink = requests.get(str(childCareData[i][16])[2:-2])
        gotoLink.raise_for_status()
        gotoLinkBs = BeautifulSoup(gotoLink.text,"html.parser")
        inspectionRpts = gotoLinkBs.select('div [class="cclwebInspectionReports"] a')

#Some inspection reports may not have the center's email address and/or license expiration date, so a for loop through
#all the available inspection reports will allow us to get an email address and/or license expiration date from at least
#one of the inspection reprots.  As soon as we get an email address and license expiration date, we break out of the for loop

        if len(inspectionRpts)==0:
            childCareData[i][12] = childCareData[i][17] = 'Not available'
            childCareData[i][18] = childCareData[i][19] = 'No inspection report'
        else:
            for j in range(len(inspectionRpts)):

                bestRpt = list(inspectionRpts[j].attrs.values())
                pdfName = str('http://www.nj.gov/dcf/families/childcare/centers/'+str(bestRpt)[2:-2])

#Part 3 - downloading pdf file and writing content to a file in current working directory
                r = requests.get(pdfName, stream=True)

#This try and except block forces the for loop to continue to the next inspection report if there's an error reading the current one
#thus preventing the code from crashing
                try:
                    r.raise_for_status()
                except Exception:
                    continue

                with open('NJCCpdf.pdf', 'wb') as f:
                    f.write(r.content)

#Part 4 - extracting all content from page 1 of pdf file so we can search for email address and license expiration date
                pdfFileObj = open('NJCCpdf.pdf', 'rb')
                pdfReader = PdfFileReader(pdfFileObj)
                pageObj = str(pdfReader.getPage(0).extractText())

#Part 5 - applying regexes from part 1 to find an email and license expiration date match and breaking the for loop if both
#matches occur
                if returnEmail == '':
                    if emailRegex.search(pageObj)!=None:
                        returnEmail = emailRegex.search(pageObj)

#First we find a string that includes pattern identified in licenseExpRegex.  Because inspection report pdf content varies
#from report to report and daycare to daycare, once we identify a string that includes 'License status', we do a second
#search for all dates (using dateRegex) in that string to finally arrive at the most current license expiration date.
                if len(returnExpDate) == 0:
                    if licenseExpRegex.search(pageObj)!=None:
                        licenseExp = licenseExpRegex.search(pageObj)
                        returnExpDate = dateRegex.findall(licenseExp.group())

                if ((len(returnExpDate) != 0) and (returnEmail!='')):
                    break

#Part 6 - updating items 13 (email) and 18 (license expiration date) in the list argument
#so we don't have to return any values back to the main program
            if returnEmail == '':
                childCareData[i][12] = 'Not available'
            else:
                childCareData[i][12] = returnEmail.group()

            if len(returnExpDate) == 0:
                childCareData[i][17] = 'Not available'
                childCareData[i][18] = licenseExp.group() #for testing purposes only
                childCareData[i][19] = returnExpDate #for testing purposes only
            else:
                childCareData[i][17] = returnExpDate[len(returnExpDate)-1]
                childCareData[i][18] = licenseExp.group() #for testing purposes only
                childCareData[i][19] = returnExpDate #for testing purposes only

        print(i, childCareData[i][0], childCareData[i][12], childCareData[i][17]) #This is just to get a sense of how the program is progressing

#---------------------------------------------  
#Function to determine infant coverage

def infantCoverage(minAge):
    ageRegex = re.compile(r'\d')
    minimumAge = ageRegex.search(minAge)
    if int(minimumAge.group()) <2: #in NJ, infants are considered 1.5 years and younger
        infants = 'Yes'
    else:
        infants = 'No'
    return infants

#---------------------------------------------  
#Function to determine before and after school coverage
#Assumption is that if a child care serves kids greatr than 5 years old (age for going to kindergarten),
#then it probably has both before and after school services.  Most NJ daycares have either 2, 6 or 13 as their maximum age.
#Since kids can enroll in kindergarten when they are either 5 or 6, it's more than likely that only those daycares that
#have 13 as the high end of the age range provide before/after school services.

def beforeAfterSchoolCoverage(maxAge):
    ageRegex = re.compile(r'to (\d)*')
    maximumAge = ageRegex.search(maxAge)
    if int(str(maximumAge.group())[3:]) > 6:
        beforeSchool = afterSchool = 'Yes'
    else:
        beforeSchool = afterSchool = 'No'
    return (beforeSchool, afterSchool)

#---------------------------------------------  
#Function to raise a red flag if license expiration date is before or same as current date
#or if no license expiration date exists (ie, marked 'Not available').  All red flags are logged in a new file called 'Red Flags'
#and listData items 18 and 19 (recorded in function inspectionRpt) are assigned to a new list called redFlag and deleted from listData
#so they don't get printed in NJoutout.

def raiseRedFlag(childCareData):
    redFlag=[['Child Care Center Name', 'Registration/License #', 'License expiration matched string', 'Possible license expiration  dates', 'License expiration date', 'Flag']]

    for i in range(len(childCareData)):
        try:
            if childCareData[i][17] == 'Not available':#put this condition first, else function results in exception and doesn't correctly process daycares whose license expiration date is 'Not available'
               redFlag.append([childCareData[i][0], childCareData[i][10], childCareData[i][18], childCareData[i][19], childCareData[i][17], 'Yes'])
            elif datetime.strptime(childCareData[i][17],'%m/%d/%Y').date() <= date.today():
               redFlag.append([childCareData[i][0], childCareData[i][10], childCareData[i][18], childCareData[i][19], childCareData[i][17], 'Yes'])
        except Exception:
            pass

        del childCareData[i][19], childCareData[i][18] #deleting these two columns in listData so they don't get printed to the NJoutput file
        
    return redFlag

#---------------------------------------------
#Function to standardize format of license expiration dates (item 18 in listData) to MM/DD/YYYY

def formatDate(childCareData):
    for i in range(len(childCareData)):
        if (childCareData[i][17] != 'Not available'): #Without this statement, this function assigns prior daycare's license expiration date to any subsequent daycare in index whose license expiration date is not available
            try:
                currentDateFormat = datetime.strptime(childCareData[i][17], '%m/%d/%Y')
            except:
                pass

            try:
                currentDateFormat = datetime.strptime(childCareData[i][17], '%m/%d/%y')
            except:
                pass

            try:
                currentDateFormat = datetime.strptime(childCareData[i][17], '%m-%d-%Y')
            except:
                pass

            try:
                currentDateFormat = datetime.strptime(childCareData[i][17], '%m-%d-%y')
            except:
                pass

            try:
                currentDateFormat = datetime.strptime(childCareData[i][17], '%m.%d.%Y')
            except:
                pass

            try:
                currentDateFormat = datetime.strptime(childCareData[i][17], '%m.%d.%y')
            except:
                pass

            childCareData[i][17] = currentDateFormat.date().strftime('%m/%d/%Y')
        else:
            childCareData[i][17] = 'Not available'

#---------------------------------------------
#Main program

#Get data from NJ website and write it to a text file called njdata
dataCsv = requests.get('https://data.nj.gov/api/views/cru5-4rmm/rows.csv?accessType=DOWNLOAD&bom=true&format=true')
openFile = open('njdata', 'wb')
for chunk in dataCsv.iter_content(100000):
    openFile.write(chunk)

#Read njdata using a csv reader and arrange data in a list called list_data
openCsv = open('njdata')
csvReader = csv.reader(openCsv)
listData = list(csvReader)

#Define new column titles to be used in final output file
ColumnTitles=['Child Care Center Name', 'Age Groups', 'Capacity', 'Phone Number', 'County', 'Street Address 1', 'Street Address 2', 'City', 'State', 'Zip Code', 'Registration/License #', 'Director\'s name','Email','Infant coverage','Before School','After school','Inspection Reports URL', 'License expiration date']
del listData[0]

#Make adjustments to list_data to 1) reformat phone number, 2) insert new column, and 3) rearrange listData

for i in range(len(listData)):
    listData[i].insert(9,'NJ')
    listData[i][2] = '(' + str(listData[i][2])[0:3] + ') ' + str(listData[i][2])[4:]
    listData[i] = [listData[i][1], listData[i][3], listData[i][4], listData[i][2], listData[i][0], listData[i][6], listData[i][7], listData[i][5], listData[i][9], listData[i][8], '','','','','','',listData[i][10],'','','']
#extracting child care center's Registration/license number and inspection report URL from the <a href> tag in listData item 17
#need to find inspection report URL before Registration/license number since URL has the registration/license number
    websiteLink = BeautifulSoup(listData[i][16],"html.parser")
    listData[i][16] = ([x['href'] for x in websiteLink.find_all('a',href=True)])
    listData[i][10] = str(listData[i][16])[-17:-8]
#retrieving Director's name from the inspection report website link
    listData[i][11] = directorName(str(listData[i][16])[2:-2])
#determining infant coverage
    listData[i][13] = infantCoverage(str(listData[i][1]))
#determining before and after school coverage
    listData[i][14], listData[i][15] = beforeAfterSchoolCoverage(str(listData[i][1]))
    print(i,listData[i][0])#This is just to get a sense of how the program is progressing

#End of for loop
#determining email address and license expiration date for each daycare in listData.  listData gets modified in function inspectionRpt.
inspectionRpt(listData)
#formating license expiration dates so all are in a standard MM/DD/YYYY format
formatDate(listData)
#raising a red flag if license expiration date is before current date
redFlag = raiseRedFlag(listData)
#Insert new column titles in data output file
listData.insert(0, ColumnTitles)

#Write list_data to new csv file called 'njoutput' in current working directory
writeCsv = open('njoutput.csv', 'w', newline ='')
csvWriter = csv.writer(writeCsv)
for i in range(len(listData)):
    csvWriter.writerow(listData[i])
writeCsv.close()

#Insert redFlag data in new csv file called 'Red Flags' in current working directory
writeFlagCsv = open('Red Flags.csv', 'w', newline ='')
flagCsvWriter = csv.writer(writeFlagCsv)
for i in range(len(redFlag)):
    flagCsvWriter.writerow(redFlag[i])
writeFlagCsv.close()


#### NJ csv data to json format

import csv
#Reading the csv file of New Jersey Data
File = open('njoutput.csv')
Reader = csv.reader(File)

#Converting the data to a list
Data = list(Reader)
#Data[1]
  


# In[ ]:

#len(Data)


# In[ ]:

#Using lists to manipulate data for the dictionaries
mylist=[]
for i in range(1,4026):
    #Changing 'Yes', 'No' strings in the data to 1 and 0 inorder 
    #to match the format for 'DisplayServices' field in the dictionary 
    a=[i if i!='Yes' else 1 for i in Data[i]]
    b=[i if i!='No' else 0 for i in a]
    
    #Creating fields for 'DisplayServices', 'DisplayServices' includes various services offered by Daycares 
    c={'After School': b[-3],
                     'Before School': b[-4] ,
                     'Drop In': 0,
                     'Food Served': 0,
                     'Full Day': 0,
                     'Half Day': 0,
                     'Infant Care': b[-5],
                     'Open Year-Round': 0,
                     'Transportation': 0}

    
    #For Services field, manipulating the above dictionary to determine the services offered by the Daycares
    list1=[]
    for key, value in c.items():    
        if value == 1:
            list1.append(key)

    str1='; '.join(list1)
    
    #For Zipcodes, spliting the zipcodes for 'ZipCode','ZipPlus4' field in the Dictionary
    zip_all = [b[9] +'-']
    zip_part=zip_all[0].split('-')
    
    #For Phone Numbers, Converting the string of phone numbers to integers
    import re
    line =re.sub('[-()]', '',b[3])
    line ="".join(line.split())
    def hasNumbers(line):
        return any(char.isdigit() for char in line)
    if hasNumbers(line) == True:
        number=int(line)
    else:
        number=line
    
    #For Street Number and Street Name, splitting the 'Address 1' field of the csv data
    s=b[5].split(' ',1)
    #Street Numbers -s[0]
    #Street Name- s[1]
    
    #Creating the json format for the data
    item={
        
    
    'Provider': {
        'Name': b[0],
        #'Age Groups': b[1],
        'Capacity':b[2],
        'PhoneNumber': number,
        'County': b[4],
        'FullAddress': ', '.join(b[5:9])+ ' ' + b[9],
        'City': b[7],
        'State': b[8],
        'ProviderID': None,
        'ProviderNumber': b[10],
        'LicenseExpirationDate': b[-1],
        'LicenseStatus': 'Licensed',
       
        'ProgramType': None,
            
        'Status': None,
        'StreetNumber': s[0],
        'StreetName': s[1],
        'StreetPostDirection': b[6],
        'StreetPreDirection': None,
        'StreetSuffix': None,
        'ZipCode': zip_part[0],
        'ZipPlus4': zip_part[1],
        'Services': str1,
        #Two new fields: Director Name and Directors Email Address
        'DirectorName': b[11],
        'DirectorEmail': b[12],
            
        'DisplayAddressOnWeb': True,
        'DisplayPhoneOnWeb': True, 
        
        'AddressID': None,
        'AgencyID': None,
        'AlternateProviderNumber': None,
        'DBAName': None,
        'ExtraSecondaryDesignatorPrefix': None,
        'ExtraSecondaryDesignatorSuffix': None,
        'FridayHours': None,
        'GoldSealAccreditingAgency': None,
        'GoldSealEffectiveDate': None,
        'GoldSealExpirationDate': None,
        'GoldSealStatusID': None,
        'Inspections':None,
        'IsFaithBased': None,
        'IsHeadStart': None,
        'IsOfferingSchoolReadiness': None,
        'IsPublicSchool': None,
        'IsReligiousExempt': None,
        'IsVPK': None,
        'Latitude': None,     
        'Longitude': None,
        'MondayHours': None,
        'OriginationDate': None,     
        'SaturdayHours': None,
        'SecondaryDesignatorPrefix': None,
        'SecondaryDesignatorSuffix': None,      
        'SundayHours': None,
        'ThursdayHours': None,
        'TuesdayHours': None,
        'VPKAccreditation': None,
        'VPKClass': None,
        'VPKCurriculum': None,
        'VpkStatusID': None,
        'WednesdayHours': None,
              
            
    },
        
'DisplayServices': c,
     
'Distance': None,
'Inspections': None,
'VPKAccreditation': None,
'VPKClass': None,
'VPKCurriculum':None,
'_displayDistance': None,
'_distance': None,
#Inspection Report URLs
'reportIDs': b[-2][2:-2]
        
      
     
     }
    #Adding all the dictionaries to a list
    mylist.append(item)

mylist




mylist[-1]




#Writing the entire json data to a file
import json
with open('crawl_data_NJ.json', 'w') as outfile:
    json.dump(mylist, outfile)

