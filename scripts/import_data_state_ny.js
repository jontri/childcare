//# node insert_providers.js
var mongoose = require('mongoose');

mongoose.set('debug', true);
var path = require("path");

var mongoose_uri = "mongodb://ratingsville:r4tingsvill3@localhost:27017/databank?authSource=admin";
var connection =  mongoose.connect(mongoose_uri);


var request = require('request');
var fs = require('fs');
var dateFormat = require('dateformat');
var url = require('url');
var Listing = require(path.join(__dirname, "..", "models", "listing.js"));
const sendEmail = require('./webmail');
var mkdirp = require('mkdirp');
var winston = require('winston');
var json = require('json-file');

var insertData = 0;
var updateData = 0;
var skipPublicSchoolData = 0;
var skipNonPublicSchoolData = 0;
var skipOtherData=0;
var skipManagedData=0;
var stateSummary = "";
var missing = 0;

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

var procData = function procData(){

var stateList = ['ny'];
// var stateList = ['nj', 'ny', 'va'];

    //ctr = 0;

    console.log("Total Number of States to be processed: " + stateList.length);

    var d = dateFormat(new Date(), "yyyy-mm-dd");

// define hardcoded date
    d="2018-06-04";

    mkdirp('/var/ratings/' + d, function (err) {
        if (err)
            console.error(err);
        //else
        //  console.log('Directory Created: ' + '/var/ratings/' + d);
    });


    var logger = new (winston.Logger)({
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                filename: '/var/ratings/' + d + '-import_ny.log'
            })
        ],
        exceptionHandlers: [
            new winston.transports.File({
                filename: '/var/ratings/' + d + '-import_ny.log'
            })
        ]
    });

    var startProcess = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

    loopOnStateListWithDelay(stateList, 300000, 0, function (e, i) {

        var state = stateList[i];
        var file = '/var/ratings/' +d+ '/'  + state + ".json";
        var jsonData = null;

        try {
            jsonData = json.read(file);
        }catch(e){
            logger.info("File don't exist: " + file + " [" + (i+1) + " of " + stateList.length + "]");
        }

        var insertDataPerState = 0;
        var updateDataPerState = 0;
        var skipPublicSchoolDataPerState = 0;
        var skipNonPublicSchoolDataPerState = 0;
        var skipOtherDataPerState=0;
        var skipManagedDataPerState=0;

        if(isNotEmpty(jsonData) &&  isNotEmpty(jsonData.data)){

            var data = jsonData.data;

            logger.info("Importing  Data for State: " + file + " [" + (data.length) + "]" + " [" + (i + 1) + " of " + (stateList.length) + "]");


            loopOnDaycaresListWithDelay(data, 50, 0, function (e, z) {

                var providerId = data[z].Provider.ProviderNumber.trim();

                Listing.findOne({
                    uid: providerId
                }, function (err, result) {
                    if (err) {
                        next(err);
                    } else {

                        if (!result) {

                            if(data[z].Provider.ProgramType == "Public School" || data[z].Provider.ProgramType == "Non-Public School"){
                                logger.info( z + " Skipping record " + data[z].Provider.Name + " [" + data[z].Provider.ProgramType + "]");

                                if(data[z].Provider.ProgramType == "Public School"){
                                    skipPublicSchoolData++;
                                    skipPublicSchoolDataPerState++;
                                } else if(data[z].Provider.ProgramType == "Non-Public School"){
                                    skipNonPublicSchoolData++;
                                    skipNonPublicSchoolDataPerState++;
                                } else {
                                    skipOtherData++;
                                    skipOtherDataPerState++;
                                }

                            } else {

                                logger.info( z + " Inserting record " + data[z].Provider.Name + " " + (z+1) + " of " + data.length + " State " + (i + 1) + " of " + (stateList.length) );

                                var listing = new Listing();

                                listing.name = data[z].Provider.Name;
                                listing.s_name = data[z].Provider.Name.toLowerCase();
                                listing.uid = data[z].Provider.ProviderNumber.trim();
                                listing.alt_uid = data[z].Provider.AlternateProviderNumber;

                                // listing.circuit = data[z].Provider.["Circuit"];
                                listing.circuit = null;
                                // listing.altPhone = data[z].Provider.["ProvPh Alt"];
                                // listing.fax = data[z].Provider.["Prov Fax"];
                                listing.fax = null;
                                // listing.director = data[z].Provider.["Director"];
                                listing.director = null;
                                // listing.fgoldseal = data[z].Provider.["F-Gold Seal"];
                                // listing.email = data[z].Provider.["Email"];
                                listing.email = null;

                                // listing.accrediting_agency = data[z].Provider.["Accrediting agency"];
                                listing.accrediting_agency = null;
                                // listing.special_notes = data[z].Provider.["Special notes"];
                                listing.special_notes = null;
                                // listing.flag = data[z].Provider.["Flag"];
                                listing.flag = null;

                                listing.source = data[z].Provider.reportIDs;

                                listing.address = {};
                                listing.address.county = data[z].Provider.County;

                                if( isNotEmpty(getNonNullData(data[z].Provider.StreetName, "")) && getNonNullData(data[z].Provider.StreetName, "") != "NA") {

                                    listing.address.addressLine1 = getNonNullData(data[z].Provider.StreetNumber, "");
                                    listing.address.addressLine1 += getNonNullData(data[z].Provider.StreetPreDirection, " ");
                                    listing.address.addressLine1 += getNonNullData(data[z].Provider.StreetName, " ");
                                    // listing.address.addressLine1 += getNonNullData(data[z].Provider.StreetSuffix, " ");

                                } else {
                                    listing.address.addressLine1 = "";
                                }

                                listing.address.city = data[z].Provider.City;
                                listing.address.state = data[z].Provider.State;
                                listing.address.zip = data[z].Provider.ZipCode;
                                listing.address.zip4 = getNonNullData(data[z].Provider.ZipPlus4, "");
                                listing.address.fullAddress = getNonNullData(data[z].Provider.FullAddress, "");

                                listing.location = {};
                                listing.location.type = "Point";
                                listing.location.coordinates = [];
                                listing.location.coordinates.push(data[z].Provider.Longitude);
                                listing.location.coordinates.push(data[z].Provider.Latitude);

                                listing.phone = data[z].Provider.PhoneNumber;
                                listing.program = data[z].Provider.ProgramType;
                                listing.capacity = data[z].Provider.Capacity;

                                if( data[z].Provider.OriginationDate != undefined && !isNaN(Date.parse(data[z].Provider.OriginationDate) )) {
                                    listing.dateFounded = data[z].Provider.OriginationDate;
                                    listing.origination_date = data[z].Provider.OriginationDate;
                                }

                                if( data[z].Provider.LicenseExpirationDate != undefined && !isNaN( Date.parse(data[z].Provider.LicenseExpirationDate) )){
                                    listing.license = {};
                                    //listing.license.legalId = data[z].Provider.AlternateProviderNumber;
                                    listing.license.legalStatus = data[z].Provider.LicenseStatus;
                                    listing.license.endDate = data[z].Provider.LicenseExpirationDate;
                                }

                                if(data[z].Provider.DisplayAddressOnWeb==false) {
                                    listing.displayAddress = "N";
                                } else {
                                    listing.displayAddress = "Y";
                                }

                                if(data[z].Provider.DisplayPhoneOnWeb==false) {
                                    listing.displayPhone = "N";
                                } else {
                                    listing.displayPhone = "Y";
                                }

                                listing.operatingHours = {};
                                listing.operatingHours.monday = data[z].Provider.MondayHours;
                                listing.operatingHours.tuesday = data[z].Provider.TuesdayHours;
                                listing.operatingHours.wednesday = data[z].Provider.WednesdayHours;
                                listing.operatingHours.thursday = data[z].Provider.ThursdayHours;
                                listing.operatingHours.friday = data[z].Provider.FridayHours;
                                listing.operatingHours.saturday = data[z].Provider.SaturdayHours;
                                listing.operatingHours.sunday = data[z].Provider.SundayHours;

                                listing.openHours = {};
                                listing.status = "active";
                                listing.importDate = new Date();

                                if(data[z].Provider.MondayHours)
                                    listing.openHours.monday = data[z].Provider.MondayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.TuesdayHours)
                                    listing.openHours.tuesday = data[z].Provider.TuesdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.WednesdayHours)
                                    listing.openHours.wednesday = data[z].Provider.WednesdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.ThursdayHours)
                                    listing.openHours.thursday = data[z].Provider.ThursdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.FridayHours)
                                    listing.openHours.friday = data[z].Provider.FridayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.SaturdayHours)
                                    listing.openHours.saturday = data[z].Provider.SaturdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.SundayHours)
                                    listing.openHours.sunday = data[z].Provider.SundayHours.trim().split(/\s+/)[0];

                                listing.closeHours = {};
                                if(data[z].Provider.MondayHours)
                                    listing.closeHours.monday = data[z].Provider.MondayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.TuesdayHours)
                                    listing.closeHours.tuesday = data[z].Provider.TuesdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.WednesdayHours)
                                    listing.closeHours.wednesday = data[z].Provider.WednesdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.ThursdayHours)
                                    listing.closeHours.thursday = data[z].Provider.ThursdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.FridayHours)
                                    listing.closeHours.friday = data[z].Provider.FridayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.SaturdayHours)
                                    listing.closeHours.saturday = data[z].Provider.SaturdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.SundayHours)
                                    listing.closeHours.sunday = data[z].Provider.SundayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.Services) {
                                    listing.services = data[z].Provider.Services;


                                    if (data[z].Provider.Services.indexOf("After School") !== -1) {
                                        listing.afterschool = "Y";
                                    } else {
                                        listing.afterschool = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Before School") !== -1) {
                                        listing.beforeschool = "Y";
                                    } else {
                                        listing.beforeschool = "N";
                                    }

                                    result.avgEducationRatings = 0;
                                    result.avgFacilitiesRatings = 0;
                                    result.avgOverAllRatings  =  0;
                                    result.avgSafetyRatings = 0;
                                    result.avgStaffRatings = 0;

                                    if (data[z].Provider.Services.indexOf("Drop In") !== -1) {
                                        listing.dropins = "Y";
                                    } else {
                                        listing.dropins = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Food Served") !== -1) {
                                        listing.food = "Y";
                                        listing.meals = "Y";
                                    } else {
                                        listing.food = "N";
                                        listing.meals = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Full Day") !== -1) {
                                        listing.fullday = "Y";
                                    } else {
                                        listing.fullday = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Half Day") !== -1) {
                                        listing.halfday = "Y";
                                    } else {
                                        listing.halfday = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Infant Care") !== -1) {
                                        listing.infantcare = "Y";
                                    } else {
                                        listing.infantcare = "N";
                                    }

                                    listing.inspection_url = null;

                                    if (data[z].Provider.Services.indexOf("Night Care") !== -1) {
                                        listing.nightcare = "Y";
                                    } else {
                                        listing.nightcare = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Transportation") !== -1) {
                                        listing.transportation = "Y";
                                    } else {
                                        listing.transportation = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Weekend Care") !== -1) {
                                        listing.weekend = "Y";
                                    } else {
                                        listing.weekend = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("School Year Only") !== -1) {
                                        listing.schoolyearonly = "Y";
                                    } else {
                                        listing.schoolyearonly = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Open Year-Round") !== -1) {
                                        listing.openyearround = "Y";
                                    } else {
                                        listing.openyearround = "N";
                                    }
                                }

                                if(data[z].Provider.GoldSealAccreditingAgency) {
                                    listing.goldSeal = "Y";
                                } else {
                                    listing.goldSeal = "N";
                                }

                                if(data[z].Provider.IsFaithBased==true) {
                                    listing.faithbased = "Y";
                                } else {
                                    listing.faithbased = "N";
                                }

                                if(data[z].Provider.IsReligiousExempt==true) {
                                    listing.religiousExempt = "Y";
                                } else {
                                    listing.religiousExempt = "N";
                                }

                                if(data[z].Provider.IsHeadStart==true) {
                                    listing.headstart = "Y";
                                } else {
                                    listing.headstart = "N";
                                }

                                if(data[z].Provider.IsOfferingSchoolReadiness==true) {
                                    listing.schoolReadiness = "Y";
                                } else {
                                    listing.schoolReadiness = "N";
                                }

                                listing.history = [];

                                if(data[z].Provider.IsPublicSchool==true) {
                                    listing.publicSchool = "Y";
                                } else {
                                    listing.publicSchool = "N";
                                }

                                if(data[z].Provider.IsVPK==true) {
                                    listing.vpk = "Y";
                                } else {
                                    listing.vpk = "N";
                                }

                                listing.goldSealAccreditation = {};
                                listing.goldSealAccreditation.agency = data[z].Provider.GoldSealAccreditingAgency;
                                listing.goldSealAccreditation.effectiveDate = data[z].Provider.GoldSealEffectiveDate;
                                listing.goldSealAccreditation.expirationDate = data[z].Provider.GoldSealExpirationDate;
                                listing.goldSealAccreditation.status = data[z].Provider.GoldSealStatusID;

                                listing.type='daycare';
                                listing.curriculum = [];
                                listing.accreditations = [];
                                listing.classes = [];
                                listing.inspections = [];

                                if(data[z].VPKCurriculum && data[z].VPKCurriculum.length > 0){
                                    for(y=0; y<data[z].VPKCurriculum.length; y++ ){
                                        listing.curriculum.push({
                                            "id":  data[z].VPKCurriculum[y].ID,
                                            "description":  data[z].VPKCurriculum[y].Description,
                                            "publisher":  data[z].VPKCurriculum[y].PublisherName
                                        });
                                    }
                                }

                                if(data[z].VPKAccreditation && data[z].VPKAccreditation.length > 0){
                                    for(y=0; y<data[z].VPKAccreditation.length; y++ ){
                                        listing.accreditations.push({
                                            "id": data[z].VPKAccreditation[y].ID,
                                            "name": data[z].VPKAccreditation[y].Name,
                                            "effectiveDate": data[z].VPKAccreditation[y].EffectiveDate,
                                            "expirationDate": data[z].VPKAccreditation[y].ExpirationDate
                                        });
                                    }
                                }

                                if(data[z].VPKClass && data[z].VPKClass.length > 0){
                                    for(y=0; y<data[z].VPKClass.length; y++ ){
                                        listing.classes.push({
                                            "id": data[z].VPKClass[y].ID,
                                            "classRoomCode": data[z].VPKClass[y].ClassRoomCode,
                                            "classType": data[z].VPKClass[y].ClassType,
                                            "startDate": data[z].VPKClass[y].StartDate,
                                            "endDate": data[z].VPKClass[y].EndDate,
                                            "monday": data[z].VPKClass[y].Monday,
                                            "tuesday": data[z].VPKClass[y].Tuesday,
                                            "wednesday": data[z].VPKClass[y].Wednesday,
                                            "thursday": data[z].VPKClass[y].Thursday,
                                            "friday": data[z].VPKClass[y].Friday,
                                            "saturday": data[z].VPKClass[y].Saturday,
                                            "sunday": data[z].VPKClass[y].Sunday,
                                            "classRoomCount": data[z].VPKClass[y].ClassRoomCount,
                                            "capacity": data[z].VPKClass[y].Capacity,
                                            "enrollments": data[z].VPKClass[y].Enrollments,
                                            "instructorCredential": data[z].VPKClass[y].InstructorCredential
                                        });
                                    }
                                }

                                listing.capacity = data[z].Provider.Capacity;

                                if(data[z].Inspections && data[z].Inspections.length > 0){
                                    for(y=0; y<data[z].Inspections.length; y++ ){
                                        listing.inspections.push({
                                            "id": data[z].Inspections[y].InspectionID,
                                            "hasViolation": data[z].Inspections[y].HasViolation,
                                            "inspectionDate": data[z].Inspections[y].InspectionDate
                                        });
                                    }
                                }

                                // listing.testdata = "Y";
                                listing.parttime = null;
                                listing.owner_id = null;
                                listing.managed = "N";
                                listing.logo = null;
                                listing.providerType = null;
                                listing.questions = [];
                                listing.totalReviews = 0;
                                listing.website = null;
                                listing.imported = "Y";

                                if(data[z].Provider.Longitude && data[z].Provider.Latitude ) {
                                    listing.location = {
                                        type: "Point",
                                        coordinates: [data[z].Provider.Longitude, data[z].Provider.Latitude]
                                    }
                                } else {
                                    listing.location = null;
                                }


                                listing.save(function (err) {
                                    if (err) {
                                        console.log("Error Inserting : " + err);
                                    }
                                    else {
                                        insertData++;
                                        insertDataPerState++;
                                    }
                                });


                            }


                        } else {


                            logger.info( z + " Updating record " + data[z].Provider.Name + " [" + (z+1) + " of " + data.length + "] [State " + (i + 1) + " of " + stateList.length + "]" );


                            if(result.managed && result.managed=="Y"){
                                logger.info("Skipping update of managed Provider: " + data[z].Provider.Name);
                                skipManagedData++;
                                skipManagedDataPerState++;
                            } else {
                                result.name = data[z].Provider.Name;
                                result.s_name = data[z].Provider.Name.toLowerCase();
                                result.uid = data[z].Provider.ProviderNumber.trim();

                                if( data[z].Provider.OriginationDate != undefined && !isNaN(Date.parse(data[z].Provider.OriginationDate) )) {
                                    result.dateFounded = data[z].Provider.OriginationDate;
                                    result.origination_date = data[z].Provider.OriginationDate;
                                }

                                result.alt_uid = data[z].Provider.AlternateProviderNumber;

                                result.circuit = null;
                                // result.circuit = data[z].Provider.["Circuit"];
                                // result.altPhone = data[z].Provider.["ProvPh Alt"];
                                result.fax = null;
                                // result.fax = data[z].Provider.["Prov Fax"];
                                // result.director = data[z].Provider.["Director"];
                                result.director = null;
                                // result.fgoldseal = data[z].Provider.["F-Gold Seal"];
                                // result.email = data[z].Provider.["Email"];
                                result.email = null;

                                // result.accrediting_agency = data[z].Provider.["Accrediting agency"];
                                result.accrediting_agency = null;
                                // result.special_notes = data[z].Provider.["Special notes"];
                                result.special_notes = null;
                                result.flag = null;

                                result.source = data[z].Provider.reportIDs;

                                result.address = {};
                                result.address.county = data[z].Provider.County;

                                if( isNotEmpty(getNonNullData(data[z].Provider.StreetName, "")) && getNonNullData(data[z].Provider.StreetName, "") != "NA") {

                                    result.address.addressLine1 = getNonNullData(data[z].Provider.StreetNumber, "");
                                    result.address.addressLine1 +=  getNonNullData(data[z].Provider.StreetPreDirection, " ");
                                    result.address.addressLine1 +=  getNonNullData(data[z].Provider.StreetName, " ");
                                    result.address.addressLine1 +=  getNonNullData(data[z].Provider.StreetSuffix, " ");

                                } else {
                                    result.address.addressLine1 = "";
                                }

                                result.address.city = data[z].Provider.City;
                                result.address.state = data[z].Provider.State;
                                result.address.zip = data[z].Provider.ZipCode;
                                result.address.zip4 = getNonNullData(data[z].Provider.ZipPlus4, "");
                                result.address.fullAddress = getNonNullData(data[z].Provider.FullAddress, "");




                                result.location = {};
                                result.location.type = "Point";
                                result.location.coordinates = [];
                                result.location.coordinates.push(data[z].Provider.Longitude);
                                result.location.coordinates.push(data[z].Provider.Latitude);

                                result.phone = data[z].Provider.PhoneNumber;
                                result.program = data[z].Provider.ProgramType;
                                result.capacity = data[z].Provider.Capacity;
                                result.status = "active";
                                result.importDate = new Date();

                                if( data[z].Provider.OriginationDate != undefined && !isNaN(Date.parse(data[z].Provider.OriginationDate) )) {
                                    result.dateFounded = data[z].Provider.OriginationDate;
                                    result.origination_date = data[z].Provider.OriginationDate;
                                }

                                if( data[z].Provider.LicenseExpirationDate != undefined && !isNaN( Date.parse(data[z].Provider.LicenseExpirationDate) )){
                                    result.license = {};
                                    //result.license.legalId = data[z].Provider.AlternateProviderNumber;
                                    result.license.legalStatus = data[z].Provider.LicenseStatus;
                                    result.license.endDate = data[z].Provider.LicenseExpirationDate;
                                }


                                if(data[z].Provider.DisplayAddressOnWeb==false) {
                                    result.displayAddress = "N";
                                } else {
                                    result.displayAddress = "Y";
                                }

                                if(data[z].Provider.DisplayPhoneOnWeb==false) {
                                    result.displayPhone = "N";
                                } else {
                                    result.displayPhone = "Y";
                                }

                                result.operatingHours = {};
                                result.operatingHours.monday = data[z].Provider.MondayHours;
                                result.operatingHours.tuesday = data[z].Provider.TuesdayHours;
                                result.operatingHours.wednesday = data[z].Provider.WednesdayHours;
                                result.operatingHours.thursday = data[z].Provider.ThursdayHours;
                                result.operatingHours.friday = data[z].Provider.FridayHours;
                                result.operatingHours.saturday = data[z].Provider.SaturdayHours;
                                result.operatingHours.sunday = data[z].Provider.SundayHours;

                                result.openHours = {};

                                if(data[z].Provider.MondayHours)
                                    result.openHours.monday = data[z].Provider.MondayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.TuesdayHours)
                                    result.openHours.tuesday = data[z].Provider.TuesdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.WednesdayHours)
                                    result.openHours.wednesday = data[z].Provider.WednesdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.ThursdayHours)
                                    result.openHours.thursday = data[z].Provider.ThursdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.FridayHours)
                                    result.openHours.friday = data[z].Provider.FridayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.SaturdayHours)
                                    result.openHours.saturday = data[z].Provider.SaturdayHours.trim().split(/\s+/)[0];

                                if(data[z].Provider.SundayHours)
                                    result.openHours.sunday = data[z].Provider.SundayHours.trim().split(/\s+/)[0];

                                result.closeHours = {};
                                if(data[z].Provider.MondayHours)
                                    result.closeHours.monday = data[z].Provider.MondayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.TuesdayHours)
                                    result.closeHours.tuesday = data[z].Provider.TuesdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.WednesdayHours)
                                    result.closeHours.wednesday = data[z].Provider.WednesdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.ThursdayHours)
                                    result.closeHours.thursday = data[z].Provider.ThursdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.FridayHours)
                                    result.closeHours.friday = data[z].Provider.FridayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.SaturdayHours)
                                    result.closeHours.saturday = data[z].Provider.SaturdayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.SundayHours)
                                    result.closeHours.sunday = data[z].Provider.SundayHours.trim().split(/\s+/)[2];

                                if(data[z].Provider.Services) {
                                    result.services = data[z].Provider.Services;


                                    if (data[z].Provider.Services.indexOf("After School") !== -1) {
                                        result.afterschool = "Y";
                                    } else {
                                        result.afterschool = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Before School") !== -1) {
                                        result.beforeschool = "Y";
                                    } else {
                                        result.beforeschool = "N";
                                    }

                                    result.avgEducationRatings = 0;
                                    result.avgFacilitiesRatings = 0;
                                    result.avgOverAllRatings  =  0;
                                    result.avgSafetyRatings = 0;
                                    result.avgStaffRatings = 0;

                                    if (data[z].Provider.Services.indexOf("Drop In") !== -1) {
                                        result.dropins = "Y";
                                    } else {
                                        result.dropins = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Food Served") !== -1) {
                                        result.food = "Y";
                                        result.meals = "Y";
                                    } else {
                                        result.food = "N";
                                        result.meals = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Full Day") !== -1) {
                                        result.fullday = "Y";
                                    } else {
                                        result.fullday = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Half Day") !== -1) {
                                        result.halfday = "Y";
                                    } else {
                                        result.halfday = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Infant Care") !== -1) {
                                        result.infantcare = "Y";
                                    } else {
                                        result.infantcare = "N";
                                    }

                                    result.inspection_url = null;

                                    if (data[z].Provider.Services.indexOf("Night Care") !== -1) {
                                        result.nightcare = "Y";
                                    } else {
                                        result.nightcare = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Transportation") !== -1) {
                                        result.transportation = "Y";
                                    } else {
                                        result.transportation = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Weekend Care") !== -1) {
                                        result.weekend = "Y";
                                    } else {
                                        result.weekend = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("School Year Only") !== -1) {
                                        result.schoolyearonly = "Y";
                                    } else {
                                        result.schoolyearonly = "N";
                                    }

                                    if (data[z].Provider.Services.indexOf("Open Year-Round") !== -1) {
                                        result.openyearround = "Y";
                                    } else {
                                        result.openyearround = "N";
                                    }
                                }

                                if(data[z].Provider.GoldSealAccreditingAgency) {
                                    result.goldSeal = "Y";
                                } else {
                                    result.goldSeal = "N";
                                }

                                if(data[z].Provider.IsFaithBased==true) {
                                    result.faithbased = "Y";
                                } else {
                                    result.faithbased = "N";
                                }

                                if(data[z].Provider.IsReligiousExempt==true) {
                                    result.religiousExempt = "Y";
                                } else {
                                    result.religiousExempt = "N";
                                }

                                if(data[z].Provider.IsHeadStart==true) {
                                    result.headstart = "Y";
                                } else {
                                    result.headstart = "N";
                                }

                                if(data[z].Provider.IsOfferingSchoolReadiness==true) {
                                    result.schoolReadiness = "Y";
                                } else {
                                    result.schoolReadiness = "N";
                                }

                                result.history = [];

                                if(data[z].Provider.IsPublicSchool==true) {
                                    result.publicSchool = "Y";
                                } else {
                                    result.publicSchool = "N";
                                }

                                if(data[z].Provider.IsVPK==true) {
                                    result.vpk = "Y";
                                } else {
                                    result.vpk = "N";
                                }

                                result.goldSealAccreditation = {};
                                result.goldSealAccreditation.agency = data[z].Provider.GoldSealAccreditingAgency;
                                result.goldSealAccreditation.effectiveDate = data[z].Provider.GoldSealEffectiveDate;
                                result.goldSealAccreditation.expirationDate = data[z].Provider.GoldSealExpirationDate;
                                result.goldSealAccreditation.status = data[z].Provider.GoldSealStatusID;

                                result.type='daycare';
                                result.curriculum = [];
                                result.accreditations = [];
                                result.classes = [];
                                result.inspections = [];

                                if(data[z].VPKCurriculum && data[z].VPKCurriculum.length > 0){
                                    for(y=0; y<data[z].VPKCurriculum.length; y++ ){
                                        result.curriculum.push({
                                            "id":  data[z].VPKCurriculum[y].ID,
                                            "description":  data[z].VPKCurriculum[y].Description,
                                            "publisher":  data[z].VPKCurriculum[y].PublisherName
                                        });
                                    }
                                }

                                if(data[z].VPKAccreditation && data[z].VPKAccreditation.length > 0){
                                    for(y=0; y<data[z].VPKAccreditation.length; y++ ){
                                        result.accreditations.push({
                                            "id": data[z].VPKAccreditation[y].ID,
                                            "name": data[z].VPKAccreditation[y].Name,
                                            "effectiveDate": data[z].VPKAccreditation[y].EffectiveDate,
                                            "expirationDate": data[z].VPKAccreditation[y].ExpirationDate
                                        });
                                    }
                                }

                                if(data[z].VPKClass && data[z].VPKClass.length > 0){
                                    for(y=0; y<data[z].VPKClass.length; y++ ){
                                        result.classes.push({
                                            "id": data[z].VPKClass[y].ID,
                                            "classRoomCode": data[z].VPKClass[y].ClassRoomCode,
                                            "classType": data[z].VPKClass[y].ClassType,
                                            "startDate": data[z].VPKClass[y].StartDate,
                                            "endDate": data[z].VPKClass[y].EndDate,
                                            "monday": data[z].VPKClass[y].Monday,
                                            "tuesday": data[z].VPKClass[y].Tuesday,
                                            "wednesday": data[z].VPKClass[y].Wednesday,
                                            "thursday": data[z].VPKClass[y].Thursday,
                                            "friday": data[z].VPKClass[y].Friday,
                                            "saturday": data[z].VPKClass[y].Saturday,
                                            "sunday": data[z].VPKClass[y].Sunday,
                                            "classRoomCount": data[z].VPKClass[y].ClassRoomCount,
                                            "capacity": data[z].VPKClass[y].Capacity,
                                            "enrollments": data[z].VPKClass[y].Enrollments,
                                            "instructorCredential": data[z].VPKClass[y].InstructorCredential
                                        });
                                    }
                                }

                                if(data[z].Inspections && data[z].Inspections.length > 0){
                                    for(y=0; y<data[z].Inspections.length; y++ ){
                                        result.inspections.push({
                                            "id": data[z].Inspections[y].InspectionID,
                                            "hasViolation": data[z].Inspections[y].HasViolation,
                                            "inspectionDate": data[z].Inspections[y].InspectionDate
                                        });
                                    }
                                }

                                if(result.goldSeal == "Y" || result.accreditations.length > 0){
                                    result.accredited = "Y";
                                } else {
                                    result.accredited = "N";
                                }

                                result.logo = null;
                                result.parttime = null;
                                result.providerType = null;
                                result.questions = [];
                                result.totalReviews = 0;
                                result.website = 0;
                                result.imported = "Y";

                                if(data[z].Provider.Longitude && data[z].Provider.Latitude ) {
                                    result.location = {
                                        type: "Point",
                                        coordinates: [data[z].Provider.Longitude, data[z].Provider.Latitude]
                                    }
                                } else {
                                    result.location = null;
                                }


                                result.save(function (err) {
                                    if (err) {
                                        console.log("Error Updating: " + data[z].Provider.Name + " "  + err);
                                    }
                                    else {
                                        updateData++;
                                        updateDataPerState++;
                                    }
                                });
                            }
                        }

                    }
                });
            }, function (z) {
                stateSummary+= "["+state + "] state.  Processed [" +z + "] record(s). [Inserted:" + insertDataPerState +
                    " Updated:" + updateDataPerState + " Skip Public:" + skipPublicSchoolDataPerState +
                    " Skip Non Public:" + skipNonPublicSchoolDataPerState + " Skip Manage: " + skipManagedDataPerState +
                    " Skip Other: " + skipOtherDataPerState + "\n";

                var fs = require('fs');

                fs.rename(file, file + ".bak", function(err) {
                    if ( err ) console.log('ERROR: ' + err);
                });


            });
        } else {
            logger.info("Empty  Data for State: " + file + " [" + (i+1) + " of " + stateList.length + "]");
            missing++;

            var fs = require('fs');

            fs.rename(file, file + ".bak", function(err) {
                if ( err ) console.log('ERROR: ' + err);
            });
        }

    }, function (i) {
        var endProcess = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

        var path = '/var/ratings/' + d + '-imp_stats_ny.txt';
        var message  = stateSummary + "\n";
        message += "Total Number of records inserted : " + insertData +"\n";
        message += "Total Number of records updated : " + updateData +"\n";
        message += "Total Number of skipped public schools : " + skipPublicSchoolData +"\n";
        message += "Total Number of skipped non-public schools : " + skipNonPublicSchoolData +"\n";
        message += "Total Number of skipped other schools : " + skipOtherData +"\n";
        message += "Total Number of skipped manage data : " + skipManagedData +"\n";
        message += "Total Number of state processed : " + i + "\n";
        message += "Total Number of state missing : " + missing + "\n";
        message += "Start Date Processing : " + startProcess +"\n";
        message += "End Date Processing : " + endProcess ;

        fs.writeFile(path, message, 'utf8', function (error) {
            if (error) {
                logger.info("Write error:  " + error.message + " " + path);
            } else {
                logger.info("Successful Write to " + path);

            }
        });
        fs.close();
    });
}

