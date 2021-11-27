 import csv, json

csvFile = open('VA_output.csv')
csvReader = csv.reader(csvFile)
csvData = list(csvReader)
dictCsvData = []

for i in csvData:
    if csvData.index(i) == 0:
        continue
    dictCsvData.append({'accreditations': [],#if no accrediting agency present
                        'accredited': 'N',
                        'accrediting_agency': None, #This may be irrelevant.  Johnny/Von to confirm
                        'address': {
                                    'addressLine1': i[5],
                                    'addressLine2': i[6],
                                    'city': i[7],
                                    'cityState': i[7] + ', ' + i[8],
                                    'county': i[4],
                                    'fullAddress': i[5] + ', ' + i[6] + ', ' + i[7] + ', ' + i[8] + ' ' + i[9],                                    
                                    'state': i[8],
                                    'suite': None, #optional
                                    'zip': i[9][0:5],
                                    'zip4': i[9][6:10]},
                        'afterschool': i[31],
                        'ageGroup': i[1], #probably not needed down the road
                        'alt_uid': None, #only exists for Broward, Hillsborough, Palm Beach, Pinellas and Sarasota counties in FL.  Field not used anywhere in code
                        'avgEducationRatings': 0,
                        'avgFacilitiesRatings': 0,
                        'avgOverAllRatings': 0,
                        'avgSafetyRatings': 0,
                        'avgStaffRatings': 0,
                        'beforeschool': i[30],
                        'capacity': int(i[2]),
                        'circuit': None, #set by the db import script, but commented out there too.  So maybe best to delete.  Exists and is not null for under 500 FL daycares only
                        'classes': [],
                        'closeHours': {'sunday': i[24] if i[15] == 'Y' else None,
                                       'monday': i[24] if i[16] == 'Y' else None,
                                       'tuesday': i[24] if i[17] == 'Y' else None,
                                       'wednesday': i[24] if i[18] == 'Y' else None,
                                       'thursday': i[24] if i[19] == 'Y' else None,
                                       'friday': i[24] if i[20] == 'Y' else None,
                                       'saturday': i[24] if i[21] == 'Y' else None},
                        'curriculum': [],
                        'dateFounded': None, #supposed to be same as origination_date (from FL script) - when a daycare was started
                        'description': None,
                        'director': i[11],
                        'displayAddress': 'Y',
                        'displayPhone': 'Y',
                        'dropins': 'N',
                        'email': i[12],
                        'faithbased': 'Y' if i[34] == 'Religious Exempt' else 'N', #should be the samme as "religiousExempt - why do we have both?
                        'fax': None, #unless if available from web scraping exercise
                        'flag': None, #delete later - seems to be left over from FL - only exists for 24 daycares in FL.  commented out in import script also
                        'food': 'N',#same as meals, but why do we have both meals and food?
                        'fullday': i[25],
                        'goldSeal': 'N',
                        'goldSealAccreditation': None,
                        'halfday': i[26],
                        'headstart': 'N',
                        'history': [], #empty array
                        'infantcare': i[13],
                        'inspection_url': None, #available for NJ
                        'inspections': [], #available for FL
                        'license': {'endDate': i[14],
                                    'legalStatus': None, #from FL, values include Exempt, Licensed, Registered                    
                                    'startDate': None}, #unless if available (not sure where it comes from or how it's used)
                        'logo': None,
                        'managed': 'N',
                        'meals': 'N', #same as food, but why do we have both meals and food?
                        'name' : i[0],
                        'nightcare': i[28],
                        'openHours': {'sunday': i[23] if i[15] == 'Y' else None,
                                      'monday': i[23] if i[16] == 'Y' else None,
                                      'tuesday': i[23] if i[17] == 'Y' else None,
                                      'wednesday': i[23] if i[18] == 'Y' else None,
                                      'thursday': i[23] if i[19] == 'Y' else None,
                                      'friday': i[23] if i[20] == 'Y' else None,
                                      'saturday': i[23] if i[21] == 'Y' else None},
                        'openyearround': 'Y' if i[29] == 'N' else 'N',
                        'operatingHours': None, #when/how do we use this?
                        'origination_date': None, #supposed to be same as dateFounded (from FL script) - when a daycare was started
                        'owner_id': None, #this gets set up when a registered user takes ownership of a daycare
                        'parttime': i[27],
                        'phone': i[3],
                        'program': i[34], #type of child care centers - family day care home, religious exempt, large family day care home, etc.
                        'providerType': None, #licensed, registered, etc.
                        'publicSchool': 'N', #applicable only to FL
                        'questions': [],
                        'religiousExempt': 'Y' if i[34] == 'Religious Exempt' else 'N', #mark as 'N' if info not available.  This should be the same as "faithbased" - why do we have both?
                        's_name': i[0].lower(), #for alphabetical sorting purposes
                        'schoolReadiness': 'N',
                        'schoolyearonly': i[29],
                        'source': 'http://www.dss.virginia.gov/facility/search/cc2.cgi',
                        'special_notes': None,
                        'status': 'active', #all daycares we update should be marked active.  Those currently in the database that don't get updated will have to be marked inactive.
                        'totalReviews': 0,
                        'transportation': 'N',
                        'type': 'daycare', #not sure what purpose this serves, but all daycares in the database have value "daycare" for field "type"
                        'uid': i[10],
                        'vpk': 'N',
                        'website': None,
                        'weekend': i[22]})

with open('VA_output.json', 'w') as outfile:
    json.dump(dictCsvData,outfile)

#Fields that json files shouldn't include because they get updated by the import script:

#location
#_id
#imported
#importDate
#modifiedDate
#createDate
#__v
