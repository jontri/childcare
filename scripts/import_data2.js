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
var zipCode = "";

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

var procData = function procData(){

var zipList = [
    '33126', '33127', '33128', '33129', '33130', '33131', '33132', '33133',
    '33134', '33135', '33136', '33137', '33138', '33139', '33140', '33141',
    '33142', '33143', '33144', '33145', '33146', '33147', '33149', '33150',
    '33151', '33152', '33153', '33154', '33155', '33156', '33157', '33158',
    '33159', '33160', '33161', '33162', '33163', '33164', '33165', '33166',
    '33167', '33168', '33169', '33170', '33172', '33173', '33174', '33175',
    '33176', '33177', '33178', '33179', '33180', '33181', '33182', '33183',
    '33184', '33185', '33186', '33187', '33188', '33189', '33190', '33193',
    '33194', '33196', '33197', '33199', '33206', '33222', '33231', '33233',
    '33234', '33238', '33239', '33242', '33243', '33245', '33247', '33255',
    '33256', '33257', '33261', '33265', '33266', '33269', '33280', '33283',
    '33296', '33299', '33301', '33302', '33303', '33304', '33305', '33306',
    '33307', '33308', '33309', '33310', '33311', '33312', '33313', '33314',
    '33315', '33316', '33317', '33318', '33319', '33320', '33321', '33322',
    '33323', '33324', '33325', '33326', '33327', '33328', '33329', '33330',
    '33331', '33332', '33334', '33335', '33336', '33337', '33338', '33339',
    '33340', '33345', '33346', '33348', '33349', '33351', '33355', '33359',
    '33388', '33394', '33401', '33402', '33403', '33404', '33405', '33406',
    '33407', '33408', '33409', '33410', '33411', '33412', '33413', '33414',
    '33415', '33416', '33417', '33418', '33419', '33420', '33421', '33422',
    '33424', '33425', '33426', '33427', '33428', '33429', '33430', '33431',
    '33432', '33433', '33434', '33435', '33436', '33437', '33438', '33440',
    '33441', '33442', '33443', '33444', '33445', '33446', '33448', '33449',
    '33454', '33455', '33458', '33459', '33460', '33461', '33462', '33463',
    '33464', '33465', '33466', '33467', '33468', '33469', '33470', '33471',
    '33472', '33473', '33474', '33475', '33476', '33477', '33478', '33480',
    '33481', '33482', '33483', '33484', '33486', '33487', '33488', '33493',
    '33496', '33497', '33498', '33499', '33503', '33508', '33509', '33510',
    '33511', '33513', '33514', '33521', '33523', '33524', '33525', '33526',
    '33527', '33530', '33534', '33537', '33538', '33539', '33540', '33541',
    '33542', '33543', '33544', '33545', '33547', '33548', '33549', '33550',
    '33556', '33558', '33559', '33563', '33564', '33565', '33566', '33567',
    '33568', '33569', '33570', '33571', '33572', '33573', '33574', '33575',
    '33576', '33578', '33579', '33583', '33584', '33585', '33586', '33587',
    '33592', '33593', '33594', '33595', '33596', '33597', '33598', '33601',
    '33602', '33603', '33604', '33605', '33606', '33607', '33608', '33609',
    '33610', '33611', '33612', '33613', '33614', '33615', '33616', '33617',
    '33618', '33619', '33620', '33621', '33622', '33623', '33624', '33625',
    '33626', '33629', '33630', '33631', '33633', '33634', '33635', '33637',
    '33646', '33647', '33650', '33655', '33660', '33661', '33662', '33663',
    '33664', '33672', '33673', '33674', '33675', '33677', '33679', '33680',
    '33681', '33682', '33684', '33685', '33686', '33687', '33688', '33689',
    '33694', '33701', '33702', '33703', '33704', '33705', '33706', '33707',
    '33708', '33709', '33710', '33711', '33712', '33713', '33714', '33715',
    '33716', '33729', '33730', '33731', '33732', '33733', '33734', '33736',
    '33737', '33738', '33740', '33741', '33742', '33743', '33744', '33747',
    '33755', '33756', '33757', '33758', '33759', '33760', '33761', '33762',
    '33763', '33764', '33765', '33766', '33767', '33769', '33770', '33771',
    '33772', '33773', '33774', '33775', '33776', '33777', '33778', '33779',
    '33780', '33781', '33782', '33784', '33785', '33786', '33801', '33802',
    '33803', '33804', '33805', '33806', '33807', '33809', '33810', '33811',
    '33812', '33813', '33815', '33820', '33823', '33825', '33826', '33827',
    '33830', '33831', '33834', '33835', '33836', '33837', '33838', '33839',
    '33840', '33841', '33843', '33844', '33845', '33846', '33847', '33848',
    '33849', '33850', '33851', '33852', '33853', '33854', '33855', '33856',
    '33857', '33858', '33859', '33860', '33862', '33863', '33865', '33867',
    '33868', '33870', '33871', '33872', '33873', '33875', '33876', '33877',
    '33880', '33881', '33882', '33883', '33884', '33885', '33888', '33890',
    '33896', '33897', '33898', '33901', '33902', '33903', '33904', '33905',
    '33906', '33907', '33908', '33909', '33910', '33911', '33912', '33913',
    '33914', '33915', '33916', '33917', '33918', '33919', '33920', '33921',
    '33922', '33924', '33927', '33928', '33929', '33930', '33931', '33932',
    '33935', '33936', '33938', '33944', '33945', '33946', '33947', '33948',
    '33949', '33950', '33951', '33952', '33953', '33954', '33955', '33956',
    '33957', '33960', '33965', '33966', '33967', '33970', '33971', '33972',
    '33973', '33974', '33975', '33976', '33980', '33981', '33982', '33983',
    '33990', '33991', '33993', '33994', '34101', '34102', '34103', '34104',
    '34105', '34106', '34107', '34108', '34109', '34110', '34112', '34113',
    '34114', '34116', '34117', '34119', '34120', '34133', '34134', '34135',
    '34136', '34137', '34138', '34139', '34140', '34141', '34142', '34143',
    '34145', '34146', '34201', '34202', '34203', '34204', '34205', '34206',
    '34207', '34208', '34209', '34210', '34211', '34212', '34215', '34216',
    '34217', '34218', '34219', '34220', '34221', '34222', '34223', '34224',
    '34228', '34229', '34230', '34231', '34232', '34233', '34234', '34235',
    '34236', '34237', '34238', '34239', '34240', '34241', '34242', '34243',
    '34250', '34251', '34260', '34264', '34265', '34266', '34267', '34268',
    '34269', '34270', '34272', '34274', '34275', '34276', '34277', '34278',
    '34280', '34281', '34282', '34284', '34285', '34286', '34287', '34288',
    '34289', '34290', '34291', '34292', '34293', '34295', '34420', '34421',
    '34423', '34428', '34429', '34430', '34431', '34432', '34433', '34434',
    '34436', '34441', '34442', '34445', '34446', '34447', '34448', '34449',
    '34450', '34451', '34452', '34453', '34460', '34461', '34464', '34465',
    '34470', '34471', '34472', '34473', '34474', '34475', '34476', '34477',
    '34478', '34479', '34480', '34481', '34482', '34483', '34484', '34487',
    '34488', '34489', '34491', '34492', '34498', '34601', '34602', '34603',
    '34604', '34605', '34606', '34607', '34608', '34609', '34610', '34611',
    '34613', '34614', '34636', '34637', '34638', '34639', '34652', '34653',
    '34654', '34655', '34656', '34660', '34661', '34667', '34668', '34669',
    '34673', '34674', '34677', '34679', '34680', '34681', '34682', '34683',
    '34684', '34685', '34688', '34689', '34690', '34691', '34692', '34695',
    '34697', '34698', '34705', '34711', '34712', '34713', '34714', '34715',
    '34729', '34731', '34734', '34736', '34737', '34739', '34740', '34741',
    '34742', '34743', '34744', '34745', '34746', '34747', '34748', '34749',
    '34753', '34755', '34756', '34758', '34759', '34760', '34761', '34762',
    '34769', '34770', '34771', '34772', '34773', '34777', '34778', '34785',
    '34786', '34787', '34788', '34789', '34797', '34945', '34946', '34947',
    '34948', '34949', '34950', '34951', '34952', '34953', '34954', '34956',
    '34957', '34958', '34972', '34973', '34974', '34979', '34981', '34982',
    '34983', '34984', '34985', '34986', '34987', '34988', '34990', '34991',
    '34992', '34994', '34995', '34996', '34997'];

    //ctr = 0;

    console.log("Total Number of Zipcodes to be processed: " + zipList.length);

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
                filename: '/var/ratings/' + d + '-import.log'
            })
        ],
        exceptionHandlers: [
            new winston.transports.File({
                filename: '/var/ratings/' + d + '-import.log'
            })
        ]
    });

    var startProcess = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

    loopOnZipCodeListWithDelay(zipList, 5000, 0, function (e, i) {

        var zip = zipList[i];
        var file = '/var/ratings/' +d+ '/'  + zip + ".json";
        var jsonData = null;

        try {
            jsonData = json.read(file);
        }catch(e){
            logger.info("File don't exist                                                                                                                                                                                                                                                                                                                                                                                            w qew: " + file + " [" + i + " of " + zipList.length + "]");
        }

        var insertDataPerZip = 0;
        var updateDataPerZip = 0;
        var skipPublicSchoolDataPerZip = 0;
        var skipNonPublicSchoolDataPerZip = 0;
        var skipOtherDataPerZip=0;
        var skipManagedDataPerZip=0;

        if(isNotEmpty(jsonData) &&  isNotEmpty(jsonData.data)){

            var data = jsonData.data;

            logger.info("Importing  Data for Zipcode: " + file + " [" + data.length + "]" + " [" + i + " of " + zipList.length + "]");


            loopOnDaycaresListWithDelay(data, 10, 0, function (e, z) {

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
                                    skipPublicSchoolDataPerZip++;
                                } else if(data[z].Provider.ProgramType == "Non-Public School"){
                                    skipNonPublicSchoolData++;
                                    skipNonPublicSchoolDataPerZip++;
                                } else {
                                    skipOtherData++;
                                    skipOtherDataPerZip++;
                                }

                            } else {

                                logger.info( z + " Inserting record " + data[z].Provider.Name );

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
                                listing.description = null;

                                // listing.accrediting_agency = data[z].Provider.["Accrediting agency"];
                                listing.accrediting_agency = null;
                                // listing.special_notes = data[z].Provider.["Special notes"];
                                listing.special_notes = null;
                                // listing.flag = data[z].Provider.["Flag"];
                                listing.flag = null;

                                listing.source = "https://cares.myflfamilies.com/PublicSearch";

                                listing.address = {};
                                listing.address.county = data[z].Provider.County;

                                if( isNotEmpty(getNonNullData(data[z].Provider.StreetName, "")) && getNonNullData(data[z].Provider.StreetName, "") != "NA") {

                                    listing.address.addressLine1 = getNonNullData(data[z].Provider.StreetNumber, "");
                                    listing.address.addressLine1 += getNonNullData(data[z].Provider.StreetPreDirection, " ");
                                    listing.address.addressLine1 += getNonNullData(data[z].Provider.StreetName, " ");
                                    listing.address.addressLine1 += getNonNullData(data[z].Provider.StreetSuffix, " ");

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
                                        insertDataPerZip++;
                                    }
                                });


                            }


                        } else {


                            logger.info( i + " Updating record " + data[z].Provider.Name + " [" + i + " of " + zipList.length + "]" );

                            if(result.managed && result.managed=="Y"){
                                logger.info("Skipping update of managed Provider: " + data[z].Provider.Name);
                                skipManagedData++;
                                skipManagedDataPerZip++;
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
                                result.description = null;

                                // result.accrediting_agency = data[z].Provider.["Accrediting agency"];
                                result.accrediting_agency = null;
                                // result.special_notes = data[z].Provider.["Special notes"];
                                result.special_notes = null;
                                result.flag = null;

                                result.source = "https://cares.myflfamilies.com/PublicSearch";

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

                                // if(data[z].Provider.Longitude && data[z].Provider.Latitude ) {
                                //     result.location = {
                                //         type: "Point",
                                //         coordinates: [data[z].Provider.Longitude, data[z].Provider.Latitude]
                                //     }
                                // } else {
                                //     result.location = null;
                                // }


                                result.save(function (err) {
                                    if (err) {
                                        console.log("Error Updating: " + data[z].Provider.Name + " "  + err);
                                    }
                                    else {
                                        updateData++;
                                        updateDataPerZip++;
                                    }
                                });
                            }
                        }

                    }
                });
            }, function (z) {
                zipCode += "["+zip + "] zipcode.  Processed [" +z + "] record(s). [Inserted:" + insertDataPerZip +
                    " Updated:" + updateDataPerZip + " Skip Public:" + skipPublicSchoolDataPerZip +
                    " Skip Non Public:" + skipNonPublicSchoolDataPerZip + " Skip Manage: " + skipManagedDataPerZip +
                    " Skip Other: " + skipOtherDataPerZip + "\n";

                var fs = require('fs');
                fs.rename(file, file + ".bak", function(err) {
                    if ( err ) console.log('ERROR: ' + err);
                });
            });
        } else {
            logger.info("Empty  Data for Zipcode: " + file + " [" + i + " of " + zipList.length + "]");

            var fs = require('fs');
            fs.rename(file, file + ".bak", function(err) {
                if ( err ) console.log('ERROR: ' + err);
            });
        }

    }, function (i) {
        var endProcess = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

        var path = '/var/ratings/' + d + '-imp_stats.txt';
        var message  = zipCode + "\n";
        message += "Total Number of records inserted : " + insertData +"\n";
        message += "Total Number of records updated : " + updateData +"\n";
        message += "Total Number of skipped public schools : " + skipPublicSchoolData +"\n";
        message += "Total Number of skipped non-public schools : " + skipNonPublicSchoolData +"\n";
        message += "Total Number of skipped other schools : " + skipOtherData +"\n";
        message += "Total Number of skipped manage data : " + skipManagedData +"\n";
        message += "Total Number of files processed : " + i + "\n";
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

function loopOnZipCodeListWithDelay(theArray, delayAmount, i, theFunction, onComplete) {

    // logger.info("delayAmount in milleseconds " + delayAmount);

    if (i < theArray.length && typeof delayAmount == 'number') {

        //console.log("i " + i);

        theFunction(theArray[i], i);

        setTimeout(function () {

            loopOnZipCodeListWithDelay(theArray, delayAmount, (i + 1), theFunction, onComplete)
        }, delayAmount);
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