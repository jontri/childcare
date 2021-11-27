"use strict";
var html2pdf = function(){};

var Mustache = require('mustache');
var fs = require('fs');
var lo = require('lodash');
var path = require('path');
var htmlpdf = require('html-pdf');
var child_process = require('child_process');

var Document = require(path.join(__dirname, "..", "models", "document.js"));

var docsPath = path.join(__dirname, "..", "documents/pdf/");

html2pdf.createPdf = createPdf;
function createPdf(data,type,callback){

    console.log("CreatePdfData: "+JSON.stringify(data));

    if(type=='enrollment'){
        generateEnrollment(data,function(err,result){
            callback(err,result);
            return 0;
        });
    }else if(type=='emergencycard'){
        generateEmergencyCard(data,function(err,result){
            callback(err,result);
            return 0;
        });
    }else if(type=='medauth'){
        generateMedAuth(data,function(err,result){
            callback(err,result);
            return 0;
        });
    }

}

function generateEnrollment(data,callback){
    console.log("GeneratingEnrollment");
    var templatePath = path.join(__dirname,'..','documents','templates');
    var pdfOutPath = path.join(__dirname, "..", "documents", "pdf");
    var options = {
        "format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid 
        "orientation": "portrait",
        "base": 'file:///'+templatePath+'/', // ALWAYS CHANGE THIS TO THE LOCAL DIR LOCATION OF THE TEMPLATE
        "border":{
            "top": "10px",
            "bottom": "10px"
        },
        "type": "pdf"
    };

    var enrollTemplatePath = path.join(templatePath,'enrollmentApplication.html');

    fs.readFile( enrollTemplatePath, 'utf8', function(err, htmlTemplate) {
        if (err) throw err;

        var enrollTemplate = htmlTemplate.toString();
        var viewData = null;
        
        if(data){

            // add new fields extrapolated from immutable data received from db
            viewData = data;
            var birth = new Date(viewData.birth);
            viewData.birthString = getShortDate(birth);

            viewData.checkDay = getDays(viewData.careDay);

            viewData.checkMeal = getMeals(viewData.careMeal);

            viewData.careHourStartTxt = viewData.careHourStart;

            viewData.careHourEndTxt = viewData.careHourEnd;

            if( viewData.careHourStartTxt >12 ){
                if( viewData.careHourStartTxt >12 )viewData.careHourStartTxt -= 12;
                viewData.careHourStartTxt += ':00 PM';
            } else if( viewData.careHourStartTxt <12){
                viewData.careHourStartTxt += ':00 AM';
            }


            if( viewData.careHourEndTxt >12 ){
                if( viewData.careHourEndTxt >12 ) viewData.careHourEndTxt -= 12;
                viewData.careHourEndTxt += ':00 PM';
            } else if( viewData.careHourEndTxt <12){
                viewData.careHourEndTxt += ':00 AM';
            }


            var enrollTemplate_render = Mustache.render(enrollTemplate, viewData);
            var enrollTemplate_pdf_fileName = viewData.type+"_"+viewData.userId+"_"+viewData._id+"_" + viewData.version +".pdf";
            var enrollPdfOutPath = path.join(pdfOutPath,enrollTemplate_pdf_fileName);

            htmlpdf.create(enrollTemplate_render, options).toFile(enrollPdfOutPath, function(_err, _res) {
                if(_err){
                    callback(_err,null);
                    return 0;
                }
                callback(null,enrollTemplate_pdf_fileName);
                return 0;
            });

        }else{
            callback({error:"No Data. Document Not Saved."},null);
            return 0;
        }

    });

}

