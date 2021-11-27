#This is the latest and greatest code to download VA child care centers (03-27-18)

#Importing modules
import requests, csv, bs4, re, datetime, time, copy, string
from bs4 import BeautifulSoup
from datetime import datetime

#Defining empty lists and regular expressions for use in the main program
firstPageData = []
listData = []
finalInfoParsed = []

flag = []
idRegex = re.compile(r'ID=(.*?);')

#---------------------------------------------
#Defining function to get data from each child care center's URL

def getChildCareData(listData):

    detailInfoStripped = []

    dictA = {'Name':'', 'Address1':'', 'Address2':'', 'City':'', 'State':'', 'Zip':'',
             'Phone':'', 'Facility Type':'', 'Expiration Date':'',
             'Administrator':'', 'Business Hours':'', 'Capacity':'', 'Ages':'',
             'Flag':'', 'Infants':'', 'Before School':'', 'After School':'', 'Sunday':'',
             'Monday':'', 'Tuesday':'', 'Wednesday':'', 'Thursday':'','Friday':'',
             'Saturday':'', 'Open Time':'', 'Close Time':'', 'Weekend':'', 'Night':'', 'ID':''}

    locationRegex = re.compile(r'''
    ([a-z -]*) #Group 1 - city
    ([, ]*)?   #Group 2 - optional commas and spaces
    VA         
    ([, ]*)?   #Group 3 - optional commas and spaces
    (\d{5})    #Group 4 - first five of zip code 
    ''', re.IGNORECASE|re.VERBOSE)
    
#Go to each child care center's website (stored in listData[0] to get information on that center
    gotoLink = requests.get(listData[0])
    gotoLinkBs = BeautifulSoup(gotoLink.text,"html5lib")
    detailInfo = gotoLinkBs.select('div [id="main_content"] > table tbody tr')
#Remove any unnecessary white space from detailInfo
    [[detailInfoStripped.append(string) for string in i.stripped_strings] for i in detailInfo]
#Remove any left over unnecessary white space from detailInfoStripped
    detailInfoStripped = [' '.join(j.split()) for j in detailInfoStripped]
#Add new element for second address line missing in some daycares
    detailInfoStripped.insert(2,'') if detailInfoStripped[4] == 'Facility Type:' else False
    if detailInfoStripped[6] == 'Facility Type:':
        del detailInfoStripped[3]
#Seperate city, state and zip for each daycare into three individual items
    location = locationRegex.search(detailInfoStripped[3])
    city = string.capwords(location.group(1)) if location != None else 'Not available'
    zipCode = location.group(4) if location != None else 'Not available'
    detailInfoStripped[3] = city
    detailInfoStripped.insert(4, 'VA')
    detailInfoStripped.insert(5, zipCode)
#Remove an element ':' due to poor source data formatting, add titles for name and contact information so it's easier to populate dictionary dictA
    del detailInfoStripped[detailInfoStripped.index(':')]
    detailInfoStripped.insert(6, 'Phone')
    detailInfoStripped.insert(5, 'Zip')
    detailInfoStripped.insert(4, 'State')
    detailInfoStripped.insert(3, 'City')
    detailInfoStripped.insert(2, 'Address2')
    detailInfoStripped.insert(1, 'Address1')
    detailInfoStripped.insert(0, 'Name')
#detailStrippedInfo shows a ':' after each title.  To match these titles to dictionary dictA, remove ':' after titles in detailInfoStripped
    for k in detailInfoStripped:
        if (k != '' and k[-1] == ':'):
            detailInfoStripped[detailInfoStripped.index(k)] = k[:-1]
#For every key in dictionary dictA, if it is also in detailInfoStripped, then update the value for that key in dictA, else add that key as an item to detailInfoStripped and another empty item following it.
    for m in dictA:
        if m in detailInfoStripped:
            dictA[m] = detailInfoStripped[detailInfoStripped.index(m)+1]
        else:
            detailInfoStripped.append(m)
            detailInfoStripped.append('')
#Adjustments to detailInfoStripped
#Set Administrator's name for daycares that don't specify an administrator
    dictA['Administrator'] = dictA['Name'] if dictA['Administrator'] == '' else dictA['Administrator']
#Set Phone Number as 'Not available' if it is listed as 'No phone number available'
    dictA['Phone'] = 'Not available' if dictA['Phone'] == 'No phone number available' else dictA['Phone']
#Set Capacity as 'Not available' if it is listed as ''
    dictA['Capacity'] = 'Not available' if dictA['Capacity'] == '' else dictA['Capacity']
#Set Expiration Date as 'Not available' if it accidentlly picks up 'Administrator'.  This likely happens if Expiration Date value is ''.
    dictA['Expiration Date'] = 'Not available' if dictA['Expiration Date'] == 'Administrator' else dictA['Expiration Date']

    return(dictA)

#---------------------------------------------  
#Function to determine infant coverage

def infantCoverage(finalInfoParsed):

    ageRegex = re.compile(r'(.*)-')
#Customized for loop to allow for flexibility in interpreting a wide variety of age groups. If minimum age in age group is equal to or greater than 1 year, then there is no infant coverage and the code breaks out of the for loop.  Else, there is infant coverage.
    minimumAge = ageRegex.search(finalInfoParsed['Ages'])
