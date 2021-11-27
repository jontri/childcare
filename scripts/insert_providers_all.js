//# node insert_providers.js
var mongoose = require('mongoose');

var path = require("path");
var Listing = require(path.join(__dirname, "..", "models", "listing.js"));

mongoose.set('debug', true);
var connection = mongoose.connect("mongodb://127.0.0.1/databank");

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

Schema = mongoose.Schema;


var data = parseExcel();


loopOnArrayWithDelay(data, 400, 0, function (e, i) {

    Listing.findOne({
        uid: data[i]["ID"]
    }, function (err, result) {
        if (err) {
            next(err);
        } else {

            if (!result) {

                console.log( i + " Inserting record " + data[i]["ID"] );


                var listing = new Listing();

                listing.name = data[i]["Provider Name"];
                listing.uid = data[i]["ID"];

                listing.circuit = data[i]["Circuit"];

                listing.address = {};
                listing.address.county = data[i]["County"];
                listing.address.addressLine1 = data[i]["Physical Address"];
                listing.address.city = data[i]["City"];
                listing.address.state = data[i]["State"];
                listing.address.zip = data[i]["Zip"];

                listing.phone = data[i]["Phone"];
                // listing.altPhone = data[i]["ProvPh Alt"];
                // listing.fax = data[i]["Prov Fax"];
                listing.program = data[i]["Program"];
                listing.director = data[i]["Director"];
                listing.fgoldseal = data[i]["F-Gold Seal"];
                listing.capacity = data[i]["Capacity"];
                listing.email = data[i]["Email"];

                if( data[i]["Origination Date"] != undefined && !isNaN(Date.parse(data[i]["Origination Date"]) )) {
                    listing.dateFounded = data[i]["Origination Date"];
                }

                if( data[i]["License expiration"] != undefined && !isNaN( Date.parse(data[i]["License expiration"]) )){
                    listing.license = {};
                    listing.license.endDate = data[i]["License expiration"];
                }

                listing.openHours = {};

                if (data[i]["O-Sun"]!=undefined)
                    listing.openHours.sunday = data[i]["O-Sun"];
                else
                    listing.openHours.sunday = "";

                if (data[i]["O-Mon"]!=undefined)
                    listing.openHours.monday = data[i]["O-Mon"];
                else
                    listing.openHours.monday = "";

                if (data[i]["O-Tue"]!=undefined)
                    listing.openHours.tuesday = data[i]["O-Tue"];
                else
                    listing.openHours.tuesday = "";

                if (data[i]["O-Wed"]!=undefined)
                    listing.openHours.wednesday = data[i]["O-Wed"];
                else
                    listing.openHours.wednesday = "";

                if (data[i]["O-Thu"]!=undefined)
                    listing.openHours.thursday = data[i]["O-Thu"];
                else
                    listing.openHours.sunday = "";


                if (data[i]["O-Fri"]!=undefined)
                    listing.openHours.friday = data[i]["O-Fri"];
                else
                    listing.openHours.sunday = "";

                if (data[i]["O-Sat"]!=undefined)
                    listing.openHours.saturday = data[i]["O-Sat"];
                else
                    listing.openHours.sunday = "";

                listing.closeHours = {};
                if (data[i]["C-Sun"]!=undefined)
                    listing.closeHours.sunday = data[i]["C-Sun"];
                else
                    listing.openHours.sunday = "";

                if (data[i]["C-Mon"]!=undefined)
                    listing.closeHours.monday = data[i]["C-Mon"];
                else
                    listing.closeHours.monday = "";

                if (data[i]["C-Tue"]!=undefined)
                    listing.closeHours.tuesday = data[i]["C-Tue"];
                else
                    listing.closeHours.tuesday = "";

                if (data[i]["C-Wed"]!=undefined)
                    listing.closeHours.wednesday = data[i]["C-Wed"];
                else
                    listing.closeHours.wednesday = "";

                if (data[i]["C-Thu"]!=undefined)
                    listing.closeHours.thursday = data[i]["C-Thu"];
                else
                    listing.closeHours.thursday = "";

                if (data[i]["C-Fri"]!=undefined)
                    listing.closeHours.friday = data[i]["C-Fri"];
                else
                    listing.closeHours.friday = "";

                if (data[i]["C-Sat"]!=undefined)
                    listing.closeHours.saturday = data[i]["C-Sun"];
                else
                    listing.closeHours.saturday = "";

                ///console.log("Point 1");
                listing.services = data[i]["Services"];
                listing.goldSeal = data[i]["Gold Seal"];
                listing.faithbased = data[i]["Faith based"];
                listing.headstart = data[i]["Head Start"];
                listing.schoolReadiness = data[i]["School readiness"];
                listing.vpk = data[i]["VPK"];
                listing.afterschool = data[i]["After school"];
                listing.beforeschool = data[i]["Before school"];
                listing.dropins = data[i]["Drop-in"];
                listing.food = data[i]["Food"];
                listing.meals = data[i]["Food"];
                listing.fullday = data[i]["Full day"];
                listing.halfday = data[i]["Half day"];
                listing.infantcare = data[i]["Infant care"];
                listing.nightcare = data[i]["Night care"];
                listing.transportation = data[i]["Transportation"];
                listing.weekend = data[i]["Weekend care"];
                listing.schoolyearonly = data[i]["School year only"];
                listing.accrediting_agency = data[i]["Accrediting agency"];
                listing.special_notes = data[i]["Special notes"];
                listing.flag = data[i]["Flag"];
                listing.source = data[i]["Source"];

                listing.curriculum = [];
                if (data[i]["1-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["1-Curriculum name"]);
                if (data[i]["2-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["2-Curriculum name"]);
                if (data[i]["3-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["3-Curriculum name"]);
                if (data[i]["4-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["4-Curriculum name"]);
                if (data[i]["5-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["5-Curriculum name"]);
                if (data[i]["6-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["6-Curriculum name"]);
                if (data[i]["7-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["7-Curriculum name"]);
                if (data[i]["8-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["8-Curriculum name"]);
                if (data[i]["9-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["9-Curriculum name"]);
                if (data[i]["10-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["10-Curriculum name"]);
                if (data[i]["11-Curriculum name"]!=undefined)
                    listing.curriculum.push(data[i]["11-Curriculum name"]);

                listing.type='daycare';

                listing.save(function (err) {
                    if (err) {
                        console.log("Error Inserting : " + err);
                    }
                    else {
                        // console.log("Inserted: " + listing.uid);
                    }
                });

            } else {


                console.log( i + " Updating record " + data[i]["ID"] + " - " + data[i]["Provider Name"] );

                result.name = data[i]["Provider Name"];
                result.uid = data[i]["ID"];

                result.circuit = data[i]["Circuit"];

                result.address = {};
                result.address.county = data[i]["County"];
                result.address.addressLine1 = data[i]["Physical Address"];
                result.address.city = data[i]["City"];
                result.address.state = data[i]["State"];
                result.address.zip = data[i]["Zip"];

                result.phone = data[i]["Phone"];
                // result.altPhone = data[i]["ProvPh Alt"];
                // result.fax = data[i]["Prov Fax"];
                result.program = data[i]["Program"];
                result.director = data[i]["Director"];
                result.fgoldseal = data[i]["F-Gold Seal"];
                result.capacity = data[i]["Capacity"];
                result.email = data[i]["Email"];

                if( data[i]["Origination Date"] != undefined && !isNaN(Date.parse(data[i]["Origination Date"]) )) {
                    result.dateFounded = data[i]["Origination Date"];
                }

                if( data[i]["License expiration"] != undefined && !isNaN( Date.parse(data[i]["License expiration"]) )){
                    result.license = {};
                    result.license.endDate = data[i]["License expiration"];
                }

                result.openHours = {};

                if (data[i]["O-Sun"]!=undefined)
                    result.openHours.sunday = data[i]["O-Sun"];
                else
                    result.openHours.sunday = "";

                if (data[i]["O-Mon"]!=undefined)
                    result.openHours.monday = data[i]["O-Mon"];
                else
                    result.openHours.monday = "";

                if (data[i]["O-Tue"]!=undefined)
                    result.openHours.tuesday = data[i]["O-Tue"];
                else
                    result.openHours.tuesday = "";

                if (data[i]["O-Wed"]!=undefined)
                    result.openHours.wednesday = data[i]["O-Wed"];
                else
                    result.openHours.wednesday = "";

                if (data[i]["O-Thu"]!=undefined)
                    result.openHours.thursday = data[i]["O-Thu"];
                else
                    result.openHours.sunday = "";


                if (data[i]["O-Fri"]!=undefined)
                    result.openHours.friday = data[i]["O-Fri"];
                else
                    result.openHours.sunday = "";

                if (data[i]["O-Sat"]!=undefined)
                    result.openHours.saturday = data[i]["O-Sat"];
                else
                    result.openHours.sunday = "";

                result.closeHours = {};
                if (data[i]["C-Sun"]!=undefined)
                    result.closeHours.sunday = data[i]["C-Sun"];
                else
                    result.openHours.sunday = "";

                if (data[i]["C-Mon"]!=undefined)
                    result.closeHours.monday = data[i]["C-Mon"];
                else
                    result.closeHours.monday = "";

                if (data[i]["C-Tue"]!=undefined)
                    result.closeHours.tuesday = data[i]["C-Tue"];
                else
                    result.closeHours.tuesday = "";

                if (data[i]["C-Wed"]!=undefined)
                    result.closeHours.wednesday = data[i]["C-Wed"];
                else
                    result.closeHours.wednesday = "";

                if (data[i]["C-Thu"]!=undefined)
                    result.closeHours.thursday = data[i]["C-Thu"];
                else
                    result.closeHours.thursday = "";

                if (data[i]["C-Fri"]!=undefined)
                    result.closeHours.friday = data[i]["C-Fri"];
                else
                    result.closeHours.friday = "";

                if (data[i]["C-Sat"]!=undefined)
                    result.closeHours.saturday = data[i]["C-Sun"];
                else
                    result.closeHours.saturday = "";

                ///console.log("Point 1");
                result.services = data[i]["Services"];
                result.goldSeal = data[i]["State Quality Program"];
                result.faithbased = data[i]["Faith based"];
                result.headstart = data[i]["Head Start"];
                result.schoolReadiness = data[i]["School readiness"];
                result.vpk = data[i]["VPK"];
                result.afterschool = data[i]["After school"];
                result.beforeschool = data[i]["Before school"];
                result.dropins = data[i]["Drop-in"];
                result.food = data[i]["Food"];
                result.meals = data[i]["Food"];
                result.fullday = data[i]["Full day"];
                result.halfday = data[i]["Half day"];
                result.infantcare = data[i]["Infant care"];
                result.nightcare = data[i]["Night care"];
                result.transportation = data[i]["Transportation"];
                result.weekend = data[i]["Weekend care"];
                result.schoolyearonly = data[i]["School year only"];
                result.special_notes = data[i]["Special notes"];
                result.flag = data[i]["Flag"];
                result.source = data[i]["Source"];

                result.curriculum = [];
                if (data[i]["1-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["1-Curriculum name"]);
                if (data[i]["2-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["2-Curriculum name"]);
                if (data[i]["3-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["3-Curriculum name"]);
                if (data[i]["4-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["4-Curriculum name"]);
                if (data[i]["5-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["5-Curriculum name"]);
                if (data[i]["6-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["6-Curriculum name"]);
                if (data[i]["7-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["7-Curriculum name"]);
                if (data[i]["8-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["8-Curriculum name"]);
                if (data[i]["9-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["9-Curriculum name"]);
                if (data[i]["10-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["10-Curriculum name"]);
                if (data[i]["11-Curriculum name"]!=undefined)
                    result.curriculum.push(data[i]["11-Curriculum name"]);

                result.save(function (err) {
                    if (err) {
                        console.log("Error Updating: " + err);
                        exit(0);
                    }
                    else {
                        // console.log("Updated: " + result.uid);
                    }
                });

            }

        }
    });


}, function (i) {
    console.log("Loop done: Import data is done");
    return;
})


function loopOnArrayWithDelay(theArray, delayAmount, i, theFunction, onComplete) {

    if (i < theArray.length && typeof delayAmount == 'number') {

        //console.log("i " + i);

        theFunction(theArray[i], i);

        setTimeout(function () {

            loopOnArrayWithDelay(theArray, delayAmount, (i + 1), theFunction, onComplete)
        }, delayAmount);
    } else {

        onComplete(i);
    }
}

function parseExcel() {

    var xlsx = require('xlsx');

    var workbook = xlsx.readFile('./provider_new.xlsx', {header: 1});

    var sheet_name_list = workbook.SheetNames;
    var data = [];

    var rowCtr = 0;
    var colCtr = 0;

    sheet_name_list.forEach(function (sheetName) {
        var worksheet = workbook.Sheets[sheetName];


        var workSheetArray = xlsx.utils.sheet_to_row_object_array(worksheet);
        data = data.concat(workSheetArray);

        console.log(" Processing sheet:  : " + workSheetArray.length);


    });
    console.log("Parsed records: " + data.length);

    return data;

}