function generateEmergencyCard(data,callback){
    if(!data){
        callback({error:"No Data. Document Not Saved"},null);
        return 0;
    }
    console.log("GeneratingEmergencyCard");
    //console.log(data);
    var templateFileName = 'emergencyCard.html'
    var templateFilePath = path.join(__dirname,'..','documents','templates');
    var templateFile = path.join(templateFilePath,templateFileName)
    var templateFilePathTmp = path.join(templateFilePath,'emergencyCard_data.html');
    var templateFileStream = null;

    var generatedPdfFileName = '';
    var generatedPdfFile = '';
    var generatedPdfPath = path.join(__dirname, "..", "documents", "pdf");

    var options = {
        "format": "A4",
        "orientation": "portrait",
        "base": "file:///"+templateFilePath+'/',
        "border":{
            "top": "1px",
            "bottom": "1px",
            "left":"1px",
            "right":"1px",
        },
        "type": "pdf"
    };

    var viewData = null; // copy of immutable data with editable counterpart

    fs.readFile(templateFile, 'utf8', function(err, fileContent) {
        if (err) throw err;

        var templateFileStream = fileContent.toString();

        //console.log(templateFileStream);
        
        viewData = data;
        viewData.birthday = getShortDate(viewData.birth);
        // console.log("--> viewData");
        // console.log(viewData);
        var renderedHtml = Mustache.render(templateFileStream, viewData);

        fs.writeFile(templateFilePathTmp, renderedHtml, function(err,result){
            if (err) return console.log(err);
        });

        var template = renderedHtml.toString();

        generatedPdfFileName = 'emergencycard_'+viewData.userId+"_"+viewData._id+ "_" + viewData.version +'.pdf';
        generatedPdfFile = path.join(generatedPdfPath,generatedPdfFileName);

        console.log("Generated PDF File: " + generatedPdfFile);

        htmlpdf.create(template, options).toFile(generatedPdfFile, function(err, res) {
            if (err){
                callback(err,null)
            } 
            console.log(res);
            callback(null,generatedPdfFileName);
            return 0;
        });
    });

}

function generateMedAuth(data,callback){
    if(!data){
        callback({error:"No Data. Document Not Saved"},null);
        return 0;
    }
    console.log("GeneratingMedAuth");
    //console.log(data);
    var templateFileName = 'medauth.html'
    var templateFilePath = path.join(__dirname,'..','documents','templates');
    var templateFile = path.join(templateFilePath,templateFileName)
    var templateFilePathTmp = path.join(templateFilePath,'medauth_data.html');
    var templateFileStream = null;

    var generatedPdfFileName = '';
    var generatedPdfFile = '';
    var generatedPdfPath = path.join(__dirname, "..", "documents", "pdf");

    var options = {
        "format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid 
        "orientation": "portrait",
        "base": "file:///"+templateFilePath+'/',
        "border":{
            "top": "1px",
            "bottom": "1px",
            "left":"1px",
            "right":"1px",
        },
        "type": "pdf"
    };

    var viewData = null; // copy of immutable data with edittable counterpart
    fs.readFile(templateFile, 'utf8', function(err, fileContent) {
        if (err) throw err;

        var templateFileStream = fileContent.toString();

        //console.log(templateFileStream);
        
        viewData = data;

        viewData.age = getAge(viewData.birth);

        if(viewData.medicalData != null && viewData.medicalData.medication != null) {
            for(var index in viewData.medicalData.medication){
                if(viewData.medicalData.medication[index] != null && viewData.medicalData.medication[index].record != null){

                    var recordLen = viewData.medicalData.medication[index].record.length;

                    if(recordLen<7){
                        for (var i = (6-recordLen); i >= 0; i--) {
                            viewData.medicalData.medication[index].record.push({
                                amount:"\u2002",
                                time:"\u2002",
                                employee:"\u2002"
                            });
                        }

                    }
                }

            }
        }


        var renderedHtml = Mustache.render(templateFileStream, viewData);

        fs.writeFileSync(templateFilePathTmp, renderedHtml);

        var template = renderedHtml;
        generatedPdfFileName = "medauth_"+viewData.userId+"_"+viewData._id+"_" + viewData.version +".pdf";
        generatedPdfFile = path.join(generatedPdfPath,generatedPdfFileName);

        htmlpdf.create(template.toString(), options).toFile(generatedPdfFile, function(err, res) {
            if (err) {
                callback(err,null);
            }
            callback(null,generatedPdfFileName);
        });
    });

}

function getShortDate(data) {
    var date = new Date(data);
    var m = date.getMonth()+1;
    var d = date.getDate();
    var y = date.getFullYear();
    var s = (m + '/' + d + '/' + y).toString();
    return s;
}

function getDays(arr){
    var bitArr = [false,false,false,false,false,false,false];

    if(arr != null && arr.length() > 0){
        if(arr.indexOf('Monday')!=-1){
            bitArr[0] = true;
        }

        if(arr.indexOf('Tuesday')!=-1){
            bitArr[1] = true;
        }
        if(arr.indexOf('Wednesday')!=-1){
            bitArr[2] = true;
        }
        if(arr.indexOf('Thursday')!=-1){
            bitArr[3] = true;
        }
        if(arr.indexOf('Friday')!=-1){
            bitArr[4] = true;
        }
        if(arr.indexOf('Saturday')!=-1){
            bitArr[5] = true;
        }
        if(arr.indexOf('Sunday')!=-1){
            bitArr[6] = true;
        }
    }


    return bitArr;
}

function getMeals(arr){
    var bitArr = [false,false,false,false,false,false];

    if(arr != null && arr.length() > 0) {

        if (arr.indexOf('Breakfast') != -1) {
            bitArr[0] = true;
        }
        if (arr.indexOf('AM Snack') != -1) {
            bitArr[1] = true;
        }
        if (arr.indexOf('Lunch') != -1) {
            bitArr[2] = true;
        }
        if (arr.indexOf('PM Snack') != -1) {
            bitArr[3] = true;
        }
        if (arr.indexOf('Supper') != -1) {
            bitArr[4] = true;
        }
        if (arr.indexOf('Evening Snack') != -1) {
            bitArr[5] = true;
        }
    }

    return bitArr;
}

function getAge(d){
    var birthday = new Date(d);
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

html2pdf.getPrintPdf = getPrintPdf;

function getPrintPdf(filename, cb) {
    var execOpts = {
        cwd: docsPath
    };
    var filenameNoExt = path.basename(filename, '.pdf');
    var filenamePs = filenameNoExt + '.ps';
    var filenamePrintPdf = filenameNoExt + '_print.pdf';
    var cmdPdfToPs = 'pdf2ps ' + filename + ' ' + filenamePs;
    var cmdPsToPdf = 'ps2pdf ' + filenamePs + ' ' + filenamePrintPdf;

    var autoPrint = '%AUTOPRINT\n' +
        '[ /_objdef {PrintAction} /type /dict /OBJ pdfmark\n' +
        '[ {PrintAction} << /Type /Action /S /Named /N /Print >> /PUT pdfmark\n' +
        '[ {Catalog} << /OpenAction {PrintAction} >> /PUT pdfmark';

    // convert pdf to postscript
    var stdoutPdfToPs = child_process.execSync(cmdPdfToPs, execOpts);
    if (!stdoutPdfToPs.length) {
        // append auto print function
        fs.appendFile(path.join(docsPath, filenamePs), autoPrint, function(err) {
            if (err) {
                return cb(err);
            };

            // convert postscript back to pdf
            var stdoutPsToPdf = child_process.execSync(cmdPsToPdf, execOpts);
            if (!stdoutPsToPdf.length) {
                // remove the postscript file
                fs.unlink(path.join(docsPath, filenamePs), function(err) {
                    if (err) return cb(err);

                    cb(null, filenamePrintPdf);
                });
            } else {
                cb(stdoutPsToPdf.toString());
            }
        });
    } else {
        cb(stdoutPdfToPs.toString());
    }
}

module.exports = html2pdf;