#If Ages is blank or ageRegex returns None for minimumAge, then assume infant coverage is No.
    if (minimumAge != None):
        minimumAge = minimumAge.group(1).split()
        for i in range(len(minimumAge)):
            if (minimumAge[i] == 'year' or minimumAge[i] == 'years') and (int(float(minimumAge[i-1])) >= 1):
                    finalInfoParsed['Infants'] = 'No'
                    break
            elif (minimumAge[i] == 'month' or minimumAge[i] == 'months') and (int(float(minimumAge[i-1])) >= 12):
                    finalInfoParsed['Infants'] = 'No'
                    break
            else:
                finalInfoParsed['Infants'] = 'Yes'
    else:
        finalInfoParsed['Infants'] = 'No'
#Mark flag = 'Yes' for inclusion in exception log only if Ages has a value but ageRegex wasn't able to parse it meaningfully
        if finalInfoParsed['Ages'] != '':
            finalInfoParsed['Flag'] = 'Yes'
        
    return(finalInfoParsed)

#--------------------------------------------- 
#Function to determine before and after school coverage
#Assumes that kids of age 5+ (kids can enroll in kindergarten between 5 and 6) are school going, so daycare has before/after school services ArithmeticError(if ages server > 5, then before/after school flag is 'Yes')

def beforeAfterSchoolCoverage(finalInfoParsed):

    ageRegex = re.compile(r'-(.*)')
    maximumAge = ageRegex.search(finalInfoParsed['Ages'])
#If Ages is blank or ageRegex returns None for minimumAge, then assume infant coverage is No.
    if (maximumAge != None):
        maximumAge = maximumAge.group(1).split()
        if (maximumAge[1] == 'year' or maximumAge[1] == 'years' and int(float(maximumAge[0])) > 5):
            finalInfoParsed['Before School'] = 'Yes'
            finalInfoParsed['After School'] = 'Yes'
