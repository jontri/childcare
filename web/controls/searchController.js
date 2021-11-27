(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('searchCtrl', searchCtrl);

    searchCtrl.$inject = [
        '$scope', '$rootScope','$cookies', '$http','searchService', '$state', '$stateParams','reviewService', 'stateService','AuthService','userService','appointmentService','ownershipService','hackService','$timeout',
        'yNToBoolFilter','COMMON', 'addressFormatterFilter', '$window'
    ];

    function searchCtrl( $scope, $rootScope,$cookies, $http, searchService, $state, $stateParams,reviewService, stateService, AuthService,userService,appointmentService,ownershipService,hackService,$timeout,
        yNToBoolFilter, COMMON, addressFormatterFilter, $window) {
        var vm = this;
        var state = $state.current.name;
        var currentParams;

		//get user info
		vm.userInfo = AuthService.getUser();
        vm.isPhoneVerified = AuthService.isPhoneVerified();
        vm.isAuthenticated = AuthService.isAuthenticated();
		//update ui
		$(".form-search-list").css('margin-top','3%');
		$(".form-search-list").css('margin-bottom','2%');
		
        vm.search = search;
        vm.keyword = '';
        vm.city = '';
        vm.state = '';
        vm.zip = '';
		vm.county = '';
        vm.fullAddress = '';
		vm.within="20";
		vm.daycare = '';
        vm.limit = 10;
        vm.pages = 0;
        
        vm.sortBy = 'name_az';
        vm.sortName = 'Name (A-Z)'
        vm.sortOrder = "1";
        vm.location = '';
		vm.searchKeyword ='';
        vm.schoolyearonly = '';
        vm.weekend = '';
        vm.faithbased = '';
        vm.accredited = '';
        vm.headstart = '';
        vm.nightcare = '';
        vm.dropins = '';
        vm.beforeschool = '';
        vm.afterschool = '';
        vm.meals = '';
        vm.transportation = '';
        vm.goldSeal = '';
        vm.vpk = '';
        vm.schoolReadiness = '';
        vm.searchResult = null;
		
		vm.sorting =null;
        vm.topPosY = 0;
        vm.isParent = false;
        vm.isProvider = false;
        vm.isAdmin = false;
        vm.isAuthenticated = false;

        vm.updateFavorite = false;

        var selectedFavoriteCount = 0;

		
		vm.filters = [
            {
                code: 'coverage',
                name: 'Coverage',
                collapse: false,
                values: [
                    {data:'weekend', description:'Weekend'},
                    {data:'nightcare', description:'Night'},
                    {data:'halfday', description:'Half Day'},
                    {data:'fullday', description:'Full Day'},
                    {data:'parttime', description:'Part Time'},
                    {data:'schoolyearonly', description:'School Year Only'},
                    {data:'infantcare', description:'Infant'}
                ], 
                modal:'#modalCoverage'
            },
            {
                code: 'service',
                name: 'Service options',
                collapse: false,
                values: [
                    {data:'dropins', description:'Drop-In'},
                    {data:'beforeschool', description:'Before School'},
                    {data:'afterschool', description:'After School'},
                    {data:'meals',description:'Food Served'},
                    {data:'transportation', description:'Transportation'}
                ], 
                modal:'#modalServiceOptions'
            },
			{
			    code: 'overAllRatings',
                name: 'Rating',
                collapse: false,
                values: [
                    {data:'1',description:'1 & up'},
                    {data:'2',description:'2 & up'},
                    {data:'3',description:'3 & up'},
                    {data:'4',description:'4 & up'},
                    {data:'5',description:'5 & up'}

                ]
            },
			{
			    code: 'others',
				name:'Other features',
                collapse: false,
				values:[
                    {data:'faithbased', description:'Faith Based'},
                    {data:'accredited', description:'Accredited'},
                    {data:'headstart', description:'Head Start'},
                    {data:'goldSeal', description:'State Quality Program'},
                    {data:'vpk', description:'Pre-K'},
                    {data:'schoolReadiness', description:'School Readiness'}
				], 
                modal:'#modalOtherFeatures'
			}
        ];
        vm.loadingStatus = "idle";
        vm.reviewsByUser = []; // list of reviews by the user;

        onLoad();


        function onLoad() {
            console.log("search_ctrl_onLoad");
            // reload user details
            vm.userInfo = AuthService.getUser();
            vm.isPhoneVerified = AuthService.isPhoneVerified();
            vm.isAuthenticated = AuthService.isAuthenticated();
            vm.keyword = '';
            vm.city = '';
            vm.location = '';
            vm.zip = $stateParams.zip;
            vm.county = $stateParams.county;
			var stats = vm.advancedSearch = localStorage.getItem('advance-daycare-status') || 0;

            // get the reviews by the user
            if(vm.userInfo) {
                getReviewsByUser(vm.userInfo._id);
                vm.isParent = AuthService.isParent();
                vm.isProvider = AuthService.isProvider();
                vm.isAdmin = AuthService.isAdmin();
                vm.isAuthenticated = AuthService.isAuthenticated();
            }

            if( stats == 1 )
            {
                SortingContent(true);

                /* 
                NOTE: added sort key to var 'sorting' instead of adding it on-the-fly
                        this might still be needed if something breaks. (10/03/17)
                if(vm.sorting.length == 6){
                    vm.sorting.push({name: 'Shortest Distance', value:'distance'});
                }*/

                vm.sortBy = 'distance';
                vm.sortKey = 'distance';
                vm.sortName = 'Shortest Distance';
                vm.sortOrder = "1";

            }else{
                vm.fullAddress = '';

				SortingContent();

                if(vm.sorting.length == 7){
                    vm.sorting.pop();
                }

                vm.sortBy = 'name_az';
                vm.sortKey = 's_name';
                vm.sortName = 'Name (A-Z)';
                vm.sortOrder = "1";
            }

            if(angular.isDefined($stateParams.link)){
                $stateParams.link = undefined;
                vm.clearSearch();
            } else  if(state === 'search' && angular.isUndefined($stateParams.query)) {

                var searchData = localStorage.getItem('SearchItem');

                if(searchData && searchData.length > 0)
				{
					// console.log("Search Data from Storage: " + JSON.stringify(searchData));

				    vm.searchKeyword = searchData.keyword;

                    var parseParams = currentParams = JSON.parse(searchData);

                    vm.keyword = parseParams.keyword;
                    vm.city = parseParams.city;
                    vm.state =  parseParams.state;
                    vm.zip = parseParams.zip;
                    vm.county = parseParams.county;

                    if(stats == 1) {
                        vm.fullAddress = parseParams.fullAddress;
                    } else {
                        parseParams.fullAddress = '';
                        vm.fullAddress = '';
                    }

                    vm.within=parseParams.within;
                    vm.daycare = parseParams.daycare;
                    vm.limit = parseParams.limit;

                    vm.sortBy = parseParams.sortBy;
                    vm.sortName = parseParams.sortName;
                    vm.sortOrder = parseParams.sortOrder;
                    vm.location = parseParams.location;
                    vm.searchKeyword = parseParams.keyword;
                    vm.schoolyearonly = parseParams.schoolyearonly;
                    vm.infantcare = parseParams.infantcare;
                    vm.weekend = parseParams.weekend;
                    vm.halfday = parseParams.halfday;
                    vm.fullday = parseParams.fullday;
                    vm.parttime = parseParams.parttime;
                    vm.faithbased = parseParams.faithbased;
                    vm.accredited = parseParams.accredited;
                    vm.headstart = parseParams.headstart;
                    vm.nightcare = parseParams.nightcare;
                    vm.dropins = parseParams.dropins;
                    vm.beforeschool = parseParams.beforeschool;
                    vm.afterschool = parseParams.afterschool;
                    vm.meals = parseParams.meals;
                    vm.transportation = parseParams.transportation;
                    vm.rating = parseParams.rating;
                    vm.cost = parseParams.cost;
                    vm.age = parseParams.age;
                    vm.goldSeal = parseParams.goldSeal;
                    vm.vpk = parseParams.vpk;
                    vm.schoolReadiness = parseParams.schoolReadiness;
                    vm.currentPage = parseParams.currentPage;

                    console.log("Load from state");
					currentParams = search(parseParams);

                    restoreCompare();
				} else {
                    clearCompare();
                }

            } else if(state === 'search' && angular.isDefined($stateParams.query)) {

                console.log( "State Params : " + JSON.stringify($stateParams));

                vm.keyword = $stateParams.name;
                vm.city = $stateParams.city;
                vm.location = $stateParams.location;
                vm.state = $stateParams.state;
                vm.zip = $stateParams.zip;
                vm.within = $stateParams.within;
				vm.county = $stateParams.county;
                vm.skip = $stateParams.skip;

                if(!isFormComplete()){
                    console.log("Form is not complete!")
                    clearCompare();
                    return false;
                } else {
                    console.log("Form is  complete!")
                    currentParams = {
                        category: 'daycare',
                        keyword: $stateParams.name,
                        city: $stateParams.city,
                        state: $stateParams.state,
                        zip: $stateParams.zip,
                        fullAddress: $stateParams.fullAddress,
                        within: $stateParams.within,
                        county: $stateParams.county,
                        query: $stateParams.query,
                        location: $stateParams.location,
						skip: $stateParams.skip,
						saveSearch: ($stateParams.saveSearch == 'true')
                    };
                    currentParams = search(currentParams);
                    restoreCompare();
                }
            } else {
                clearCompare();

                
            }
            disableDefaultAct();
        }

        function SortingContent(byDistance) {
            vm.sorting = [
                {
                    name: 'Shortest Distance',
                    value: 'distance'
                },
                {
                    name: 'Name (A-Z)',
                    value: 'name_az'
                },
                {
                    name: 'Name (Z-A)',
                    value: 'name_za'
                },
                {
                    name: 'Rating (Low-High)',
                    value: 'overAllRatings_15'
                },
                {
                    name: 'Rating (High-Low)',
                    value: 'overAllRatings_51'
                },
                {
                    name: 'Cost (Low-High)',
                    value: 'cost_lh'
                },
                {
                    name: 'Cost (High-Low)',
                    value: 'cost_hl'
                }
            ];
            byDistance ? true : vm.sorting.shift();
        }

        vm.formatAddress = function(address, displayAddress){
            return addressFormatterFilter(address, displayAddress);
        }

        function setSortByOrder(sort){

            if (sort == 'name_az') {
                vm.sortOrder = 1;
                vm.sortKey = 's_name';
            } else if (sort == 'name_za') {
                vm.sortOrder = -1;
                vm.sortKey = 's_name';
            } else if (sort == 'overAllRatings_15') {
                vm.sortOrder = 1;
                vm.sortKey = 'avgOverAllRatings';
            } else if (sort == 'overAllRatings_51') {
                vm.sortOrder = -1;
                vm.sortKey = 'avgOverAllRatings';
            } else if (sort == 'cost_lh') {
                vm.sortOrder = 1;
                vm.sortKey = 'cost';
            } else if (sort == 'cost_hl') {
                vm.sortOrder = -1;
                vm.sortKey = 'cost';
            } else if (sort == 'distance') {
                vm.sortOrder = 1;
                vm.sortKey = 'distance';
            }

            if(!vm.sortKey || !vm.sortOrder){
                vm.sortKey = "s_name";
                vm.sortOrder =1;
            }

            scrollPagination();
        }

        function search(params) {
            vm.loadingStatus = "loading";
            var stats = vm.advancedSearch = localStorage.getItem('advance-daycare-status') || 0;

            //console.log("Search form: Location " + JSON.stringify(params) );

            if(angular.isUndefined(vm.limit)){
                vm.limit = 10;
            }

            if(vm.userInfo)
                 params.userId = vm.userInfo._id;

            if(angular.isDefined(params.saveSearch) && params.saveSearch == true) {
                params.saveSearch = true;
            } else {
                params.saveSearch = false;
            }

            if(angular.isDefined(params.query) && params.query == true) {

                console.log("Setting search parameters from Search Filters Before " + params.skip + " : " + vm.currentPage + " : " + vm.limit);

                params.limit = vm.limit;

                params.skip = (vm.currentPage-1) * vm.limit;

                console.log("Setting search parameters from Search Filters After " + params.skip + " : " + vm.currentPage);

                params.sortBy = vm.sortBy;
                params.sortName = vm.sortName;

                // setSortByOrder(vm.sortBy);  //set sortkey and sortorder
                params.sortKey = vm.sortKey;
                params.sortOrder = vm.sortOrder;
                params.location = vm.location;

                if (angular.isUndefined(currentParams)) {
                    params.city = vm.city;
                    params.state = vm.state;
                    params.zip = vm.zip;
                    params.keyword = vm.keyword;
                    params.county = vm.county;
                    params.within = vm.within;
                } else {
                    vm.city = params.city;
                    vm.state = params.state;
                    vm.zip = params.zip;
                    vm.keyword = params.keyword;
                    vm.county = params.county;
                    vm.within = params.within;
                }


                if(stats == 1) {
                    if (angular.isUndefined(currentParams)) {
                        params.fullAddress = vm.fullAddress;
                    } else {
                        vm.fullAddress = params.fullAddress;
                    }

                    if(vm.sorting.length == 6){
                        vm.sorting.push({name: 'Shortest Distance', value:'distance'});
                    }


                } else {
                    params.fullAddress = '';
                    vm.fullAddress = '';

                    if(vm.sorting.length == 7){
                        vm.sorting.pop();
                    }
                }
                params.cost = vm.cost;
                params.rating = vm.rating;
                params.age = vm.age;
                params.schoolyearonly = vm.schoolyearonly;
                params.infantcare = vm.infantcare;
                params.weekend = vm.weekend;
                params.halfday = vm.halfday;
                params.fullday = vm.fullday;
                params.parttime = vm.parttime;
                params.nightcare = vm.nightcare;
                params.faithbased = vm.faithbased;
                params.accredited = vm.accredited;
                params.headstart = vm.headstart;
                params.dropins = vm.dropins;
                params.beforeschool = vm.beforeschool;
                params.afterschool = vm.afterschool;
                params.meals = vm.meals;
                params.transportation = vm.transportation;
                params.goldSeal = vm.goldSeal;
                params.vpk = vm.vpk;
                params.schoolReadiness = vm.schoolReadiness;
                params.category = 'daycare';
                params.currentPage = vm.currentPage;
            }

            if(params.skip < 0) {
                params.skip = 0;
                vm.currentPage = 0;
            }

            console.log("Debug City/Location: " + params.city + " - " + params.location);

            if(params.location == "" || params.location == undefined){
                // console.log("Location parameter is empty: Emptying cached cities " + params.city );
                params.city = '';
                vm.city = '';
                params.state = '';
                vm.state = '';
            }

            if( (params.city == "" || params.city == undefined) && !(params.location == "" || params.location == undefined) ){
                // console.log("Location parameter is empty: Emptying cached cities " + params.city );
                if (angular.isUndefined(currentParams)) {
                    params.city = params.location;
                }
                vm.city = params.location;
            }

            if(params.fullAddress){

                if(angular.isUndefined(params.within) || params.within == ''){
                    params.within = 20;
                }

                console.log("Full Address: " + params.fullAddress);

                stateService.getLatLng(params.fullAddress).then(
                    function (response) {

                        // console.log("Location Map:  " + JSON.stringify(response));

                        var data = response.data;

                        if(data && data.results[0] && data.results[0].geometry){
                            console.log("Lat Lang1: " + JSON.stringify(data.results[0].geometry.location));
                            params.lat = data.results[0].geometry.location.lat;
                            params.lng = data.results[0].geometry.location.lng;
                        }

                        searchService.filter(params, function(result) {

                            vm.searchResult = result.searchResult;
                            vm.count = result.count;

                            vm.pages = Math.ceil(vm.count/vm.limit);
                            vm.filter = null;

                            if(isNaN(vm.currentPage)) {
                                vm.currentPage = 1;
                            }

                            // set current page as start of the pagination
                            if (vm.currentPage == 0 && vm.pages > 0) {
                                vm.currentPage = 1;
                            }

                            vm.pageStart = ( (vm.currentPage - 1) * vm.limit ) + 1;
                            vm.pageEnd = vm.currentPage * vm.limit;

                            // don't let pageEnd be greater than total search result count
                            if(vm.pageEnd > vm.count) {
                                vm.pageEnd = vm.count;
                            }

                            // don't let pageEnd be greater than total search result count
                            if(vm.count < 1) {
                                vm.pageStart = 0;
                                vm.pageEnd = 0;
                            }

                                // if current page is greater than total number of pages - set current page to 1
                            if(vm.currentPage >  vm.pages) {
                                vm.currentPage = 1;
                            }

                            if(vm.pages == 0) { // if there's no search result - set everything to zero
                                vm.currentPage = 0;
                                vm.pageStart = 0;
                                vm.pageEnd = 0;
                            }
                            vm.loadingStatus = "success";

                            getOwnerRequest();
                        });
                    },
                    function(err) {
                        vm.loadingStatus = "fail";
                        console.log(err);
                    }
                );

            } else {

                if (!params.city && !params.state && params.location) {
                    var locationArr = params.location.split(',');
                    if (locationArr.length > 0) {
                        params.city = locationArr[0].trim();
                    }
                    if (locationArr.length > 1) {
                        params.state = locationArr[1].trim();
                    }
                }

                searchService.filter(params, function(result) {

                    // console.log(params);

                    vm.searchResult = result.searchResult;
                    //console.log(vm.searchResult);

                    vm.count = result.count;

                    console.log("Result count + Skip : " + vm.count + " " + params.skip);

                    if(vm.count > 0)
                        vm.count = parseInt(vm.count) + parseInt(params.skip);

                    vm.pages = Math.ceil(vm.count/vm.limit);
                    // console.log("PAGES=>"+vm.pages);
                    vm.filter = null;
                    if(isNaN(vm.currentPage))
                        vm.currentPage = 1;

                    if (vm.currentPage == 0 && vm.pages > 0) {
                        vm.currentPage = 1;
                    }

                    vm.pageStart = ( (vm.currentPage - 1) * vm.limit ) + 1;
                    vm.pageEnd = vm.currentPage * vm.limit;

                    if (vm.currentPage == 0 && vm.pages > 0) vm.currentPage = 1;
                    if(vm.pageEnd > vm.count) vm.pageEnd = vm.count; // don't let pageEnd be greater than total search result count
                    if(vm.currentPage >  vm.pages  )vm.currentPage = 1; // if current page is greater than total number of pages - set current page to 1

                    if(vm.pages == 0 || isNaN(vm.pages)) { // if there's no search result - set everything to zero
                        vm.currentPage = 0;
                        vm.pageStart = 0;
                        vm.pages = 0;
                        console.log("THERE IS NO RESULT");
                    }

                    vm.loadingStatus = "success";
                    console.log("Pagination Info [ Limit: " +  params.limit + " Skip: " + params.skip + " Page: " + vm.currentPage
                        + " Count: " + vm.count + " Pages: " + vm.pages + " ]");

                    getOwnerRequest();
                    scrollToResults();
                });

            }

            params.query = false;
            localStorage.setItem('SearchItem', JSON.stringify(params));
            return params;
        }

        function scrollToResults() {
            // scroll to search results only on mobile
            if (!vm.isDesktop) {
                hackService.scrollAnim('.box-list-area .box-list', false, 200);
            }
        }

        function getOwnerRequest() {
            if (vm.isProvider) {
                ownershipService.get({userId: vm.userInfo._id, noPopulate: 1}, function(response) {
                    if (response.searchResult.length) {
                        angular.forEach(vm.searchResult, function(listingVal, listingKey) {
                            angular.forEach(response.searchResult, function(ownershipVal) {
                                if (listingVal._id === ownershipVal.listing) {
                                    vm.searchResult[listingKey].ownership_status = ownershipVal.status;
                                    vm.searchResult[listingKey].ownership_id = ownershipVal._id;
                                }
                            });
                        });
                    }
                });
            }
        }

        vm.requestOwnership = function(listing) {
            if (listing.ownership_status && listing.ownership_status == 'rejected') {
                ownershipService.update({ownerRequestId: listing.ownership_id}, {status: 'pending', owner: {_id:vm.userInfo._id}, listing: {_id:listing._id}, from: 'provider'}, function(response) {
                    if (response._id) {
                        listing.ownership_status = 'pending';
                        vm.uploadDocuments(listing.ownership_id);
                    } else {
                        console.warn(response);
                    }
                });
            } else {
                ownershipService.save({owner: vm.userInfo._id, listing: listing._id}, function(response) {
                    if (response.owner_requested) {
                        listing.ownership_status = response.owner_requested.status;
                        vm.uploadDocuments(response.owner_requested._id);
                    } else {
                        console.warn(response);
                    }
                });
            }
        };

        vm.cancelOwnership = function(listing) {
            ownershipService.delete({ownerRequestId: listing.ownership_id, from: 'provider'}, function(response) {
                if (response.message) {
                    listing.ownership_id = listing.ownership_status = null;
                } else {
                    console.warn(response);
                }
            });
        };

        vm.uploadDocuments = function(ownership_id) {
            $cookies.put("tmpUrl","search");
            $state.go('ownershipUploads', {ownershipId: ownership_id});
        };
            
        vm.clearSearch = function(skipType){
            vm.keyword = '';
            vm.location = '';
            vm.city = '';
            vm.zip = '';
            vm.county = '';
            vm.searchResult = [];
            vm.fullAddress = '';
            vm.pages = 0;
            vm.currentPage = 0;
            vm.pageStart = 0;
            vm.pageEnd = 0;
            vm.limit = 10;
            localStorage.removeItem('SearchItem');
            vm.cost = [];
            vm.rating = [];
            vm.age = [];
            vm.schoolyearonly = '';
            vm.infantcare = '';
            vm.weekend = '';
            vm.faithbased = '';
            vm.accredited = '';
            vm.headstart = '';
            vm.halfday = '';
            vm.fullday = '';
            vm.parttime = '';
            vm.nightcare = '';
            vm.dropins = '';
            vm.beforeschool = '';
            vm.afterschool = '';
            vm.meals = '';
            vm.transportation = '';
            vm.goldSeal = '';
            vm.vpk = '';
            vm.schoolReadiness = '';
            $("#txtDayCare").focus();
            currentParams = undefined;

            if (!skipType) {
                vm.advancedSearch == 1 ? vm.gotoAdvanceSearch(true) : vm.gotoBasicSearch(true);
            }
        }

        vm.gotoAdvanceSearch = function (skipClear) {
            if (!skipClear) {
                vm.clearSearch(true);
            }

            SortingContent(true);

            vm.sortBy = 'distance';
            vm.sortKey = 'distance';
            vm.sortName = 'Shortest Distance';
            vm.sortOrder = "1";
            vm.advancedSearch = 1;
            localStorage.setItem('advance-daycare-status', vm.advancedSearch);

            vm.within = "20";

            setTimeout(
                function(){
                    $("#txtDayCareAdv").focus();
                }, 1 );
        }

        vm.gotoBasicSearch = function (skipClear) {
            if (!skipClear) {
                vm.clearSearch(true);
            }

            SortingContent();

            vm.sortBy = 'name_az';
            vm.sortKey = 's_name';
            vm.sortName = 'Name (A-Z)';
            vm.sortOrder = "1";
            vm.advancedSearch = 0;
            localStorage.setItem('advance-daycare-status', vm.advancedSearch);

            setTimeout(
                function(){
                    $("#txtDayCare").focus();
                }, 0 );
        }

        vm.gpSearchCb = function(result, place, isBasicSearch) {
            var city = result.city;
            var state = result.administrative_area_level_1;
            vm.submitNewPage({city: city, state: state});

            if (isBasicSearch) $('#txtZip').focus();
            else $('#withinDistance').focus();
        }

        vm.myFavorites = [];
        vm.loadFavorites = function(){
            //console.log("### FavoritesLoaded ###");
          var user = AuthService.getUser();
            if(user){
                userService.getFavorites({userId: vm.userInfo._id}, function (result) {
                    vm.addDataMyfavorite(result);
                });
            }
        }
        vm.addDataMyfavorite = function(result){
          for(var x=0;x<result[0].favorites.length;x++){
              vm.myFavorites.push(result[0].favorites[x].listingId);
          }

          selectedFavoriteCount = vm.myFavorites.length;
        }
        vm.checkFavorite = function(result){
           var found = false;
           for(var x=0;x<vm.myFavorites.length;x++){
            if(result._id == vm.myFavorites[x] ){
                found = true;
                break;
            }
           }
           return found;

        }
        vm.addFavorites = function(result){
            if(vm.userInfo != undefined && result!= undefined){
                var body = {
                    userId : vm.userInfo._id,
                    favorites : {name:result.name,listingId:result._id}

                };
                userService.addFavorites(body,function(_res){
                    console.log(_res);

                })
                vm.myFavorites.push(result);
            }
        }

        vm.removeFavorites = function(result){
            if(vm.userInfo != undefined && result!= undefined){
                var body = {
                    userId : vm.userInfo._id,
                    favorites : {name:result.name,listingId:result._id}

                };
                userService.removeFavorites(body,function(_res){
                    console.log(_res);

                    /*
                    swal({
                        title: "",
                        text: result.name + " removed from your Favorites list"
                    }, function() {
                        swal.close();
                    });
                    */
                    var found = 0;
                    for(var x=0;x<vm.myFavorites.length;x++){
                        if(result._id == vm.myFavorites[x] ){
                            found = x;
                            break;
                        }
                    }
                    vm.myFavorites.splice(x,1);
                    //$scope.$apply();

                })
                
            }
            
        }
		
		vm.CheckTotalReviews = function(result)
		{
			var ret = 1;
			if(vm.userInfo == undefined && result.totalReviews == undefined)
			{
				ret = 1;
				console.log("CheckTotalReview path1");
			}
			else if(vm.userInfo == undefined && result.totalReviews !== undefined)
			{    
				ret = 1;
                console.log("CheckTotalReview path2");

            }
			else if(result.totalReviews == undefined && AuthService.isParentOrProvider())
			{
				// ret = 0;
                // result.totalReviews = 1;
				vm.reviewPath = window.location.origin+window.location.pathname+"#/listing/detail/";
                console.log("CheckTotalReview path3");

            }
			
			return ret;
		}
		
        vm.setLimit = function (limit) {
            if(!isFormComplete()){
                return false;
            }
            vm.limit = limit;
            vm.currentPage = 1;

            scrollPagination();

            isSearchEnable();

        }

        vm.isSelectedLimit = function (limit) {
            return vm.limit == limit;
        }

        vm.pressedFirst = function () {

            if(!isFormComplete()){
                return false;
            }

            scrollPagination();

            vm.currentPage = 1;

            isSearchEnable();

        }
        vm.pressedPrev = function () {

            if(!isFormComplete()){
                return false;
            }

            scrollPagination();

            vm.currentPage--;
            if (vm.currentPage < 1) vm.currentPage = 1;

            isSearchEnable();

        }


        vm.pressedNext = function () {

            if(!isFormComplete()){
                return false;
            }

            scrollPagination();

            vm.currentPage++;
            if (vm.currentPage > vm.pages) vm.currentPage = vm.pages;

            isSearchEnable();
            
        }
        vm.pressedLast = function () {

            if(!isFormComplete()){
                return false;
            }

            scrollPagination();

            vm.currentPage = vm.pages;

            isSearchEnable();
        }
        vm.loadSearch = function(){
                console.log("Load Search");
                if (angular.isDefined(currentParams)) {
                    var params = angular.copy(currentParams);
                    params.query = true;
                    params.saveSearch = false;
                    search(params);
                }
        }

        vm.submitNewPage = function (params) {

            currentParams = undefined;
            vm.searchResult = [];
            vm.pages = 0;
            vm.currentPage = 0;
            vm.pageStart = 0;
            vm.pageEnd = 0;
            if (params) {
                vm.city = params.city;
                vm.state = params.state;
            }
			else if (vm.location) {
				var templocation = vm.location.replace(/,/g,"").replace("USA","").trim();
				if (templocation.slice(-3,-2) == " "){
					vm.city = templocation.slice(0,-2).trim();
					vm.state = templocation.slice(-2).trim();
				} else{
					vm.city = templocation.trim();
					console.log("vm.city:" + vm.city);
					vm.state = undefined;
				}
			}
            localStorage.removeItem('SearchItem');
            vm.setFilter(null,null, false);

            if(!isFormComplete()){
                return false;
            }

            console.log("Submit new page");
            currentParams = search({query: true, saveSearch:true});
			params = angular.copy(currentParams);
			params.saveSearch = false;
			$state.go('search', params);
        }

        vm.sortResults = function (sortBy, sortName) {
            console.log("Setting Sorting: " + sortBy + " - " + sortName);
            vm.currentPage = 0;
            vm.sortBy = sortBy;
            vm.sortName = sortName;
            setSortByOrder(vm.sortBy);
            isSearchEnable();

        }

        vm.emptyField = function (event){
            console.log("Focused " + event.target);

        }
        
        vm.setFilter = function ( code, value, exec ) {
			var filterResult=[];
			var checked = $(".result-filter li input:checked");
            vm.cost = [];
            vm.rating = [];
            vm.age = [];
            vm.schoolyearonly = '';
            vm.infantcare = '';
            vm.weekend = '';
            vm.faithbased = '';
            vm.accredited = '';
            vm.headstart = '';
            vm.halfday = '';
            vm.fullday = '';
            vm.parttime = '';
            vm.nightcare = '';
            vm.dropins = '';
            vm.beforeschool = '';
            vm.afterschool = '';
            vm.meals = '';
            vm.transportation = '';
            vm.goldSeal = '';
            vm.vpk = '';
            vm.schoolReadiness = '';

			if(checked != undefined)
			{
				$.each(checked, function(i, item) {

				    filterResult.push({name:checked[i].name,value:checked[i].value});

                    if( checked[i].name == 'cost'){
                        vm.cost.push(checked[i].value);
                    } else if( checked[i].name == 'overAllRatings') {
                        vm.rating.push(checked[i].value);
                    } else if( checked[i].name == 'age'){
                        vm.age.push(checked[i].value);
                    } else if( checked[i].name == 'coverage'){
                        if( checked[i].value == 'schoolyearonly'){
                            vm.schoolyearonly = 'Y';
                        } else if(checked[i].value == 'infantcare'){
                            vm.infantcare = 'Y';
                        }  else if(checked[i].value == 'weekend'){
                            vm.weekend = 'Y';
                        } else if(checked[i].value == 'halfday'){
                            vm.halfday = 'Y';
                        } else if(checked[i].value == 'fullday'){
                            vm.fullday = 'Y';
                        } else if(checked[i].value == 'parttime'){
                            vm.parttime = 'Y';
                        } else if(checked[i].value == 'nightcare'){
                            vm.nightcare = 'Y';
                        }
                    } else if( checked[i].name == 'others'){
                        if( checked[i].value == 'faithbased'){
                            vm.faithbased = 'Y';
                        } else if(checked[i].value == 'accredited'){
                            vm.accredited = 'Y';
                        } else if(checked[i].value == 'headstart'){
                            vm.headstart = 'Y';
                        } else if(checked[i].value == 'goldSeal'){
                            vm.goldSeal = 'Y';
                        } else if(checked[i].value == 'vpk'){
                            vm.vpk = 'Y';
                        } else if(checked[i].value == 'schoolReadiness'){
                            vm.schoolReadiness = 'Y';
                        }
                    } else if( checked[i].name == 'service'){
                        if( checked[i].value == 'dropins'){
                            vm.dropins = 'Y';
                        } else if( checked[i].value == 'beforeschool'){
                            vm.beforeschool = 'Y';
                        } else if( checked[i].value == 'afterschool'){
                            vm.afterschool = 'Y';
                        } else if( checked[i].value == 'meals'){
                            vm.meals = 'Y';
                        } else if( checked[i].value == 'transportation'){
                            vm.transportation = 'Y';
                        }
                    }
				});

				console.log("Setting Filters" + JSON.stringify(filterResult));

                if(!isFormComplete()){
                    return false;
                }

                if(exec) {
                    // take user back to first page
                    vm.currentPage = 1;
                    isSearchEnable();
                }
			}
        }

        vm.applyFilter = function ( code, value ) {
            vm.setFilter(code, value, true);
        }

        vm.clearFilters = function(isRefreshResult){
            console.log("Clearing filter");
            vm.cost = [];
            vm.rating = [];
            vm.age = [];
            vm.schoolyearonly = '';
            vm.infantcare = '';
            vm.weekend = '';
            vm.faithbased = '';
            vm.accredited = '';
            vm.headstart = '';
            vm.halfday = '';
            vm.fullday = '';
            vm.parttime = '';
            vm.nightcare = '';
            vm.dropins = '';
            vm.beforeschool = '';
            vm.afterschool = '';
            vm.meals = '';
            vm.transportation = '';
            vm.goldSeal = '';
            vm.vpk = '';
            vm.schoolReadiness = '';
            localStorage.removeItem('SearchItem');
            if(!isFormComplete() && isRefreshResult){
                return false;
            }
            // console.log("Clear Filters");
            if( isRefreshResult ) {
                if (angular.isDefined(currentParams)) {
                    var params = angular.copy(currentParams);
                    params.query = true;
                    params.saveSearch = false;
                    search(params);
                }
            }

        }

        vm.preloadFilterValue = function ( code,  value) {

            if (code == 'overAllRatings') {
                if(angular.isArray(vm.rating) && vm.rating.indexOf(value) >= 0){
                    return true;
                }
            } else if (code == 'cost') {
                if(angular.isArray(vm.cost) && vm.cost.indexOf(value) >= 0){
                    return true;
                }
            } else if (code == 'age') {
                if(angular.isArray(vm.age) && vm.age.indexOf(value + "") >= 0){
                    return true;
                }
            } else if (code == 'coverage') {

                if(value == "schoolyearonly" && vm.schoolyearonly == 'Y')
                    return true;
                else if(value == "infantcare" && vm.infantcare == 'Y')
                    return true;
                else if(value == "weekend" && vm.weekend == 'Y')
                    return true;
                else if(value == "halfday" && vm.halfday == 'Y')
                    return true;
                else if(value == "fullday" && vm.fullday == 'Y')
                    return true;
                else if(value == "parttime" && vm.parttime == 'Y')
                    return true;
                else if(value == "nightcare" && vm.nightcare == 'Y')
                    return true;

            }  else if (code == 'others') {

                if(value == "faithbased" && vm.faithbased == 'Y')
                    return true;
                else if(value == "accredited" && vm.accredited == 'Y')
                    return true;
                else if(value == "headstart" && vm.headstart == 'Y')
                    return true;
                else if(value == "goldSeal" && vm.goldSeal == 'Y')
                    return true;
                else if(value == "vpk" && vm.vpk == 'Y')
                    return true;
                else if(value == "schoolReadiness" && vm.schoolReadiness == 'Y')
                    return true;

            } else if (code == 'service') {

                if(value == "dropins" && vm.dropins == 'Y')
                    return true;
                else if(value == "beforeschool" && vm.beforeschool == 'Y')
                    return true;
                else if(value == "afterschool" && vm.afterschool == 'Y')
                    return true;
                else if(value == "meals" && vm.meals == 'Y')
                    return true;
                else if(value == "transportation" && vm.transportation == 'Y')
                    return true;

            }
            return false;

        }

        vm.capitalizeFirstLetter = function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }


        vm.alertRegister = function(){
            swal({
                title: "Log In Required",
                text: "This action requires you to be logged in. If you are not a registered user, please take a few minutes to become one by clicking 'Register' on top of the page.  There is no fee to become a registered user.",
                type: "warning"
            }, function() {
                swal.close();
            });
        }

        function scrollPagination(){
            $("html, body").animate({scrollTop: vm.topPosY}, "fast");
            //$(window).scrollTop();
        }

        function isFormComplete()
        {
            var stats = vm.advancedSearch = localStorage.getItem('advance-daycare-status') || 0;

            if( (stats != 1) && ( (!vm.location && !vm.county && !vm.zip) || ( vm.zip && vm.zip.length != 5 ) ) && (angular.isUndefined(currentParams)) ){


                console.log("Required fields on Basic Search! Please fill-up!");
                vm.searchResult =  [];

                if( vm.zip && vm.zip.length != 5 ) {
                    $('#txtZip').focus();
                } else {
                    $('#txtCity').focus();
                }

                return false;


            } else if( (stats == 1) && ( !vm.fullAddress) && (angular.isUndefined(currentParams)) ) {
                console.log("Required fields on Advance Search! Please fill-up!");
                $('#txtAddress').focus();
                return false;
            }


            return true;
        }

        function isSearchEnable()
		{
		    console.log("isSearchEnable");
            if (angular.isDefined(currentParams)) {
                var params = angular.copy(currentParams);
                params.query = true;
                params.saveSearch = false;
                search(params);
            }

            return true;
        }

		vm.isFar = function(distance){

		    if(parseFloat(distance) > 1 ) {
		        return true;
            } else {
                return false;
            }
        }

		
		vm.toggleIcon = function(index){

            if ($('#icon' + index).hasClass("glyphicon-plus")){
                $('#icon' + index).removeClass("glyphicon glyphicon-plus");
                $('#icon' + index).addClass("glyphicon glyphicon-minus");
            } else {
                $('#icon' + index).removeClass("glyphicon glyphicon-minus");
                $('#icon' + index).addClass("glyphicon glyphicon-plus");
            }

		}

        $scope.$on('applySavedSearch',function(event,args){
            console.log("applySavedSearch");
            console.log(args);
            currentParams = args;
            if (args.fullAddress) {
                vm.gotoAdvanceSearch();
            } else {
                vm.gotoBasicSearch();
            }
            currentParams = search(args);
            vm.keyword = args.keyword;
            vm.location = args.location;
            vm.zip = args.zip;
            vm.county = args.county;
            vm.city = args.city;
            vm.state = args.state;
            vm.sortBy = args.sortBy;
            vm.sortName = args.sortName;
            vm.sortOrder = args.sortOrder;
            vm.searchKeyword = args.keyword;
            vm.schoolyearonly = args.schoolyearonly;
            vm.infantcare = args.infantcare;
            vm.weekend = args.weekend;
            vm.halfday = args.halfday;
            vm.fullday = args.fullday;
            vm.parttime = args.parttime;
            vm.faithbased = args.faithbased;
            vm.accredited = args.accredited;
            vm.headstart = args.headstart;
            vm.nightcare = args.nightcare;
            vm.dropins = args.dropins;
            vm.beforeschool = args.beforeschool;
            vm.afterschool = args.afterschool;
            vm.meals = args.meals;
            vm.transportation = args.transportation;
            vm.rating = args.rating;
            vm.cost = args.cost;
            vm.age = args.age;
            vm.goldSeal = args.goldSeal;
            vm.vpk = args.vpk;
            vm.schoolReadiness = args.schoolReadiness;
            vm.fullAddress = args.fullAddress;
            vm.within = args.within;
            //vm.currentPage = args.currentPage;
            //vm.clearSearch();
        });


        vm.test = function() {
            // if(!isInview)
                console.log("Element in view");
        }

        vm.writeReview = function(listing) {
            console.log   ("Reviewing: "+JSON.stringify(listing));
            reviewService.listingData = listing;
            $cookies.put("tmpUrl","search");
            $state.go('writeReview', {daycareId:listing._id});
        }

        vm.updateReview = function(listing) {
            console.log   ("ReviewUpdate: "+JSON.stringify(listing));

            if(vm.reviewsByUser!==null || typeof(vm.reviewsByUser) !=='undefined'){

                var returnedReview = vm.reviewsByUser.some(function (review) {
                    if (review.daycare_id == listing._id) {
                        console.log("updateThis:" + JSON.stringify(review));

                        $cookies.put("tmpUrl","search");
                        $state.go('writeReview', {daycareId:listing._id,reviewId:review._id});
                    }
                });


            }

        }


        // EXPERIMENTAL NG-CLICK CALLBACK
        vm.ifRegistered = function(cbTrue, cbFalse){
            if(vm.isAuthenticated){
                cbTrue();
            }else{
                cbFalse();
            }
        }

        vm.schedule = function(result) {
            console.log("Missing schedule function");
        }

        vm.checkSms = function(){
            //console.log("CheckSms: "+vm.isPhoneVerified+" && "+vm.isAuthenticated);
            return vm.isPhoneVerified && vm.isAuthenticated;
        }

        // Comparison Feature
        vm.transformedCompare = {};
        var compareLim = 4;

        function inCompare(obj){
            var bool = vm.compare.some(function (item) {
                return item._id === obj._id;
            });
            //var bool = (vm.compare.indexOf(obj)!==-1);
            //console.log("inCompare:"+bool);
            return bool;
        }

        vm.toggleCompare = function(daycare){
            if(inCompare(daycare)){
                vm.removeCompare(daycare);
            }else if(compareLim === vm.compare.length){
                swal({
                    title: 'Comparison Limit Reached',
                    text: 'You can compare only '+compareLim+' child care centers at a time. To add this center to the comparison list, please deselect another one first.',
                    type: 'warning',
                    confirmButtonText: 'OK',
                    closeOnConfirm: true
                });
            }else{
                vm.addCompare(daycare);
            }
        };


        vm.addCompare = function(daycare){
            vm.compare.push(daycare);
            storeCompare();
        };

        vm.removeCompare = function(daycare){
            for (var i = vm.compare.length - 1; i > -1; i--) {
                if (vm.compare[i]._id === daycare._id) {
                    vm.compare.splice(i, 1);
                    storeCompare();
                }
            }
        };

        vm.getCompareBtnClass = function(daycare) {
            return getToggledClass(inCompare(daycare));
        };

        function getToggledClass(toggled) {
            if (toggled) {
                return 'btn btn-theme btn-xxs btn-secondary'
            }
            return 'btn btn-theme btn-xxs btn-default';
        }

        function storeCompare() {
			if (vm.compare.length >=0){
                localStorage.setItem('compare', JSON.stringify(vm.compare));
            }
        }

        function restoreCompare() {
            if (!(vm.compare = JSON.parse(localStorage.getItem('compare')))) {
                vm.compare = [];
            }
        }

        function clearCompare() {
            vm.compare = [];
            localStorage.removeItem('compare');
            console.log("clearCompare: "+vm.compare.length);
        }

        vm.transformCompare = function(){
            vm.transformedCompare = {
                name : [],
                address: [],
                coverage : [],
                service : [],
                overAllRatings : [],
                avgOverAllRatings : [],
                cost:[],
                features: [],
                accredited: [],
                accreditingOrgs: [],
                curriculum:[],
                hoursOfOp: [],
                logo:[]
            }
            if(vm.compare!==null && vm.compare.length>1){
                $timeout(function() {
                vm.compare.forEach(function(item){
                    console.log(item);
                    // COVERAGE
                    var coverage = [];
                    if(yNToBoolFilter(item.fullday)) coverage.push("Full Day");
                    if(yNToBoolFilter(item.halfday)) coverage.push("Half Day");
                    if(yNToBoolFilter(item.infantcare)) coverage.push("Infant");
                    if(yNToBoolFilter(item.nightcare)) coverage.push("Night");
                    if(yNToBoolFilter(item.parttime)) coverage.push("Part Time");
                    if(yNToBoolFilter(item.schoolyearonly)) coverage.push("School Year Only");
                    if(yNToBoolFilter(item.weekend)) coverage.push("Weekend");

                    // SERVICE
                    var service = [];
                    if(yNToBoolFilter(item.afterschool)) service.push("After School");
                    if(yNToBoolFilter(item.beforeschool)) service.push("Before School");
                    if(yNToBoolFilter(item.dropins)) service.push("Drop-In");
                    if(yNToBoolFilter(item.meals)) service.push("Food Served");
                    if(yNToBoolFilter(item.transportation)) service.push("Transportation");


                    // FEATURES
                    var features = [];
					if(yNToBoolFilter(item.accredited)) features.push("Accredited");
                    if(yNToBoolFilter(item.faithbased)) features.push("Faith Based");
                    if(yNToBoolFilter(item.headstart)) features.push("Head Start");
                    if(yNToBoolFilter(item.vpk)) features.push("Pre-K");
                    if(yNToBoolFilter(item.schoolReadiness)) features.push("School Readiness");
                    if(yNToBoolFilter(item.goldSeal)) features.push("State Quality Program");

					// ACCREDITING ORGANIZATIONS
                    var accreditingOrgs = []
                    if (item.accredited == 'N') {
						accreditingOrgs.push(COMMON.notApplicable);
						} else if (item.accredited == 'Y' && item.accreditations.length == 0) {
							accreditingOrgs.push(COMMON.notAvailable);
							} else {
								for (var i = 0; i < item.accreditations.length; i++){
									accreditingOrgs.push(item.accreditations[i]);
									}
								}

					// CURRICULUMS
					var curriculums = []
					if (!item.curriculum || item.curriculum.length < 1) {
						curriculums.push(COMMON.notAvailable);
						} else {
							for (var i = 0; i < item.curriculum.length; i++){
								curriculums.push(item.curriculum[i]);
								}
							}

					// HOURS OF OPERATION
					var hours = []
					if (item.rawData && item.rawData.opHoursAvailable == 'N'){
						hours.push(COMMON.notAvailable);
					} else if (item.operatingHours){
						for (var i = 0; i < item.operatingHours.length; i++){
							var dayHours = {day:'',time: []}
							dayHours.day = item.operatingHours[i].day.substring(0,3) + ':';
							if (item.operatingHours[i].closed == true){
								dayHours.time.push('Closed');
							} else{
								for (var j = 0; j < item.operatingHours[i].sched.length; j++){
									dayHours.time.push(item.operatingHours[i].sched[j].open + ' - ' + item.operatingHours[i].sched[j].close);
								}
							}
						hours.push(dayHours);
						}
					}
                    // COST
                    // item.cost
                    if(item.cost) vm.transformedCompare.cost.push(item.cost.toString());
                    else vm.transformedCompare.cost.push(COMMON.notAvailable);

                    // RATING
                    // item.rating
                    if(item.overAllRatings) vm.transformedCompare.overAllRatings.push(item.overAllRatings)
                    else vm.transformedCompare.overAllRatings.push(0);

                    // AVG RATING
                    if(item.avgOverAllRatings) vm.transformedCompare.avgOverAllRatings.push(item.avgOverAllRatings)
                    else vm.transformedCompare.avgOverAllRatings.push(0);

                    //ADDRESS

					var address={line1: '', line2: ''};
					if(item.displayAddress == 'False'){
						address.line1 = 'Street address not disclosed by provider';
					} else{
						if(item.address.addressLine1 && item.address.addressLine1 != " "){
							address.line1 = item.address.addressLine1;
						} else{
							address.line1 = 'Street address not available'
						}
					}
					if (item.address.cityState && item.address.zip){
						address.line2 = item.address.cityState.concat(' ', item.address.zip);
					} else if (item.address.cityState && !item.address.zip){
						address.line2 = item.address.cityState
					} else if (item.address.zip && !item.address.cityState){
						address.line2 = item.address.state.concat(' ', item.address.zip)
					}
					vm.transformedCompare.address.push(address);

                    //LOGO
                    if(item.logo) vm.transformedCompare.logo.push(item.logo)
                    else vm.transformedCompare.logo.push(0);

                    vm.transformedCompare.name.push(item.name.toString());
                    vm.transformedCompare.coverage.push(coverage);
                    vm.transformedCompare.service.push(service);
                    vm.transformedCompare.features.push(features);
					vm.transformedCompare.accreditingOrgs.push(accreditingOrgs);
					vm.transformedCompare.curriculum.push(curriculums);
                    vm.transformedCompare.hoursOfOp.push(hours);
                    console.log(vm.transformedCompare);
                });
                var events;
                $('#modalCompare').off('show.bs.modal').on('show.bs.modal', function(e) {
                    var elemsToTab = [$('#clearCompBtn'), $('#doneCompBtn')];
                    events = hackService.bindTabbing(elemsToTab);
                })
                .off('hide.bs.modal').on('hide.bs.modal', function(e) {
                    hackService.unbindCustomEvents(events);
                });
                $('#compareModalBtn').click();
                    $scope.$apply();
                }, 0);
            } else {
                swal({
                    title: 'Expand Comparison Selection',
                    text: 'Please select at least two child care centers to compare.',
                    type: 'warning',
                    confirmButtonText: 'OK',
                    closeOnConfirm: true
                });
            }

        };

        vm.clearCompare = clearCompare;

        vm.formSubmitCookie = function(){
            console.log("put cookie here");
            $cookies.put("tmpUrl","forms_document");
        }
        vm.logReviews = function(){
            if(vm.isAuthenticated){
                console.log("getUserReviews: "+vm.userInfo._id);
                getReviewsByUser(vm.userInfo._id);
                
                //console.log("userReviews: "+ JSON.stringify(reviewsByUser) );
            }else{
                console.log("NotAuth");
            }
        };

        vm.getReviewsByUser = getReviewsByUser;

        function getReviewsByUser(userId){
            reviewService.getMyReviews(userId).then(function(res){
                if(res!==null){
                    vm.reviewsByUser = [];
                  //  console.log("reviewServiceResLength: "+ res.length);
                    res.forEach( function(item){
                        //console.log("userReview: "+JSON.stringify(item));
                        vm.reviewsByUser.push(item);
                    });
                }
            });
        };

        vm.userHasReview = function(daycareId){
            var bool = false
            if(vm.reviewsByUser!==null || typeof(vm.reviewsByUser) !=='undefined'){
                bool = vm.reviewsByUser.some( function (review) {
                    return review.daycare_id === daycareId;
                });
            }
            return bool;

        };

        vm.setReviewsTab = function() {
            $cookies.put("tmpUrl","review");
        };

        vm.updateFavorites = function(result, index){
            console.log("updateFavoritesResult:"+JSON.stringify(result));
            // set 1second delay as deterrent from spamming adding and removing data from server
            result.selectedIndex = index;

            setTimeout(function () {
                //$scope.$apply(function () {
                    if(result.isFavorite){
                        vm.removeFavorites(result);
                        result.isFavorite = false;
                        if (selectedFavoriteCount >= 0) {
                            --selectedFavoriteCount;
                        }
                    }else{
                        vm.addFavorites(result);
                        result.isFavorite = true;
                        if (selectedFavoriteCount >= 0) {
                            ++selectedFavoriteCount;
                        }
                    }
					if (selectedFavoriteCount == 1){
						result.favoritesDisplay = 'You have ' + selectedFavoriteCount + ' child care center in your Favorites list.  Click Favorites from your Dashboard to view them.';
					} else {
						result.favoritesDisplay = 'You have ' + selectedFavoriteCount + ' child care centers in your Favorites list.  Click Favorites from your Dashboard to view them.';
					}

                    var id = '#notifs-' + index;
                    $(id).show();
                    $(id).delay(3000).fadeOut('slow');
                //});
            }, 500);

        };

        vm.openSaveSearch = function(){
            // broadcast to open modal
            $rootScope.$broadcast('open-tag-modal');
        };       

        $rootScope.$on("showSmsVerifyModal",function(e){
            // delay modal show after state reload
            setTimeout(function(){
                var events;
                if(!$('#need-sms-verify').hasClass('in')){
                    $('#need-sms-verify').off('shown.bs.modal').on('shown.bs.modal', function () {
                        events = hackService.bindEscapeModalSeq(this);
                        hackService.allowSecondModalFocus();
                        $('#verifySMSInput').focus();
                    })
                    .off('hidden.bs.modal').on('hidden.bs.modal', function(e) {
                        if ($('div.sweet-alert').is(':hidden')) {
                            if($("#txtDayCareAdv").is( ":visible" )){
                                $("#txtDayCareAdv").focus();
                            } else if ($("#txtDayCare").is( ":visible" )){
                                $("#txtDayCare").focus();
                            }
                        }
                        hackService.unbindCustomEvents(events);
                    })
                    .modal({
                        keyboard: false,
                        backdrop: 'static'
                    });
                }
            },0);
        });

        function disableDefaultAct(){
            // disable scrolldown when spacebar is hit
            window.addEventListener('keydown', function(e) {
              if(e.keyCode == 32 && e.target == document.body) {
                e.preventDefault();
              }
            });
        };

        vm.keyPress = function (e){ 
            console.log("keypressCapture");
            var charCode = e.keyCode;
            var target = e.currentTarget;
            var clickSearch = function(){
                e.preventDefault();
                setTimeout(
                    function(){
                        $("#txtDayCare").focus();

                        if($("#search_button_main").is( ":visible" )){
                            $("#search_button_main").click();
                            $("#txtDayCareAdv").focus();
                        } else if ($("#search_button_basic").is( ":visible" )){
                            $("#txtDayCare").focus();
                            $("#search_button_basic").click();
                        }
                    }, 0 );
            };

            if(charCode ==  13){
                switch(target.id){
                    
                }

            }else if(charCode ==  32 || charCode ==  13){
                switch(target.id){
                    case 'withinDistance':
                    case 'search_button_main':
                    case 'search_button_basic':
                        console.log("search_button: " + target.id);
                        clickSearch();

                        break;
                    case 'clearSearch':
                        console.log("clearSearchKeypress: " + target.id);
                        e.preventDefault();
                        setTimeout(
                            function(){
                                $("#txtDayCare").focus();
                                $("#clearSearch").click();
                            }, 0 );

                        break;
                    case 'previousSearch':
                        console.log("previousSearchKeypress: " + target.id);
                        e.preventDefault();
                        setTimeout(
                            function(){
                                $("#previousSearch").click();
                            }, 0 );

                        break;
                    case 'btnGotoAdvanceSearch':
                        console.log("btnGotoAdvanceSearchKeypress: " + target.id);
                        e.preventDefault();
                        setTimeout(
                            function(){
                                $("#btnGotoAdvanceSearch").click();
                                $("#txtDayCareAdv").focus();
                            }, 0 );

                        break;
                    case 'btnGotoBasicSearch':
                        console.log("btnGotoBasicSearchKeypress: " + target.id);
                        e.preventDefault();
                        setTimeout(
                            function(){
                                $("#btnGotoBasicSearch").click();
                                $("#txtDayCare").focus();
                            }, 0 );

                        break;
                    case 'advPreviousSearch':
                        console.log("advPreviousSearchKeypress: " + target.id);
                        e.preventDefault();
                        setTimeout(
                            function(){
                                $("#advPreviousSearch").click();
                                $("#txtDayCareAdv").focus();
                            }, 0 );

                        break;
                    case 'advClearSearch':
                        console.log("advClearSearchKeypress: " + target.id);
                        e.preventDefault();
                        setTimeout(
                            function(){
                                $("#advClearSearch").click();
                                $("#txtDayCareAdv").focus();
                            }, 0 );

                        break;
                }                
            }
            
        };

        $scope.add_previous_page = function() {
            console.log("Setting previous page: " + $state.current.name);
            sessionStorage.setItem('prevChilCareListState', $state.current.name);
        }

        // Media queries
        var mw990 = $window.matchMedia('only screen and (min-width: 990px)');
        var collapseSearchFilters = '#collapse-search-filters';
        hackService.waitForElem(collapseSearchFilters).then(function(elem) {
            elem.on('show.bs.collapse', function() {
                $timeout(function() {
                    vm.filtersShown = true;
                });
            }).on('hide.bs.collapse', function() {
                $timeout(function() {
                    vm.filtersShown = false;
                });
            });
        });
        var filterCollapse = function(mq) {
            if (vm.isDesktop = mq.matches) {
                hackService.waitForElem(collapseSearchFilters).then(function(elem) {
                    elem.collapse('show');
                });
            }
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        };
        mw990.addListener(filterCollapse);
        filterCollapse(mw990);

        $scope.$on('$destroy', function() {
            mw990.removeListener(filterCollapse);
        });
    };

    angular
    .module('routerApp').filter('range', function() {
      return function(input, total) {
        total = parseInt(total);

        for (var i=0; i<total; i++) {
          input.push(i);
        }

        return input;
      };
    });

})();
