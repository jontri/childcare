//# node insert_providers.js
var mongoose = require('mongoose');

mongoose.set('debug', true);
var path = require("path");
var connection = mongoose.connect("mongodb://127.0.0.1/databank");
var request = require('request');
var htmlparser = require("htmlparser2");
var request = require('request');
var fs = require('fs');
var dateFormat = require('dateformat');
var url = require('url');
const sendEmail = require('./webmail');
var mkdirp = require('mkdirp');
var winston = require('winston');
var zipCode ="";
var noDataZip ="";
var errorCode =""; 

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

var zipList = [
	'33234','33238','33239','33242','33243','33245','33247','33255',
	'33256','33257','33261','33265','33266','33269','33280','33283',
	'33296','33299','33301','33302','33303','33304','33305','33306',
	'33307','33308','33309','33310','33311','33312','33313','33314',
	'33315','33316','33317','33318','33319','33320','33321','33322',
	'33323','33324','33325','33326','33327','33328','33329','33330',
	'33331','33332','33334','33335','33336','33337','33338','33339',
	'33340','33345','33346','33348','33349','33351','33355','33359',
	'33388','33394','33401','33402','33403','33404','33405','33406',
	'33407','33408','33409','33410','33411','33412','33413','33414',
	'33415','33416','33417','33418','33419','33420','33421','33422',
	'33424','33425','33426','33427','33428','33429','33430','33431',
	'33432','33433','33434','33435','33436','33437','33438','33440',
	'33441','33442','33443','33444','33445','33446','33448','33449',
	'33454','33455','33458','33459','33460','33461','33462','33463',
	'33464','33465','33466','33467','33468','33469','33470','33471',
	'33472','33473','33474','33475','33476','33477','33478','33480',
	'33481','33482','33483','33484','33486','33487','33488','33493',
	'33496','33497','33498','33499','33503','33508','33509','33510',
	'33511','33513','33514','33521','33523','33524','33525','33526',
	'33527','33530','33534','33537','33538','33539','33540','33541',
	'33542','33543','33544','33545','33547','33548','33549','33550',
	'33556','33558','33559','33563','33564','33565','33566','33567',
	'33568','33569','33570','33571','33572','33573','33574','33575',
	'33576','33578','33579','33583','33584','33585','33586','33587',
	'33592','33593','33594','33595','33596','33597','33598','33601',
	'33602','33603','33604','33605','33606','33607','33608','33609',
	'33610','33611','33612','33613','33614','33615','33616','33617',
	'33618','33619','33620','33621','33622','33623','33624','33625',
	'33626','33629','33630','33631','33633','33634','33635','33637',
	'33646','33647','33650','33655','33660','33661','33662','33663',
	'33664','33672','33673','33674','33675','33677','33679','33680',
	'33681','33682','33684','33685','33686','33687','33688','33689',
	'33694','33701','33702','33703','33704','33705','33706','33707',
	'33708','33709','33710','33711','33712','33713','33714','33715',
	'33716','33729','33730','33731','33732','33733','33734','33736',
	'33737','33738','33740','33741','33742','33743','33744','33747',
	'33755','33756','33757','33758','33759','33760','33761','33762',
	'33763','33764','33765','33766','33767','33769','33770','33771',
	'33772','33773','33774','33775','33776','33777','33778','33779',
	'33780','33781','33782','33784','33785','33786','33801','33802',
	'33803','33804','33805','33806','33807','33809','33810','33811',
	'33812','33813','33815','33820','33823','33825','33826','33827',
	'33830','33831','33834','33835','33836','33837','33838','33839',
	'33840','33841','33843','33844','33845','33846','33847','33848',
	'33849','33850','33851','33852','33853','33854','33855','33856',
	'33857','33858','33859','33860','33862','33863','33865','33867'];

ctr=0;

console.log("Total No of Zipcodes to be processed: " + zipList.length);

var d = dateFormat(new Date(), "yyyy-mm-dd");

mkdirp('/var/ratings/' + d, function (err) {
    if (err)
        console.error(err);
    //else
    //    console.log('Directory Created: ' + 'tmp/ratingsville/' + d);
});