#Adjust before/after school coverage flags after considering open/close times.  If daycare opens after 9 am, then likely no before school (kids generally go to school before 9am).  If center closes before 4 pm, then likely no after school (kids generally return from school after 3pm).  If operating hours aren't available, then don't adjust before/after school flags.
            try:
                if(finalInfoParsed['Open Time'] == 'Not available' or finalInfoParsed['Close Time'] == 'Not available'):
                    pass
                else:
                    if (datetime.strptime(finalInfoParsed['Open Time'],'%I:%M%p') >= datetime.strptime('9:00AM','%I:%M%p')):
                        finalInfoParsed['Before School'] = 'No'
                    if ((datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p') > datetime.strptime('5:00AM','%I:%M%p')) and
                        (datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p') < datetime.strptime('4:00PM','%I:%M%p')) and
                        (datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p') > datetime.strptime(finalInfoParsed['Open Time'],'%I:%M%p'))):
                        finalInfoParsed['After School'] = 'No'
            except Exception:
                finalInfoParsed['Flag'] = 'Yes'
                pass
        else:
            finalInfoParsed['Before School'] = 'No'
            finalInfoParsed['After School'] = 'No'
    else:
        finalInfoParsed['Before School'] = 'No'
        finalInfoParsed['After School'] = 'No'
#Mark flag = 'Yes' for inclusion in exception log only if Ages has a value but ageRegex wasn't able to parse it meaningfully
        if finalInfoParsed['Ages'] != '':
            finalInfoParsed['Flag'] = 'Yes'
    return(finalInfoParsed)

#---------------------------------------------
#Function to determine start and end operating days

def getOpDays(finalInfoParsed):

    opDaysRegex = re.compile(r'''
    (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sun|Mon|Tue|Wed|Thu|Fri|Sat|M|Tues|W|Th|Thurs|F|Sa|Su)
    (-)
    (Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sun|Mon|Tue|Wed|Thu|Fri|Sat|M|Tues|W|Th|Thurs|F|Sa|Su)
    ''',re.IGNORECASE|re.VERBOSE)

    removeItemsRegex = re.compile(r',|am|pm|summer|school|year|shift',re.IGNORECASE)

# By default, mark each day in newOpDays as 'No'.  Change to 'Yes' only if found in Business Hours as an operating day.  If all remain 'No', then odds are operating days weren't reported.  Once marked 'Yes', don't change back to 'No' because it is already an operating day
    newOpDays =['No', 'No', 'No', 'No', 'No', 'No', 'No']

#Require 2 weeks of days in this list because we plan to rotate the list such that the first operating day for each daycare becomes the first element in the list, followed by the 6 other days
    days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

#Define all string combinations that represent days of the week in upper and lower case in case opDaysRegex doesn't recognize them.  Additional details on chosen strings next to each day below.
    Sunday = ['Su', 'su', 'Sun', 'sun', 'Sunday', 'sunday', 'SM', 'sm'] #SM for Sunday, Monday in case days are referenced by initials.  Excluding 'S' by itself - could mean Saturday or Sunday
    Monday = ['M', 'mt', 'sm', 'Mon', 'mon', 'Monday', 'monday'] # 'mt' for Monday, Tuesday in case days are referenced by initials in lower case.  Likewise, 'sm' for Sunday, Monday.  Excluded 'm' by itself - lower case 'm' could be part of words that don't represent Monday
    Tuesday = ['Tu', 'tu' 'Tue', 'tue', 'Tues', 'tues', 'Tuesday', 'tuesday', 'MTW', 'mtw'] #MTW/mtw for Monday, Tuesday, Wednesday in case days are referenced by initials (upper or lower case).  Excluding 'T'/'t' by itself - could mean Tuesday, Thursday or be part of words that don't represent either day.
    Wednesday = ['W', 'tw', 'wt', 'Wed', 'wed', 'Wednesday', 'wednesday']# 'tw' for Tuesday, Wednesdsay in case days are referenced by initials in lower case.  Likewise, 'wt' for Wednesday, Thursday.  Excluded 'w' by itself - lower case 'w' could be part of words that don't represent Wednesday
    Thursday = ['TH', 'Th', 'Thu', 'thu', 'Thurs', 'thurs', 'Thursday', 'thursday', 'WTF', 'wtf', 'WTHF', 'WThF', 'wthf'] #WTF/WThF for Wednesday, Thurday, Friday in case days are referenced by initials (upper or lower case).  Excluding 'T'/'t' by itself - could mean Tuesday, Thursday or be part of words that don't represent either day.  Excluding 'th' - could be part of words like 'other' or 'the'
    Friday = ['F', 'tf', 'thf', 'fs', 'Fri', 'fri', 'Friday', 'friday'] # 'tf'/'thf' for Thursday, Friday and 'fs' for Friday, Saturday in case days are reference by their initials.
    Saturday = ['Sa', 'sa', 'Sat', 'sat', 'Saturday', 'saturday', 'FS', 'fs'] #FS/fs for Friday, Saturday in case days are referenced by initials.  Excluding 'S' by itself - could mean Saturday or Sunday.

#Delete extraneous noise from Business Hours and convert 'to' and ('_') (in case there's a typo) to '-' for easier recognition of operating days    
#    opDataTemp = finalInfoParsed['Business Hours']
#    removeItems = [' ', '.', ',', 'am', 'AM', 'Am', 'pm', 'PM', 'Pm', 'summer', 'school year', 'SHIFT']
    opDataTemp = finalInfoParsed['Business Hours'].replace(' ','').replace('.', '')  #remove if it doesn't work
    removeItems = removeItemsRegex.findall(opDataTemp) #remove if it doesn't work
    for i in removeItems:
        opDataTemp = opDataTemp.replace(i, '')
    opDataTemp = opDataTemp.replace('to', '-').replace('_', '-')

#Processing 'Business Hours' results in a list of tuples
    opDaysRange = opDaysRegex.findall(opDataTemp)

#Part 1: Let opDaysRegex do its job to find operating days listed as a range (ie, a-b, separated by a hyphen)
    if (len(opDaysRange) > 0):
        for i in opDaysRange:
#Set opDays so it can used afresh for each item in opDaysRange
            opDays=['No', 'No', 'No', 'No', 'No', 'No', 'No']
#Days found may be listed in a variety of formats, so convert each day into a standard long format (example, if 'thurs' found, convert it to 'thursday')
            firstDay = convertDay(i[0].lower())
            lastDay = convertDay(i[2].lower())
#Get index for first weekday of operation in source data
            n = days.index(firstDay)
#Use index to position first operating day form source data as first element in 'days' list.  This is where rotation describe above happens.
            newDays = days[n:n+7]
#Index of last operating day from source data.  If index is less than or equal to this day, then daycare is operating that dat.
            n2 = newDays.index(lastDay)
#If first and last days of operation are same, then we don't need to assess further - daycare is open 7 days a week.  But change the Flag to 'Yes' to investigate and confirm it's working
            if firstDay == lastDay:
                opDays = ['Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes']
            else:
                for k in range(0,7):
                    opDays[k] = 'Yes' if k <= n2 else opDays[k]
#Replicating opDays to reverse rotate the list to undo the rotation aboce
            opDays += opDays
#Reverse rotating list so that Sunday is the first element in the list again
            opDays = opDays[7-n:7-n+7] 
#Transfer results to newOpDays only if newOpDays for a certain day is 'No'.  If it is 'Yes', don't change because we know that day to be an operating day already.
            for i in range(len(newOpDays)):
                newOpDays[i] = opDays[i] if newOpDays[i] == 'No' else newOpDays[i]

#Part 2: Now search for any days that are mentioned in Business Hours outside of a range format (ie, not like 'Mon-Fri') so we can mark them as operating days also
    for i in Sunday:
        if i in opDataTemp:
            newOpDays[0] = 'Yes'
            break
    for i in Monday:
        if i in opDataTemp:
            newOpDays[1] = 'Yes'
            break
    for i in Tuesday:
        if i in opDataTemp:
            newOpDays[2] = 'Yes'
            break
    for i in Wednesday:
        if i in opDataTemp:
            newOpDays[3] = 'Yes'
            break
    for i in Thursday:
        if i in opDataTemp:
            newOpDays[4] = 'Yes'
            break
    for i in Friday:
        if i in opDataTemp:
            newOpDays[5] = 'Yes'
            break
    for i in Saturday:
        if i in opDataTemp:
            newOpDays[6] = 'Yes'
            break
#If 'Business Hours' shows '7 days a week' or something similar, then all indexes of newOpDays should show 'Yes'
    if ('7day' in opDataTemp) or ('seven' in opDataTemp):
        for i in range(len(newOpDays)):
            newOpDays[i] = 'Yes'
#If all 7 days remain 'No', then we assume no operating day data is available and change all 'No's to 'Not available'
    if newOpDays == ['No', 'No', 'No', 'No', 'No', 'No', 'No']:
        newOpDays = ['Not available', 'Not available', 'Not available', 'Not available', 'Not available', 'Not available', 'Not available']

    finalInfoParsed.update({'Sunday':newOpDays[0], 'Monday':newOpDays[1], 'Tuesday':newOpDays[2],
                            'Wednesday':newOpDays[3], 'Thursday':newOpDays[4], 'Friday':newOpDays[5],
                            'Saturday':newOpDays[6]})
    
    return (finalInfoParsed)

#---------------------------------------------
#Function to convert any string representative of a day to full form (example, form 'thurs' to 'thursday')

def convertDay(day):
 
#Defining potential identified strings pertaining to days that need to be converted to long form of day.  These strings are all lower case because they will process days forming a range in part 1 of getOpDays, which are passed to this function in lower case.  To each string used, refer to comments in getOpDays.
    Sunday = ['su', 'sun', 'sunday', 'sm']
    Monday = ['m', 'mon', 'monday']
    Tuesday = ['tu', 'tue', 'tues', 'tuesday', 'mtw']
    Wednesday = ['w', 'tw', 'wt', 'wed', 'wednesday']
    Thursday = ['th', 'thu', 'thurs', 'thursday', 'wtf', 'wthf']
    Friday = ['f', 'tf', 'thf', 'fs', 'fri', 'friday']
    Saturday = ['sa', 'sat', 'saturday', 'fs']

    for i in Sunday:
        if i == day:
            day = 'sunday'
            return(day)
    for i in Monday:
        if i == day:
            day = 'monday'
            return(day)
    for i in Tuesday:
        if i == day:
            day = 'tuesday'
            return(day)
    for i in Wednesday:
        if i == day:       
            day = 'wednesday'
            return(day)
    for i in Thursday:
        if i == day:
            day = 'thursday'
            return(day)
    for i in Friday:
        if i == day:
            day = 'friday'
            return(day)
    for i in Saturday:
        if i == day:
            day = 'saturday'
            return(day)

#---------------------------------------------
#Function to determine start and end operating hours

def getOpHours(finalInfoParsed):

    opHoursRegex = re.compile(r'''
    (\d+:\d+|\d+:\d|\d:\d+|\d:\d|\d+|allshift) #providing a wide variety of time combinations to choose from
    (am|a|pm|p)?
    ''',re.IGNORECASE|re.VERBOSE)

    removeItemsRegex = re.compile(r'1st|2nd|3rd|4th|5th|6th|7th|x7|7x|7-day|7day|7-time|7time|;|\(|\)',re.IGNORECASE)

    opHoursFlag = ''

# Remove spaces and periods from operating hours/days raw data
    opDataTemp = finalInfoParsed['Business Hours'].lower().replace(' ','').replace('.','')
#Strip out certain words/characters from Business Hours to remove unnecessary noise in operating hours data.  This list should be modified to include other unnecessary characters/patterns that appear in Business Hours.
    removeItems = removeItemsRegex.findall(opDataTemp) #remove if it doesn't work
    for i in removeItems:
        opDataTemp = opDataTemp.replace(i, '')

#Replace 12noon/12:00noon/noon/12:0noon/1200noon with 12:00PM and 12midnight/12:00midnight/midnight/12:0midnight/1200midnight with 12:00AM
    replaceNoonItems = ['12noon', '12:00noon', 'noon', '12:0noon', '1200noon']
    for i in replaceNoonItems:
        opDataTemp = opDataTemp.replace(i,'12:00PM')

    replaceMidnightItems = ['12midnight', '12:00midnight', 'midnight', '12:0midnight', '1200midnight']
    for i in replaceMidnightItems:
        opDataTemp = opDataTemp.replace(i,'12:00AM')

#Returns a list of tuples, with 2 items in each tuple
    opHours = opHoursRegex.findall(opDataTemp)

    if (len(opHours) > 0):
#Convert tupils back to a list for easy data modification
        opHours = [list(i) for i in opHours]

#Some times may show more than 2 digts after the colon, which makes the time meaningless.  Modify those times to truncate excess digits following the colon.
        for i in opHours:
            if (':' in i[0]) and (':' not in i[0][-3:]):
                i[0] = i[0][:i[0].index(':')+3]

#Assign open/close times from opHours list to opHoursStart/opHoursStartAMPM and opHoursEnd/opHoursEndAMPM for different scenarios:

#1. If time shown to indicate 24 hour daycare, then designate start time as 12:00AM and closing time as 11:59PM.  Datetime functions don't recognize 24 as valid hour
        if ('24' in opDataTemp or 'allshift' in opDataTemp.lower()):
            opHoursStart = '12:00'
            opHoursStartAMPM = 'AM'
            opHoursEnd = '11:59'
            opHoursEndAMPM = 'PM'

#2. If hours are broken between school year and summer sessions, then assign first two items in opHours to open/close times if 'school' appears before 'summer' in opDataTemp, else assign 3rd and 4th items in opHours to open/close times. Assumption: there's only one open and one closing time for each of school and summer (ie, day not broken into two phases - ex: 9am - 2 pm, 3pm - 7pm). If that's the case, then add this case to exception report for further review.
        elif ('school' in opDataTemp and 'summer' in opDataTemp and len(opHours) <= 4):
            if opDataTemp.index('school') < opDataTemp.index('summer'):
                opHoursStart, opHoursFlag = correctTimeFormat(opHours[0][0])
                opHoursStartAMPM = opHours[0][1].upper()
                opHoursEnd, opHoursFlag = correctTimeFormat(opHours[1][0])
                opHoursEndAMPM = opHours[1][1].upper()
            else:
                opHoursStart, opHoursFlag = correctTimeFormat(opHours[2][0])
                opHoursStartAMPM = opHours[2][1].upper()
                opHoursEnd, opHoursFlag = correctTimeFormat(opHours[3][0])
                opHoursEndAMPM = opHours[3][1].upper()
#3. Set start/closing times for all other cases. If correctTimeFormat unable to determine correct format for time provided, it will also return a flag ('Yes') to indicate that daycare should be included in exception report for further review
        else:
            opHoursStart, opHoursFlag = correctTimeFormat(opHours[0][0])
            opHoursStartAMPM = opHours[0][1].upper()
#Picks time and am/pm from last sub list in the main list, in case the day is reported in more than 1 phase (ex: '5 am - 6 am and 9 pm - 10 pm')
            opHoursEnd, opHoursFlag = correctTimeFormat(opHours[len(opHours)-1][0])
            opHoursEndAMPM = opHours[len(opHours)-1][1].upper()

#Changing flag in finalInfoParsed['Flag'] if 1) more than 2 time datapoints are available or 2) opHoursFlag (returned from function correctTimeFormat) is Yes to make sure data is included in exception report ('VA Flags.csv') for futher review/confirmation
        if (len(opHours) > 2 or opHoursFlag == 'Yes'):
            finalInfoParsed['Flag'] = 'Yes' 

#Assign 'AM' to opening time and 'PM' to closing time if not reported in data
        opHoursStartAMPM = 'AM' if (opHoursStartAMPM == '' or opHoursStartAMPM == 'A') else 'PM' if opHoursStartAMPM == 'P' else opHoursStartAMPM
        opHoursEndAMPM = 'PM' if (opHoursEndAMPM == '' or opHoursEndAMPM == 'P') else 'AM' if opHoursEndAMPM == 'A' else opHoursEndAMPM

# If len(opHours) = 0
    else:
        opHoursStart = 'Not available'
        opHoursStartAMPM = ''
        opHoursEnd = 'Not available'
        opHoursEndAMPM = ''

#Mark flag = 'Yes' for inclusion in exception log also if Business Hours has a value but opHoursRegex wasn't able to parse it meaningfully
        if finalInfoParsed['Business Hours'] != '':
            finalInfoParsed['Flag'] = 'Yes' 
        
    finalInfoParsed.update({'Open Time': opHoursStart + opHoursStartAMPM,
                            'Close Time': opHoursEnd + opHoursEndAMPM})
    return(finalInfoParsed)

#---------------------------------------------
#Function to return start and end operating times in consistent HH:MM format (0-12 hours)

def correctTimeFormat(opHours):
    
#If any of the formatting clauses below work, then return flag = '' so the daycare does not get flagged for inclusion into the exception report for further review
    if (opHours != None):
        try:
            currentTimeFormat = datetime.strptime(opHours, '%I')
            opHours = currentTimeFormat.strftime('%I:%M')
            opHoursFlag = ''
            return(opHours, flag)
        except:
            pass

        try:
            currentTimeFormat = datetime.strptime(opHours, '%H')
            opHours = currentTimeFormat.strftime('%I:%M')
            opHoursFlag = ''
            return(opHours, flag)
        except:
            pass

        try:
            currentTimeFormat = datetime.strptime(opHours, '%I:%M')
            opHours = currentTimeFormat.strftime('%I:%M')
            opHoursFlag = ''
            return(opHours, flag)
        except:
            pass

        try:
            currentTimeFormat = datetime.strptime(opHours, '%H:%M')
            opHours = currentTimeFormat.strftime('%I:%M')
            opHoursFlag = ''
            return(opHours, flag)
        except:
            pass

        try:
            currentTimeFormat = datetime.strptime(opHours, '%I%M')
            opHours = currentTimeFormat.strftime('%I:%M')
            opHoursFlag = ''
            return(opHours, flag)
        except:
            pass

        try:
            currentTimeFormat = datetime.strptime(opHours, '%H%M')
            opHours = currentTimeFormat.strftime('%I:%M')
            opHoursFlag = ''
            return(opHours, flag)
        except:
            pass

#If neither of the above formatting clauses worked, then return flag = 'Yes' to flag this daycare for inclusion in the exception report for further review
        opHoursFlag = 'Yes'

    else:
        opHours = 'Not available'
        opHoursFlag = 'Yes'

    return(opHours, opHoursFlag)

#---------------------------------------
#Function to determine weekend coverage
def weekendCoverage(finalInfoParsed):

#If operating days/hours information is not available, then mark weekend coverage as 'No'
    finalInfoParsed['Weekend'] = 'Yes' if (finalInfoParsed['Saturday'] == 'Yes' or finalInfoParsed['Sunday'] == 'Yes') else 'No'
    
    return(finalInfoParsed)

#---------------------------------------
#Function to determine night coverage
def nightCoverage(finalInfoParsed):

#Insert a try and except clause here in case regex doesn't process Business Hours correctly
    try:
#If starting and closing times are not available, then we assume that night coverage is not available
        if (finalInfoParsed['Open Time'] == 'Not available' and finalInfoParsed['Close Time'] == 'Not available'):
           finalInfoParsed['Night'] = 'No'

#If closing time is between 7 pm and 5 am, then we know that night coverage is available
        elif (((datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p') >= datetime.strptime('12:00AM','%I:%M%p')) and
               (datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p')< datetime.strptime('5:00AM','%I:%M%p'))) or
              ((datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p') > datetime.strptime('7:00PM','%I:%M%p')) and
               (datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p')<= datetime.strptime('11:59PM','%I:%M%p')))):
            finalInfoParsed['Night'] = 'Yes'
#If opening time is between 7 pm and 5 am, then we know that night coverage is available
        elif (((datetime.strptime(finalInfoParsed['Open Time'],'%I:%M%p') >= datetime.strptime('12:00AM','%I:%M%p')) and
               (datetime.strptime(finalInfoParsed['Open Time'],'%I:%M%p')< datetime.strptime('5:00AM','%I:%M%p'))) or
              ((datetime.strptime(finalInfoParsed['Open Time'],'%I:%M%p') > datetime.strptime('7:00PM','%I:%M%p')) and
               (datetime.strptime(finalInfoParsed['Open Time'],'%I:%M%p')<= datetime.strptime('11:59PM','%I:%M%p')))):
            finalInfoParsed['Night'] = 'Yes'
#If opening and closing times are exactly the same, then we know it's a 24 hour daycare and has night coverage
        elif finalInfoParsed['Open Time'] == finalInfoParsed['Close Time']:
            finalInfoParsed['Night'] = 'Yes'
#If closing time is after 5 am but before opening time (example: 8 am - 7:30 am (next day)), then it's still pretry much a 24 hour daycare and has night coverage
        elif ((datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p') < datetime.strptime(finalInfoParsed['Open Time'],'%I:%M%p')) and
            (datetime.strptime(finalInfoParsed['Close Time'],'%I:%M%p')>= datetime.strptime('5:00AM','%I:%M%p'))):
            finalInfoParsed['Night'] = 'Yes'
        else:
            finalInfoParsed['Night'] = 'No'

    except Exception:
        finalInfoParsed['Night'] = 'No'
        finalInfoParsed['Flag'] = 'Yes'

    return(finalInfoParsed)

#---------------------------------------
#Main program
start = time.time()

vaRawData = requests.get('http://www.dss.virginia.gov/facility/search/cc2.cgi?rm=Search&search_keywords_name=&search_exact_fips=&search_contains_zip=')
openFile = open('vadata_unlicensed', 'wb')
for chunk in vaRawData.iter_content(100000):
    openFile.write(chunk)

openFileRead = open('vadata_unlicensed')
websiteLink = BeautifulSoup(openFileRead.read(),"html5lib")
#Collect URL and name for each daycare in the firstPageData list
firstPageData = websiteLink.select('div [id="main_content"] div a')
print('Retrieved ',len(firstPageData), 'records.')

#Define new column titles to be used in final output file
columnTitles = ['Child Care Center Name', 'Age Groups', 'Capacity', 'Phone Number', 'County', 'Street Address 1', 'Street Address 2',
              'City', 'State', 'Zip Code', 'Registration/License #', 'Director\'s name','Email','Infant coverage',
              'License expiration date', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Weekend coverage',
                'Starting time', 'Closing time', 'Night coverage', 'Before School', 'After school', 'Operating data', 'Flag', 'Child care URL']
flagColumnTitles = ['Number', 'Name', 'ID', 'Age group', 'Infant coverage', 'Before school coverage', 'After school coverage', 'Operating hours/days',
                    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Weekend', 'Start time', 'End time', 'Night']

for i in range(len(firstPageData)):
    try:
        listData.append(['http://www.dss.virginia.gov'+firstPageData[i]['href']])
        finalInfoParsed.append(getChildCareData(listData[i]))
        finalInfoParsed[i]['ID'] = idRegex.search(str(firstPageData[i])).group(1)
        listData[i].insert(0, finalInfoParsed[i]['Name']) #Child care name
        listData[i].insert(1, finalInfoParsed[i]['Ages']) #Age groups served
        listData[i].insert(2, finalInfoParsed[i]['Capacity']) #Capacity
        listData[i].insert(3, finalInfoParsed[i]['Phone']) #Phone number
        listData[i].insert(4, 'Not available') # reserve for county
        listData[i].insert(5, finalInfoParsed[i]['Address1']) #Street address line 1
        listData[i].insert(6, finalInfoParsed[i]['Address2']) #Street address line 2
        listData[i].insert(7, finalInfoParsed[i]['City']) #City
        listData[i].insert(8, finalInfoParsed[i]['State']) #State
        listData[i].insert(9, finalInfoParsed[i]['Zip']) #Zip code
        listData[i].insert(10, finalInfoParsed[i]['ID']) # ID
        listData[i].insert(11, finalInfoParsed[i]['Administrator']) #Director's/Administrator's name
        listData[i].insert(12, 'Not available') #Email
        listData[i].insert(13, infantCoverage(finalInfoParsed[i])['Infants']) #Infant coverage    
        listData[i].insert(14, finalInfoParsed[i]['Expiration Date']) #License expiration date
        listData[i].insert(15, getOpDays(finalInfoParsed[i])['Sunday']) #Open Sunday?
        listData[i].insert(16, getOpDays(finalInfoParsed[i])['Monday']) #Open Monday?
        listData[i].insert(17, getOpDays(finalInfoParsed[i])['Tuesday']) #Open Tuesday?
        listData[i].insert(18, getOpDays(finalInfoParsed[i])['Wednesday']) #Open Wednesday?
        listData[i].insert(19, getOpDays(finalInfoParsed[i])['Thursday']) #Open Thursday?
        listData[i].insert(20, getOpDays(finalInfoParsed[i])['Friday']) #Open Friday?
        listData[i].insert(21, getOpDays(finalInfoParsed[i])['Saturday']) #Open Saturday?
        listData[i].insert(22, weekendCoverage(finalInfoParsed[i])['Weekend']) #Weekend coverage?
        listData[i].insert(23, getOpHours(finalInfoParsed[i])['Open Time']) #Starting time
        listData[i].insert(24, getOpHours(finalInfoParsed[i])['Close Time']) #Closing time
        listData[i].insert(25, nightCoverage(finalInfoParsed[i])['Night']) #Night coverage
        listData[i].insert(26, beforeAfterSchoolCoverage(finalInfoParsed[i])['Before School']) #Before school coverage
        listData[i].insert(27, beforeAfterSchoolCoverage(finalInfoParsed[i])['After School']) #After school coverage
        listData[i].insert(28, finalInfoParsed[i]['Business Hours']) #Raw data for operating hours/day
        listData[i].insert(29, finalInfoParsed[i]['Flag']) #Flag for certain records that might have errors

#If flag in finalInfoParsed is 'Yes' but daycare data didn't throw an exception, add that daycare's information to the flag list for inclusion in 'VA Flags.csv'
        if finalInfoParsed[i]['Flag'] == 'Yes':
            flag.append([i, listData[i][0], listData[i][10], listData[i][1], listData[i][13],
            listData[i][26], listData[i][27], listData[i][28], listData[i][15], 
            listData[i][16], listData[i][17], listData[i][18], listData[i][19], listData[i][20],
            listData[i][21], listData[i][22], listData[i][23], listData[i][24], listData[i][25]])
        print('Done with item ',i)

    except Exception:
        print('Number ' ,i, ' raised an exception')
        flag.append([i, listData[i][0], listData[i][10], listData[i][1], listData[i][13],
                    listData[i][26], listData[i][27], listData[i][28],
                    listData[i][15], listData[i][16], listData[i][17], listData[i][18],
                    listData[i][19], listData[i][20], listData[i][21], listData[i][22],
                    listData[i][23], listData[i][24], listData[i][25]])
        pass

#Insert new column titles in data output file
listData.insert(0, columnTitles)
flag.insert(0, flagColumnTitles)

#Write list_data to new csv file called 'njoutput' in current working directory
writeCsv = open('VA_output.csv', 'w', newline ='')
csvWriter = csv.writer(writeCsv)
for i in range(len(listData)):
    csvWriter.writerow(listData[i])
writeCsv.close()

#Insert flag data in new csv file called 'VA Flags' in current working directory
writeFlagCsv = open('VA_flags.csv', 'w', newline ='')
flagCsvWriter = csv.writer(writeFlagCsv)
for i in range(len(flag)):
    flagCsvWriter.writerow(flag[i])
writeFlagCsv.close()
print('Total time: ', time.time() - start)



###Fixing the 'County' column of the VA_output.csv data


# coding: utf-8

# In[1]:

#Fixing the counties column of the VA_output file
import pandas as pd
df=pd.read_csv('VA_output.csv')
df['Zip Code']=df['Zip Code'].astype(str)
#df['Zip Code'].dtypes
#df.head()


# In[2]:

list_of_zipcodes=df['Zip Code'].tolist()
df1=pd.read_csv('zip-codes-states.csv')
#extracting only data for New York
df_1 =df1[df1['state']=='VA']
#Since we need only Zip code and county we extract 2 columns only
df2=df_1[['zip_code','county']]

#print(df2['zip_code'].dtype)
#Changing Data type of zip_code to strings 
df2['zip_code']=df2.loc[:,'zip_code'].astype(str)


mylist1=[]

for i in list_of_zipcodes:
        #Matches the zip code in the list to the zip_code column of dataframe
    df3 = df2[df2['zip_code'].str.contains(i)]
        #Storing the county of the particular zip code in a list
    mylist1.append(df3['county'].tolist())   

    


# In[3]:

a2=pd.DataFrame(mylist1, columns=['County'])
df['County']=a2['County']
#df.head()




#Fixing the non numeric column of VA data
df['Capacity']=df['Capacity'].str.replace('Not available','0')




df.to_csv('VA.csv', index=False)



import csv
#Reading the csv file of New Jersey Data
File = open('VA.csv')
Reader = csv.reader(File)

#Converting the data to a list
Data = list(Reader)




#len(Data)




from dateutil import parser
#Using lists to manipulate data for the dictionaries
mylist=[]

    
for i in range(1,6070):
    #Changing 'Yes', 'No' strings in the data to 1 and 0 inorder 
    #to match the format for 'DisplayServices' field in the dictionary 
    a=[j if j!='Yes' else 1 for j in Data[i]]
    b=[j if j!='No' else 0 for j in a]

        #Creating fields for 'DisplayServices', 'DisplayServices' includes various services offered by Daycares 
    c={ 'After School': b[-4],
        'Before School': b[-5] ,
        'Infant Care': b[13],
        'Drop In': 0,
        'Food Served': 0,
        'Full Day': 0,
        'Half Day': 0,
        'Open Year-Round': 0,
        'Transportation': 0,
       #Adding additional fields for different types of coverage
        'Weekend Care': b[22],
        'Night Care': b[25]
       }
    #print(c)



    #For Services field, manipulating the above dictionary to determine the services offered by the Daycares
    list1=[]
    for key, value in c.items():    
        if value == 1:
            list1.append(key)

    str1='; '.join(list1)

    #Splitting Street Address 1 into two columns
    s=b[5].split(' ',1)
    #Street Numbers -s[0]
    #Street Name- s[1]

    #Determining the whether a day care is open or closed on a particular day
    # Open=1, Close =0
    d={
        'Sunday': b[15],
        'Monday': b[16],
        'Tuesday': b[17],
        'Wednesday':b[18],
        'Thursday': b[19],
        'Friday': b[20],
        'Saturday': b[21]

    }


    d1={}
    #Determining the operating time for days the day care is open on
    for key, value in sorted(d.items()):    
            if value == 1:
                d1[key]=b[-8]+' to '+b[-7]
            else:
                d1[key]= None

    #Format the Licence expiration date
    
    ##date =parser.parse(b[14]).strftime('%m/%d/%Y')
    date_str=b[14]
    
    
    try: 
        parser.parse(date_str).strftime('%m/%d/%Y')
        valid= True

    except ValueError:
        valid =False

    if valid == True:
        date=parser.parse(date_str).strftime('%m/%d/%Y')
        lic_stat='Licensed'
    else:
        date = date_str
        lic_stat='Not Available'          

    #For Phone Numbers, Converting the string of phone numbers to integers
    import re
    line =re.sub('[-()]', '',b[3])
    line ="".join(line.split())
    def hasNumbers(line):
        return all(char.isdigit() for char in line)
    if hasNumbers(line) == True:
        number=int(line)
    else:
        number=line

    #For Capacity Converting string to numbers
    cap_str=b[2]
    def hasNumbers(cap_str):
        return any(char.isdigit() for char in cap_str)
    if hasNumbers(cap_str) == True:
        cap=int(cap_str)
    else:
        cap=cap_str

    item={


        'Provider': {
                'Name': b[0],
                'Capacity':cap,
                'PhoneNumber': number,
                'County': b[4],

                'FullAddress': ', '.join(b[5:8])+', '+ b[8]+' '+b[9],

                'City': b[7],
                'State': b[8],
                'ProviderID': None,

                'ProviderNumber': b[10],
                'OriginationDate': None,
                'LicenseExpirationDate': date,
                'LicenseStatus': lic_stat,

                'ProgramType': None,

                'Status': None,
                'StreetNumber': s[0],
                'StreetName': s[1],
                'StreetPostDirection': b[6],
                'StreetPreDirection': None,
                'StreetSuffix': None,
                'ZipCode': b[9],
                'ZipPlus4': None,
                'Services': str1,
                #One new field: Director Name 
                'DirectorName': b[11],


                'DisplayAddressOnWeb': True,
                'DisplayPhoneOnWeb': True,
              

                'AddressID': None,
                'AgencyID': None,
                'AlternateProviderNumber': None,
                'DBAName': None,
                'ExtraSecondaryDesignatorPrefix': None,
                'ExtraSecondaryDesignatorSuffix': None,
                'FridayHours': d1['Friday'],
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
                'MondayHours': d1['Monday'],
                'SaturdayHours': d1['Saturday'],
                'SecondaryDesignatorPrefix': None,
                'SecondaryDesignatorSuffix': None,      
                'SundayHours': d1['Sunday'],
                'ThursdayHours': d1['Thursday'],
                'TuesdayHours': d1['Tuesday'],
                'VPKAccreditation': None,
                'VPKClass': None,
                'VPKCurriculum': None,
                'VpkStatusID': None,
                'WednesdayHours': d1['Wednesday'],




            },

        'DisplayServices': c,

        'Distance': None,
        'Inspections': None,
        'VPKAccreditation': None,
        'VPKClass': None,
        'VPKCurriculum':None,
        '_displayDistance': None,
        '_distance': None,

        'reportIDs': None

        } 
    mylist.append(item)


# In[16]:


#mylist


# In[17]:

#Writing the entire json data to a file
import json
with open('crawl_data_VA.json', 'w') as outfile:
    json.dump(mylist, outfile)










