# README #

This README would normally document whatever steps are necessary to get your application up and running.

### What is this repository for? ###

* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

1.  Check out the code from repository https://<username>@bitbucket.org/ratingsville/wecare.git
2.  Install Node.js - http://blog.teamtreehouse.com/install-node-js-npm-windows 
3.  In <root_directory of checkout code> - run “npm install”   then “npm install async” then “npm install express” then "bower install" - "npm install nvd3" - "bower install angular-nvd3" -npm install angular-nvd3 - "npm install angular-ui-bootstrap" - "bower install angular-bootstrap" 
4.  Install MongoDB and Redis (look online on steps).  For users new to MongoDB, refer to "MongoDB installation.txt" for detailed installation/set-up instrcutions.  Experienced MongoDB users can use set-up instructions outlined below (these are also mentioned in the above referenced "MongoDB installation.txt" file)
5.  Start MongoDB and Redis (look online on steps)
6.  Install nodemon
7.  Execute  "npm install gulp -g" then "npm install gulp" and "gulp inject:dev" and "bower install vs-google-autocomplete"
8.  In <root_directory of checkout code> - run “npm start”  You should see  below:   Go ahead and visit http://localhost:8085/
9.  In <root_directory of checkout code> - run git config user.name “Johnny<ask me> Ruiz”  and git config user.email “jontri.ruiz@yahoo.com"
* “info: Web Server listening at  http://localhost:8085/”

### Extra steps for installation 
1. Run db.getCollection('listings').createIndex({location:"2dsphere"})
2. Go to scripts folder
3. Study how the create_user.js works and create an admin account 


### Add security user in mongo db

1. Create admin user

	use admin

	db.createUser(
	  {
		user: "ratingsville",
		pwd: "r4tingsvill3",
		roles: [ { role: "userAdminAnyDatabase", db: "admin" }, {role:"readWrite", db:"admin"}, {role:"readWrite", db:"databank"} ]
	  }
	)
		
2. Enable Authentication by editing /etc/mongod.conf make sure below is correct	
	
	net:
	  port: 27017
	  bindIp: 127.0.0.1,162.209.99.153

	security:
	  authorization: enabled

3. Restart mongodb 

4. Connect as admin  
	  mongo -u ratingsville -p r4tingsvill3 --authenticationDatabase admin
	  
5. Verify that you can view records in databank as the new user 
	  show dbs

6. Enable UFW in Server
	  sudo ufw status  
	  
7. Note: If the output indicates that the firewall is inactive, activate it with: 
      sudo ufw enable
	  sudo ufw allow OpenSSH
	  sudo ufw allow from client_ip_address to any port 27017
	  
8. Connect remotely from client machine 
      mongo -u ratingsville -p r4tingsvill3 --authenticationDatabase admin --host 162.209.99.153
	  

### Backing up database 
* mongodump -d databank -o ~/backups/databank --username ratingsville --password rx4tingsvill3x --authenticationDatabase admin

### Exporting Listing Table
* mongoexport --db databank --username ratingsville --password rx4tingsvill3x --authenticationDatabase admin --collection listings --out listings.json

### Importing Listing Table
* mongoimport --db databank --username ratingsville --password rx4tingsvill3x --authenticationDatabase admin --collection listings --file listings.json

### Other Notes
* To export Mongo data into CSV - mongoexport --host localhost --db databank --collection listings --csv --out listing.csv --fields name, cost, ageLimit.minAge, license.legalStatus, address.addressLine1, address.city, address.state, address.zip, overAllRatings, schoolyearonly, nightmare, halfday, vpk, goldSeal, headstart, dropping, beforeschool, afterschool, meals, transportation, weekend  

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact