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
	'32003','32004','32006','32007','32008','32009','32011','32013',
	'32024','32025','32026','32030','32033','32034','32035','32038',
	'32040','32041','32042','32043','32044','32046','32050','32052',
	'32053','32054','32055','32056','32058','32059','32060','32061',
	'32062','32063','32064','32065','32066','32067','32068','32071',
	'32072','32073','32079','32080','32081','32082','32083','32084',
	'32085','32086','32087','32091','32092','32094','32095','32096',
	'32097','32099','32102','32105','32110','32111','32112','32113',
	'32114','32115','32116','32117','32118','32119','32120','32121',
	'32122','32123','32124','32125','32126','32127','32128','32129',
	'32130','32131','32132','32133','32134','32135','32136','32137',
	'32138','32139','32140','32141','32142','32143','32145','32147',
	'32148','32149','32157','32158','32159','32160','32162','32163',
	'32164','32168','32169','32170','32173','32174','32175','32176',
	'32177','32178','32179','32180','32181','32182','32183','32185',
	'32187','32189','32190','32192','32193','32195','32198','32201',
	'32202','32203','32204','32205','32206','32207','32208','32209',
	'32210','32211','32212','32214','32216','32217','32218','32219',
	'32220','32221','32222','32223','32224','32225','32226','32227',
	'32228','32229','32231','32232','32233','32234','32235','32236',
	'32237','32238','32239','32240','32241','32244','32245','32246',
	'32247','32250','32254','32255','32256','32257','32258','32259',
	'32260','32266','32277','32301','32302','32303','32304','32305',
	'32306','32307','32308','32309','32310','32311','32312','32313',
	'32314','32315','32316','32317','32318','32320','32321','32322',
	'32323','32324','32326','32327','32328','32329','32330','32331',
	'32332','32333','32334','32335','32336','32337','32340','32341',
	'32343','32344','32345','32346','32347','32348','32350','32351',
	'32352','32353','32355','32356','32357','32358','32359','32360',
	'32361','32362','32395','32399','32401','32402','32403','32404',
	'32405','32406','32407','32408','32409','32410','32411','32412',
	'32413','32417','32420','32421','32422','32423','32424','32425',
	'32426','32427','32428','32430','32431','32432','32433','32434',
	'32435','32437','32438','32439','32440','32442','32443','32444',
	'32445','32446','32447','32448','32449','32452','32455','32456',
	'32457','32459','32460','32461','32462','32463','32464','32465',
	'32466','32501','32502','32503','32504','32505','32506','32507',
	'32508','32509','32511','32512','32513','32514','32516','32520',
	'32521','32522','32523','32524','32526','32530','32531','32533',
	'32534','32535','32536','32537','32538','32539','32540','32541',
	'32542','32544','32547','32548','32549','32550','32559','32560',
	'32561','32562','32563','32564','32565','32566','32567','32568',
	'32569','32570','32571','32572','32577','32578','32579','32580',
	'32583','32588','32591','32601','32602','32603','32604','32605',
	'32606','32607','32608','32609','32610','32611','32612','32614',
	'32615','32616','32617','32618','32619','32621','32622','32625']

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
            filename: '/var/ratings/'+d+'-0_export.log'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: '/var/ratings/'+d+'-0_export.log'
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
	   var path = '/var/ratings/' + d + '-0_exp_stats.txt';
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
