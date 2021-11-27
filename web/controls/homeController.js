(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('homeCtrl', homeCtrl);

    homeCtrl.$inject = ['$state','memberService','providerService','listingService', '$scope','AuthService','AuditLogService','$rootScope'];

    function homeCtrl($state,memberService,providerService,listingService, $scope,AuthService,AuditLogService,$rootScope) {

        var vm = this;
		
         angular.element(window).bind('focus', function() {
			if(localStorage.getItem('userId') == null && $(".link-profile").is(":visible") == true){
				$state.go($state.current, {}, {reload: true});
			}
		});
		
        vm.goToSearch = goToSearch;
		vm.gpSearchCb = gpSearchCb;
		vm.closeAnnouncement = closeAnnouncement;

        $scope.memberCtr = 0;
        vm.providerCtr = 0;

        $scope.daycareList;
		
		//get visit count
		$scope.visitCount = 0;
		$scope.totalCount = 0;
		var email = "";
		var ipAdd = "";
		
		var userInfo = AuthService.getUser();
		if(userInfo !== undefined){
			email = userInfo.email;
		}
		
		$.getJSON("https://api.ipify.org/?format=json", function(e) {
			ipAdd = e.ip;
			
			//check ip and email
			AuditLogService.getAuditLog(ipAdd,email).then(function(audit){
				var urlVisited = window.location.href;
				if(audit.data.length == 0){
					//add audit log
					$scope.visitCount++;
					AuditLogService.addAuditLog(ipAdd,email,urlVisited,$scope.visitCount);
				}else{
					//update audit log
					var isSameUrl = false;
					for(var i = 0; i < audit.data.length; i++){
						if(audit.data[i].url_visited == urlVisited && audit.data[i].ip_address == ipAdd && audit.data[i].email == email){
							isSameUrl = true;
							$scope.visitCount = audit.data[i].visit_counter+1;
							AuditLogService.updateAuditLog($scope.visitCount, audit.data[i]._id);
							break;
						}else{
							isSameUrl = false;
						}
					}
					if(isSameUrl == false){
						$scope.visitCount++;
						AuditLogService.addAuditLog(ipAdd,email,urlVisited,$scope.visitCount);
					}
				}
				AuditLogService.countAllVisitSite().then(function(output){
					if(output.data.length == 0)
					{
						$scope.totalCount = 1;
					}else{
						$scope.totalCount = output.data.visit_counter;
					}
				});
			},function(err){
				console.warn(err);
			});
		});
		
        function goToSearch(params) {
			if (params.location && !(params.city || params.state)){
				var templocation = params.location.replace(/,/g,"").replace("USA","").trim();
				if (templocation.slice(-3,-2) == " "){
					params.city = templocation.slice(0,-2).trim();
					params.state = templocation.slice(-2).trim();
				} else{
					params.city = templocation.trim();
				}
			}
            if((!vm.location && !vm.county && !vm.zip) || ( vm.zip && vm.zip.length != 5 )){

            	console.log("Parameters: "+ JSON.stringify(params));
				console.log(" Please complete all the required field in Home Search ");

				if( vm.zip && vm.zip.length != 5 ) {
					$('#txtZip').focus();
				} else {
					$('#txtCity').focus();
				}

            }else{

				localStorage.setItem('advance-daycare-status',0);
			console.log("params in homectrl.js: " + JSON.stringify(params));
				$state.go('search', params);
            }
        }

		function gpSearchCb(result, place) {
			vm.city = result.city;
			vm.state = result.administrative_area_level_1;
			$('#txtCity').focus();
		}

		function closeAnnouncement(){
            $('#announcement-box').hide()
		}

        function onLoad() {
            memberService.get({}, function(response) {
              for(var i = 0; i < response.users.length; i++){
                $scope.memberCtr++;
              }
            });

            providerService.get({}, function(response) {
              for(var i = 0; i < response.users.length; i++){
                vm.providerCtr++;
              }
            });

            listingService.getList().$promise.then(function(response) {
                $scope.daycareList = response.searchResult;
            });
        }


        onLoad();

          
    }
    
})();
