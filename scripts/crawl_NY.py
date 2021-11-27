
# NY Part I Extracting Daycares Info and Saving to a csv file

import requests, csv
#Extracting Data Related to DayCares from NY Office of Children and Family Services 
dataArg = {
    'Criteria.ModalityCode': '',
    'Criteria.CountyID': '',
    'Criteria.SchoolDistrict': '',
    'Criteria.ZipCode': '',
    'Criteria.FacilityName': ' ',
    'Criteria.RegistrationID': '',
    'Criteria.MedicationOnly': 'false',
    'Criteria.NonTraditionalHoursOnly': 'false',
    'Criteria.ShowOpenOnly': 'false',
    'Paging.PageSize': '100000'
}

dataCsv = requests.post('https://apps.netforge.ny.gov/dcfs/Search/Search', data=dataArg, verify=False)
    
openFile = open('nydata11', 'wb')
for chunk in dataCsv.iter_content(1000000):
    openFile.write(chunk)




#Using Beautiful Soup to extract data within the html tags
from bs4 import BeautifulSoup

html_soup = BeautifulSoup(open('nydata11'), 'lxml')
type(html_soup)






#Extracting Childcare name, Address, Licence Number, Contact Name/Title, Phone Number, Fax, Program Type, School District, Status
import re


final_list=[['Childcare name','Care Address','Licence Number','Contact Name/Title','Phone Number','Fax','Program Type','School District','Status']]
#final_list=[]
#d2={}
#d3={}
#d1={}
#dict1={} # 4,126103,7
for i in range(4,126103,7):
    mylist=[]
    mylist1=[]
    mylist2=[]
    mylist3=[]
    first_row= html_soup.find_all('tr')[i:i+7]
    cc_name= first_row[0].b.text
    Child_care_name = cc_name.strip().replace('"','').replace("'","")
    ##print(Child_care_name)
    Address = first_row[0].find('span').text
    ##print(Address)
    
    
    
    
    
    mylist.append(Child_care_name)
    mylist.append(Address)
   
    
    
    y=str(first_row[1].find_all('td')[0])
    rtr = y.replace('\n','').replace("'","").split('<b>')
    new_y = [re.sub("<.*?>", " ", i) for i in rtr]
    new_y
    short_y = [i.strip() for i in new_y]
   

   
    for i in range(1,5):
    
        a=short_y[i].split(':')
        b=[i.strip() for i in a]
    
       
        mylist1.append(b[1])
    
    
    
    
    
    
    z=str(first_row[1].find_all('td')[1].find_all('td')[0:6])
    rtr = z.replace('\n','').replace(']','').replace("'","").replace('[','').replace(',','').split('<b>')
    new_z = [re.sub("<.*?>", " ", i) for i in rtr]
    short_z = [i.strip() for i in new_z]
    

    
    for i in range(1,4):
    
        a=short_z[i].split(':')
        b=[i.strip() for i in a]
        
        
        
        mylist2.append(b[1])
   
   
    mylist3=mylist + mylist1 + mylist2
    final_list.append(mylist3)
    
    





#final_list[-1]



#Writing the extracted results to a csv file output.csv
import csv

