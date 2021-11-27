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
	'33868','33870','33871','33872','33873','33875','33876','33877',
	'33880','33881','33882','33883','33884','33885','33888','33890',
	'33896','33897','33898','33901','33902','33903','33904','33905',
	'33906','33907','33908','33909','33910','33911','33912','33913',
	'33914','33915','33916','33917','33918','33919','33920','33921',
	'33922','33924','33927','33928','33929','33930','33931','33932',
	'33935','33936','33938','33944','33945','33946','33947','33948',
	'33949','33950','33951','33952','33953','33954','33955','33956',
	'33957','33960','33965','33966','33967','33970','33971','33972',
	'33973','33974','33975','33976','33980','33981','33982','33983',
	'33990','33991','33993','33994','34101','34102','34103','34104',
	'34105','34106','34107','34108','34109','34110','34112','34113',
	'34114','34116','34117','34119','34120','34133','34134','34135',
	'34136','34137','34138','34139','34140','34141','34142','34143',
	'34145','34146','34201','34202','34203','34204','34205','34206',
	'34207','34208','34209','34210','34211','34212','34215','34216',
	'34217','34218','34219','34220','34221','34222','34223','34224',
	'34228','34229','34230','34231','34232','34233','34234','34235',
	'34236','34237','34238','34239','34240','34241','34242','34243',
	'34250','34251','34260','34264','34265','34266','34267','34268',
	'34269','34270','34272','34274','34275','34276','34277','34278',
	'34280','34281','34282','34284','34285','34286','34287','34288',
	'34289','34290','34291','34292','34293','34295','34420','34421',
	'34423','34428','34429','34430','34431','34432','34433','34434',
	'34436','34441','34442','34445','34446','34447','34448','34449',
	'34450','34451','34452','34453','34460','34461','34464','34465',
	'34470','34471','34472','34473','34474','34475','34476','34477',
	'34478','34479','34480','34481','34482','34483','34484','34487',
	'34488','34489','34491','34492','34498','34601','34602','34603',
	'34604','34605','34606','34607','34608','34609','34610','34611',
	'34613','34614','34636','34637','34638','34639','34652','34653',
	'34654','34655','34656','34660','34661','34667','34668','34669',
	'34673','34674','34677','34679','34680','34681','34682','34683',
	'34684','34685','34688','34689','34690','34691','34692','34695',
	'34697','34698','34705','34711','34712','34713','34714','34715',
	'34729','34731','34734','34736','34737','34739','34740','34741',
	'34742','34743','34744','34745','34746','34747','34748','34749',
	'34753','34755','34756','34758','34759','34760','34761','34762',
	'34769','34770','34771','34772','34773','34777','34778','34785',
	'34786','34787','34788','34789','34797','34945','34946','34947',
	'34948','34949','34950','34951','34952','34953','34954','34956',
	'34957','34958','34972','34973','34974','34979','34981','34982',
	'34983','34984','34985','34986','34987','34988','34990','34991',
	'34992','34994','34995','34996','34997'];

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
            filename: '/var/ratings/'+d+'-3_export.log'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: '/var/ratings/'+d+'-3_export.log'
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
	   var path = '/var/ratings/' + d + '-3_exp_stats.txt';
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
