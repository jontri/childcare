var path = require('path'),
    _ = require("lodash"),
    UnauthorizedAccessError = require(path.join(__dirname, "..", "errors", "unauthAccess.js")),
    fs = require('fs'),
    wkhtmltopdf = require('wkhtmltopdf'),
    phantom = require('phantom');

var Listing = require(path.join(__dirname, "..", "models", "listing.js"));
wkhtmltopdf.command = 'c:/wkhtmltopdf/bin/wkhtmltopdf.exe';
var HOST_SERVER = 'https://www.ratingsville.com/';

exports.createPdf = function(req, res, next) {
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "listing.pdf");
    var page_path = HOST_SERVER + '/#/download/' + req.query.listingId;
    var delay = 5000;
    console.log(req.query);

    phantom.create().then(function(ph) {
        ph.createPage().then(function(page) {
            page.open(page_path).then(function(status) {
                
                page.render(download_path).then(function() {
                    res.download(download_path);
                    console.log('Page Rendered');
                    ph.exit();
                });
            });
        });
    });

    // wkhtmltopdf(HOST_SERVER + '/#/download/5739bec877ad33501ea9bc01', { output: download_path })
}
exports.downloadPdf_emergencyCard = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Emergency card.pdf");
    res.download(download_path);
}
exports.downloadPdf_AccidentIncidentreport = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Accident_Incident report.pdf");
    res.download(download_path);
}
exports.downloadPdf_ApplicationforEnrollment = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Application for Enrollment.pdf");
    res.download(download_path);
}
exports.downloadPdf_AuthorizationForMedication = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Authorization For Medication.pdf");
    res.download(download_path);
}
exports.downloadPdf_FreeandReducedPriceMeal = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Free and Reduced-Price Meal Application and Child   Participation forms.pdf");
    res.download(download_path);
}
exports.downloadPdf_Infantfeeding = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Infant feeding form.pdf");
    res.download(download_path);
}
exports.downloadPdf_Infantfeeding = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Infant feeding form.pdf");
    res.download(download_path);
}
exports.downloadPdf_MedicalStatementandDietaryConditions = function(req,res,next){
    var download_path = path.join(__dirname, "..", "web/assets/pdfs/", "Medical Statement and Dietary Conditions.pdf");
    res.download(download_path);
}

exports.saveDaycaresFromUserRegistration = function(children) {
    for(var i=0; i < children.length; i++) {
        var listing = new Listing({name: ''});
        listing.address = children[i].daycare.address;
        if(!(_.isEmpty(children[i].daycare.name))) {
            listing.name = children[i].daycare.name;
        }
        listing.status = 'pending';
        listing.save(function(err) {
            if (err) {
                logger.info("Failed saving listing to MongoDB");
            } else {
                children[i].daycare.id = listing._id;
                logger.info("Successful saving listing to MongoDB");
            }
        });
    }
    return children;
}