with open("output.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerows(final_list)




####NY Part II Scrapping Data From the URLs of each Day Care####

#Reading the ouput.csv file that was created in Part I
import pandas as pd
data = pd.read_csv('output.csv')
#data.head()
data.columns
#Extracting the licence column from the data
lic = data['Licence Number'].tolist()
#lic[0]







#Extracting Data Related to First Licence, Current Registration Period and Total Capacity
import requests
from bs4 import BeautifulSoup
import re
import time
 
mylist=[['First Licensed/Registration Date','Current Registration Period','Total Capacity', 'Licence Number']]


for i in range(0,18015):
    new_r=[]
    r=[]
    
    myurl= 'https://apps.netforge.ny.gov/dcfs/Profile/Index/'+ lic[i]
    #print(myurl)
    url = requests.get(myurl, verify=False)
    if url.status_code==200 :
        response = url.text
        data = BeautifulSoup(response, 'lxml')
        #type(data)
        rows =data.find_all('tr')[5:7]
        r = re.sub("<.*?>", " ", str(rows)) 
        r = re.sub('[\n\r\xa0]', '', r)
        new_r = r.replace('[','').replace(']','').replace('Current Registration Period','').replace('Phone','').split(':')
        new_r= [new_r[i] for i in [1,2,-1]]
        new_r = [i.strip(' ') for i in new_r]
        new_r.append(lic[i])
        mylist.append(new_r)
    else:
        new_r=['','','',lic[i]]
        mylist.append(new_r)
    #time.sleep(3)
 



import csv
#Writing results to a csv file
with open("urldata_all.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerows(mylist)

##### NY Part III Combining URL Data (urldata_all.csv) and The Output Data (output.csv) File


#Reading the url_data.csv file from Part II


result1=pd.read_csv('urldata_all.csv',index_col=0)
result1.shape
#result1.head()


# Reading output.csv file from Part I

result2=pd.read_csv('output.csv')
result2.shape
#result2.head()




#Combining output.csv and urldata_all.csv
final_result = pd.merge(result2, result1, how='outer')




final_result.shape


# In[12]:

#Dropping Unnecessary Index Columns
df=final_result.drop(['Unnamed: 0'], axis=1)
df.head()
#Storing the Combined Results to a single csv
df.to_csv('NY-All Data Combined.csv')


##### NY Part IV Manipulating Data


# coding: utf-8

# In[1]:

#Using all the data that was collected to manipulate and format the data
import pandas as pd
df=pd.read_csv('NY-All Data Combined.csv')
#df.head()
#df.columns



#Formatting the First Licensed Registration Date
df['First Licensed/Registration Date'] =  pd.to_datetime(df['First Licensed/Registration Date'], format='%b %d, %Y')



df['First Licensed/Registration Date'] = [d.strftime('%m/%d/%y') if not pd.isnull(d) else '' for d in df['First Licensed/Registration Date']]



df['First Licensed/Registration Date'].head()




#Formatting Current Registration Start Date and Licence expiry date
import numpy as np
df1=df['Current Registration Period'].fillna('  -  ')
df_1 = df1.str.split('-')
#print(df_1)
df_1=df_1.tolist()
df2=pd.DataFrame(df_1, columns = ['Current Registration Start Date','License expiration date'])
#df2.head()




df2
a1 = df2.replace('  ',np.nan)

a1.head()

a1['Current Registration Start Date'] =  pd.to_datetime(a1['Current Registration Start Date'], format='%b %d, %Y ')
a1['Current Registration Start Date']=[d.strftime('%m/%d/%y') if not pd.isnull(d) else '' for d in a1['Current Registration Start Date']]
#a1['Current Registration Start Date']

a1['License expiration date']=pd.to_datetime(a1['License expiration date'], format=' %b %d, %Y')
a1['License expiration date']=[d.strftime('%m/%d/%y') if not pd.isnull(d) else '' for d in a1['License expiration date']]
#a1['License expiration date']
a1.head()
df['Current Registration Start Date'] = a1['Current Registration Start Date']
df['License expiration date']=a1['License expiration date']


df=df.drop(['Current Registration Period','Unnamed: 0'], axis=1)
df.columns




#Extracting the numbers for Capacity from Total Capacity column
df['Capacity']=df['Total Capacity'].str[:3]

df['Capacity']= df['Capacity'].replace('[A-Z]|[a-z]','',regex=True)
#df['Capacity'].head()
#df.columns



#Extracting Zip code from Care Address column
df_1 = df['Care Address'].str.split('(-[0-9][0-9][0-9][0-9])', expand=True)


df['Care Address']= df_1[0]
df_2=pd.DataFrame(df_1[0].tolist(), columns=['Care Address'])
df['Care Address']=df_2['Care Address']
#df.iloc[[52]]
#df_1=df_1.tolist()
#df2=pd.DataFrame(df_1, columns = ['Care Address','Unwanted column','Unwanted Column'])



df['Care Address'][13371]='3961-3981 Hillman Avenue, Bronx, NY 10463'
df['Care Address'][13371]




#Creating Zip Code Column
df['Zip Code']=df['Care Address'].str[-5:]
#Creating State Column
df['State']='NY'
#df.iloc[[52]]



#Extracting Counties using Zip codes

list_of_zipcodes=df['Zip Code'].tolist()
df1=pd.read_csv('zip-codes-states copy.csv')
#extracting only data for New York
df_1 =df1[df1['state']=='NY']
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

    




#mylist1
a2=pd.DataFrame(mylist1, columns=['County'])
df['County'] = a2['County']
#df['County'][52]




#Manipulating Age Data from Total Capacity Column to determine Infant Care,
#After School/Before School Care for all Day Cares

#Age Data available: 6 weeks to 12 years, Infant, School-Aged
x=df['Total Capacity'].str[3:].tolist()
l_new=['Not Available' if i is np.nan else i for i in x]
#l_new[609]
x=l_new
mylist_age=[]
mylist_infant_care=[]
mylist_after_school=[]
mylist_before_school=[]
for i in range(0,18015):
    if 'weeks' in x[i]:
        mylist_infant_care.append('Yes')
        mylist_age.append(x[i][14:34])
        mylist_before_school.append('Yes')
        mylist_after_school.append('Yes')
    elif 'Infant' in x[i]:
        mylist_infant_care.append('Yes')
        mylist_age.append('Infant')
        mylist_before_school.append('No')
        mylist_after_school.append('No')
    elif ('School-Aged' in x[i] ) or ('chool-Aged' in x[i]):
        mylist_infant_care.append('No')
        mylist_age.append('School-Aged Children')
        mylist_before_school.append('Yes')
        mylist_after_school.append('Yes')
    else:
        mylist_infant_care.append('No')
        mylist_age.append('Not Available')
        mylist_before_school.append('No')
        mylist_after_school.append('No')




#Creating Age group, Infant care, Before School/After School Columns
b1= pd.DataFrame( mylist_age, columns=['Age Group'])
b2= pd.DataFrame( mylist_infant_care, columns=['Infant Care'])
b3= pd.DataFrame(mylist_before_school, columns = ['Before School Care'])
b4= pd.DataFrame(mylist_after_school, columns=['After School Care'])




df['Age Group']=b1['Age Group']
df['Infant Care']=b2['Infant Care']
df['Before School Care']=b3['Before School Care']
df['After School Care']=b4['After School Care']


# Dropping a column

df=df.drop(['Total Capacity'], axis =1)
#df.head()




#Filling blanks in the Columns with Data Not Available
df['Fax'] = df['Fax'].fillna('Not Available')
df['Phone Number']=df['Phone Number'].fillna('Not Available')




df['Current Registration Start Date']= df['Current Registration Start Date'].fillna('Not Available')
df['License expiration date']=df['License expiration date'].fillna('Not Available')
df['First Licensed/Registration Date']=df['First Licensed/Registration Date'].fillna('Not Available')
df['Capacity']=df['Capacity'].fillna('0')



df['Current Registration Start Date']= df['Current Registration Start Date'].replace('','Not Available')
df['License expiration date']=df['License expiration date'].replace('','Not Available')
df['First Licensed/Registration Date']=df['First Licensed/Registration Date'].replace('','Not Available')
df['County']=df['County'].fillna('Not Available')





#Splitting Care Address Data into Address Line 1, Address Line 2 and City




df_a=df['Care Address'].str.split(',')




#Extracting data for address line 1, address line 2 and city 
#from the care address column 
address_1=[]
address_2=[]
city=[]
list1=[]
for i in range(0,18015):
    if len(df_a[i]) ==7:
        address_1.append(df_a[i][0]+' ')
        list1 = ''.join(df_a[i][1:5])
        address_2.append(list1.replace('  ',' '))
        list1=[]
        city.append(df_a[i][-2])
        
    elif len(df_a[i]) ==6:
        address_1.append(df_a[i][0]+' ')
        
        list1 = ''.join(df_a[i][1:4])
        address_2.append(list1.replace('  ',' '))
        list1=[]
        city.append(df_a[i][-2])
    
    elif len(df_a[i]) == 5:
        address_1.append(df_a[i][0]+' ')
        list1 = ''.join(df_a[i][1:3])
        address_2.append(list1.replace('  ',' '))
        list1=[]
        city.append(df_a[i][-2])
        
    elif len(df_a[i]) == 4:
        address_1.append(df_a[i][0]+' ')
        
        list1 = ''.join(df_a[i][1])
        address_2.append(list1.replace('  ',' '))
        list1=[]
        city.append(df_a[i][-2])
        
    elif len(df_a[i]) == 3:
        address_1.append(df_a[i][0]+' ')
        address_2.append('  ')
        city.append(df_a[i][-2])
        
    elif len(df_a[i]) == 2:
        address_1.append('  ')
        address_2.append('  ')
        city.append(df_a[i][0])
    else:
        address_1.append('  ')
        address_2.append('  ')
        city.append('  ')

    




df_b= pd.DataFrame(address_1, columns=['Street Address'])
df_c= pd.DataFrame(address_2, columns=['Address Line 2'])
df_d= pd.DataFrame(city, columns=['City'])
df['Street Address'] = df_b['Street Address']
df['Address Line 2'] = df_c['Address Line 2']
df['City'] = df_d['City']
#df[['Care Address', 'Street Address', 'Address Line 2', 'City' ]]
#df[['Address Line 2','City']]




df['Borough']=''
df['Borough'][df['County'] =='Bronx'] = 'Bronx'
df['Borough'][df['County'] =='New York'] = 'Manhattan'
df['Borough'][df['County'] =='Kings'] = 'Brooklyn'
df['Borough'][df['County'] =='Queens'] = 'Queens'
df['Borough'][df['County'] =='Richmond'] = 'Staten Island'




df2=pd.DataFrame(df['Contact Name/Title'].str.split(',').tolist(),
                                   columns = ['Contact','Title'])




df['Contact Person']=df2['Contact']
df['Title']=df2['Title']
#df.head()




# Removing Daycares with status=Close, Licence Suspended, Registration Suspended

df= df[df['Status'].str.contains('Close') == False]
df= df[df['Status'].str.contains('License Suspended')==False]
df= df[df['Status'].str.contains('Registration Suspended')==False]
df=df[df['Status'].str.contains('Denial')==False]
#df1=df[df['Status'].str.contains('Pending')]
#df1[['Status','License expiration date']]

#Drop the rows with 'Pending Revocation' where the licence has already expired
df=df.drop(df.index[[1125, 1127, 1128, 2136, 4406, 10967, 12830, 10598, 13716, 2053, 7799]])

#df[df['Status'].str.contains('Pending')]




#Dropping the row containing no values
df=df.drop(df.index[11896])




df['Address Line 2']=df['Address Line 2'].str.lstrip()
df['City']=df['City'].str.lstrip()
#df['Address Line 2'][9]='Apt. Room 1/2 4th Floor'
df['Address Line 2'][9]='Apt. Room 1/2 4th Floor'




df['Address Line 2'][26]='Side Ent Floor'



#cols = list(df.columns.values)
#Reaaranging columns of DataFrame
df=df[['Childcare name', 'Age Group', 'Capacity','Infant Care','Before School Care',
    'After School Care','Street Address', 'Address Line 2', 'City','School District','Zip Code',
    'County','Borough', 'State', 'Phone Number',  'Fax', 'Contact Person', 'Program Type',
    'Status','Licence Number','First Licensed/Registration Date',
    'Current Registration Start Date','License expiration date']]
df.shape


# In[37]:

#df.head()
#Converting a DataFrame to a csv file
df.to_csv('NY-Organized Day Care Data.csv', index=False)




#-------------------------------------------------------------#


#### NY Data to json


# coding: utf-8

# In[10]:

import csv
#Reading the csv file of New Jersey Data
File = open('NY-Organized Day Care Data.csv')
Reader = csv.reader(File)

#Converting the data to a list
Data = list(Reader)




#len(Data)




#Using lists to manipulate data for the dictionaries
mylist=[]
for i in range(1,16980): #16980
    #Changing 'Yes', 'No' strings in the data to 1 and 0 inorder 
    #to match the format for 'DisplayServices' field in the dictionary 
    a=[j if j!='Yes' else 1 for j in Data[i]]
    b=[j if j!='No' else 0 for j in a]

    #Creating fields for 'DisplayServices', 'DisplayServices' includes various services offered by Daycares 
    c={ 'After School': b[5],
        'Before School': b[4] ,
        'Drop In': 0,
        'Food Served': 0,
        'Full Day': 0,
        'Half Day': 0,
        'Infant Care': b[3],
        'Open Year-Round': 0,
        'Transportation': 0}


    #For Services field, manipulating the above dictionary to determine the services offered by the Daycares
    list1=[]
    for key, value in c.items():    
        if value == 1:
            list1.append(key)

    str1='; '.join(list1)
        
    #For Street Number and Street Name, splitting the 'Street Address' field of the csv data
    s=b[6].split(' ',1)
    #Street Numbers -s[0]
    #Street Name- s[1]

    #For Phone Numbers, Converting the string of phone numbers to integers
    import re
    line =re.sub('[-()]', '',b[14])
    line ="".join(line.split())
    def hasNumbers(line):
        return any(char.isdigit() for char in line)
    if hasNumbers(line) == True:
        number=int(line)
    else:
        number=line

    line2 =re.sub('[-()]', '',b[15])
    line2 ="".join(line2.split())
    def hasNumbers(line2):
        return any(char.isdigit() for char in line2)
    if hasNumbers(line2) == True:
        fax_num=int(line2)
    else:
        fax_num=line2

        #Creating the json format for the data
    item={


        'Provider': {
            'Name': b[0],
            #'Age Groups': b[1],
            'Capacity':int(b[2]),

            'PhoneNumber': number,
            #'FaxNumber': fax_num,
            'County': b[11],
            #'Borough':b[12]
            #'District:' b[9]
            'FullAddress': ', '.join(b[6:9])+', '+ b[13]+' '+b[10],

            'City': b[8],
            'State': b[13],
            'ProviderID': None,

            'ProviderNumber': b[-4],
            'OriginationDate': b[-3],
            'LicenseExpirationDate': b[-1],
            'LicenseStatus': 'Licensed',

            'ProgramType': b[-6],

            'Status': b[-5],
            'StreetNumber': s[0],
            'StreetName': s[1],
            'StreetPostDirection': b[7],
            'StreetPreDirection': None,
            'StreetSuffix': None,
            'ZipCode': b[10],
            'ZipPlus4': None,
            'Services': str1,
            #One new field: Contact 
            'ContactName': b[-7],


            'DisplayAddressOnWeb': True,
            'DisplayPhoneOnWeb': True,
          #############

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

    'reportIDs': None

    } 
    #Adding all the dictionaries to a list
    mylist.append(item)

#mylist






#Writing the entire data to a json file 
import json
with open('crawl_data_NY.json', 'w') as outfile:
    json.dump(mylist, outfile)