var logger = new(winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: '/var/ratings/'+d+'-2_export.log'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: '/var/ratings/'+d+'-2_export.log'
        })
    ]
});


var errorMessage="";
loopOnArrayWithDelay(zipList, 20000, 0, function (e, i) {
	ctr++;
	var total="";

	var zip = zipList[i];
	var myflfamiliespath = url.resolve('https://cares.myflfamilies.com','PublicSearch/Search?dcfSearchBox='+zip);

    logger.info("Crawling Zip code: " + zip  + " [" + i + " of " + zipList.length + "]");

	request({
    		uri: myflfamiliespath,
    		method: "POST",
    		timeout: 300000,
    		followRedirect: true,
    		maxRedirects: 10
		}, function (error, response, body) {
    			if (!error && response.statusCode == 200) {

    			    var dataFound = false;
        			var parser = new htmlparser.Parser({

            			onopentag: function(name, attribs){
                			if(name === "script"){

                			}
            			}, 
            			ontext: function(text){
                			if(text.indexOf("\{\"Data\":[{") !== -1){
                				
                                var data1 	= text.substring(text.indexOf("\{\"Data\":[{"));
                                var data2 	= data1.substring(9, data1.indexOf(",\"Total\"")-1);
                                var obj1 	= "["+data2+"]";

                                var obj		= JSON.stringify(obj1);
                                var jObj 	= JSON.parse(obj);

                    			var path 	= '/var/ratings/'+d+'/'+zip+'.json';
                                dataFound = true;
                                if (jObj.length > 0) {
                                    fs.writeFile(path, jObj, 'utf8', function (error) {
                                        if (error) {
                                            logger.error("Write error:  " + error.message + " " + path);
                                        } else {
                                        
                                        	if( text.indexOf(",\"Total\":")  !== -1 ){
                                				total= text.substring((text.indexOf(",\"Total\":") + 9), text.indexOf("\}},\"detailTemplate\":"));
											}
                                        
                                        	zipCode += " - "+zip+" ["+ total +"]" +"\n";
                                            logger.info("Successful Write to " + path);
                                        }
                                    });
                                } else {
                                	noDataZip += " - "+zip +"\n";
                                    logger.info("No data available for " + zip);
                                }                                
                        	}
                		}
        			}, {decodeEntities: true});


        			parser.write(body);
        			parser.done();
                    if(!dataFound){
                        noDataZip += " - "+zip +"\n";
                        logger.info("No data found for zip code: " + zip);
                    }


				} else {
					errorCode+=" - "+zip+"\n";
					errorMessage = error.message + ": " + zip + "\n" ;
        			sendEmail("ratingsville@gmail.com","Error : "+zip, "Failed Calling Service: " + errorMessage );
       				logger.error(errorMessage);
    			}  
		});
		
	},function (i) {
	   var path = '/var/ratings/' + d + '-2_exp_stats.txt';
	   var message = "[Processed zipcodes] : " + "\n";
	   	   message += zipCode + "\n";
	   	   message += "[No Data available] : " + "\n";
	   	   message += noDataZip + "\n";
	   	   message += "[Error zipcodes] : " + "\n";
	   	   message += errorCode + "\n";
	   	   	
	   fs.writeFile(path, message, 'utf8', function (error) {
			if (error) {
				logger.error("Write error:  " + error.message + " " + path);
            } else {
				logger.info("Successful Write to " + path);
			}
		});
	   fs.close();
	   logger.info("Looping thru Zip code list is done.");
	}	
);	



function loopOnArrayWithDelay(theArray, delayAmount, i, theFunction, onComplete) {
	
	// logger.info("delayAmount in milleseconds " + delayAmount);
		
    if (i < theArray.length && typeof delayAmount == 'number') {

        //console.log("i " + i);

        theFunction(theArray[i], i);

        setTimeout(function () {

            loopOnArrayWithDelay(theArray, delayAmount, (i + 1), theFunction, onComplete)
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
