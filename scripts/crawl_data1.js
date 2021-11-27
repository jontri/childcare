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
	'32626','32627','32628','32631','32633','32634','32635','32639',
	'32640','32641','32643','32644','32648','32653','32654','32655',
	'32656','32658','32662','32663','32664','32666','32667','32668',
	'32669','32680','32681','32683','32686','32692','32693','32694',
	'32696','32697','32701','32702','32703','32704','32706','32707',
	'32708','32709','32710','32712','32713','32714','32715','32716',
	'32718','32719','32720','32721','32722','32723','32724','32725',
	'32726','32727','32728','32730','32732','32733','32735','32736',
	'32738','32739','32744','32745','32746','32747','32750','32751',
	'32752','32753','32754','32756','32757','32759','32762','32763',
	'32764','32765','32766','32767','32768','32771','32772','32773',
	'32774','32775','32776','32777','32778','32779','32780','32781',
	'32783','32784','32789','32790','32791','32792','32793','32794',
	'32795','32796','32798','32799','32801','32802','32803','32804',
	'32805','32806','32807','32808','32809','32810','32811','32812',
	'32814','32815','32816','32817','32818','32819','32820','32821',
	'32822','32824','32825','32826','32827','32828','32829','32830',
	'32831','32832','32833','32834','32835','32836','32837','32839',
	'32853','32854','32855','32856','32857','32858','32859','32860',
	'32861','32862','32867','32868','32869','32872','32877','32878',
	'32885','32886','32887','32891','32896','32897','32899','32901',
	'32902','32903','32904','32905','32906','32907','32908','32909',
	'32910','32911','32912','32919','32920','32922','32923','32924',
	'32925','32926','32927','32931','32932','32934','32935','32936',
	'32937','32940','32941','32948','32949','32950','32951','32952',
	'32953','32954','32955','32956','32957','32958','32959','32960',
	'32961','32962','32963','32964','32965','32966','32967','32968',
	'32969','32970','32971','32976','32978','33001','33002','33004',
	'33008','33009','33010','33011','33012','33013','33014','33015',
	'33016','33017','33018','33019','33020','33021','33022','33023',
	'33024','33025','33026','33027','33028','33029','33030','33031',
	'33032','33033','33034','33035','33036','33037','33039','33040',
	'33041','33042','33043','33045','33050','33051','33052','33054',
	'33055','33056','33060','33061','33062','33063','33064','33065',
	'33066','33067','33068','33069','33070','33071','33072','33073',
	'33074','33075','33076','33077','33081','33082','33083','33084',
	'33090','33092','33093','33097','33101','33102','33106','33109',
	'33111','33112','33114','33116','33119','33122','33124','33125',
	'33126','33127','33128','33129','33130','33131','33132','33133',
	'33134','33135','33136','33137','33138','33139','33140','33141',
	'33142','33143','33144','33145','33146','33147','33149','33150',
	'33151','33152','33153','33154','33155','33156','33157','33158',
	'33159','33160','33161','33162','33163','33164','33165','33166',
	'33167','33168','33169','33170','33172','33173','33174','33175',
	'33176','33177','33178','33179','33180','33181','33182','33183',
	'33184','33185','33186','33187','33188','33189','33190','33193',
	'33194','33196','33197','33199','33206','33222','33231','33233'];

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
            filename: '/var/ratings/'+d+'-1_export.log'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: '/var/ratings/'+d+'-1_export.log'
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
	   var path = '/var/ratings/' + d + '-1_exp_stats.txt';
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