procData.instance = null;
procData.getInstance = function(){
    if(this.instance === null)
        this.instance = new procData();
    return this.instance;
};
module.exports = procData.getInstance();

function getNonNullData(data, space){
    if(data){
        return space + data;
    } else {
        return "";
    }
}

function loopOnStateListWithDelay(theArray, delayAmount, i, theFunction, onComplete) {

    // logger.info("delayAmount in milleseconds " + delayAmount);

    if (i < theArray.length && typeof delayAmount == 'number') {

        //console.log("i " + i);

        theFunction(theArray[i], i);

        // setTimeout(function () {
        //
        //     loopOnStateListWithDelay(theArray, delayAmount, (i + 1), theFunction, onComplete)
        // }, delayAmount);
    } else {

        onComplete(i);
        /*
         * If the loop is complete
         * it will kill the process
         */
        process.exit();
    }
}


function loopOnDaycaresListWithDelay(theArray, delayAmount, i, theFunction, onComplete) {

    //logger.info("delayAmount in milleseconds " + delayAmount);

    if (i < theArray.length && typeof delayAmount == 'number') {

        //console.log("i " + i);

        theFunction(theArray[i], i);

        setTimeout(function () {

            loopOnDaycaresListWithDelay(theArray, delayAmount, (i + 1), theFunction, onComplete)
        }, delayAmount);
    } else {
        onComplete(i);

    }
}

function isNotEmpty(val){
    return (val === undefined || val == null || val.length <= 0) ? false : true;
}