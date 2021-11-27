(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('staffCtrl', staffCtrl);

    staffCtrl.$inject = [
        '$q',
        '$state',
        '$stateParams',
        '$rootScope',
        '$scope',
        'AuthService',
        'reviewService',
        'userService',
        'listingService',
        'staffService',
        'hackService',
        'stateService'
    ];

    function staffCtrl($q, $state, $stateParams, $rootScope, $scope, AuthService, reviewService, userService, listingService, staffService, hackService, stateService) {

        console.log("staffCtrlInitialize");

        var self = this;

        self.user = angular.copy(AuthService.getUser());

        $scope.emailRegex = AuthService.emailRegex;

        $scope.floaterInit = {initTop: 195, topOffset: 195};
        $scope.rightOffset = 15;
        $scope.headerHeight = 126;

        $scope.progress = {
            updateMode: false,
            staff: false,
            reference: false,
            employment: false,
            currentIndex : 1
        };
     
        self.staffInfoObj = {
            
        };

        $scope.staffEditMode = false;

        $scope.Staff = {
            "firstName": "",
            "midInitial": "",
            "lastName": "",
            "email": "",
            "mobileNumber": "",
            "phoneNumber": "",
            "workNumber": "",
            "role": "",

            // new data
            "birth": "",
            "ss": "",
            "zip": "",
            "pobox": "",
            "street": "",
            "apt": "",
            "city": "",
            "state": "",
            "employmentStart": "",
            "employmentEnd": ""
            
        };

        // new data : the number of reference to be filled in the form depends on this variable
        $scope.reference = [
            {formName:"staffRef1",firstName:"",midInitial:"",lastName:"",email:"",phoneNumber:""},
            {formName:"staffRef2",firstName:"",midInitial:"",lastName:"",email:"",phoneNumber:""},
            {formName:"staffRef3",firstName:"",midInitial:"",lastName:"",email:"",phoneNumber:""}
        ];

        $scope.prevEmployer = [
            {"formName":"prevEmployer1",
            "name":"",
            "address":{},
            "contactFirstName":"",
            "contactMidInitial":"",
            "contactLastName":"",
            "contactEmail":"",
            "employmentStart":"",
            "employmentEnd":"",
            "reason":"",
            "authorizeContact":true},
            {"formName":"prevEmployer2",
            "name":"",
            "address":{},
            "contactFirstName":"",
            "contactMidInitial":"",
            "contactLastName":"",
            "contactEmail":"",
            "employmentStart":"",
            "employmentEnd":"",
            "reason":"",
            "authorizeContact":true},
            {"formName":"prevEmployer3",
            "name":"",
            "address":{},
            "contactFirstName":"",
            "contactMidInitial":"",
            "contactLastName":"",
            "contactEmail":"",
            "employmentStart":"",
            "employmentEnd":"",
            "reason":"",
            "authorizeContact":true}
        ];

        // new data
        $scope.StaffEmployment = {
            
            "name":"",
            "address":{},
            "contactFirstName":"",
            "contactMidInitial":"",
            "contactLastName":"",
            "contactEmail":"",
            "employmentStart":"",
            "employmentEnd":"",
            "reason":"",
            "authorizeContact":""

        }

        $scope.role = {
            "type": "select",
            "name": "Role",
            "values": ["Support Staff", "Teacher"]
        };
        $scope.Staff.role = $scope.role.values[0];

        $scope.newStaff = {};

        $scope.stateList= null;
        function generateStates(){
            stateService.getListOfStates().then(
                function (response) {
                    $scope.stateList = ['State'];
                    var data = response.data;
                    for (var key in data) {
                        $scope.stateList.push(key);
                    }
                },
                function (err) {
                    console.log(err);
                }
            );
        }
        generateStates();

        onLoad();
        function onLoad() {
            console.log("staffCtrlLoading");
            $(window).scrollTop(0);

            if ($state.current.name == 'addStaff' || $state.current.name == 'updateStaff') {
                $scope.StaffListingId = $stateParams.listingId;

                $scope.staffEditMode = false;
                self.staffInfoObj = $stateParams.staffInfoObj;

                console.log("self.staffInfoObj: "+JSON.stringify(self.staffInfoObj));

                switchStaffForm(1);

                if ($state.current.name == 'updateStaff') {
                    $scope.progress.updateMode = true;
                    $scope.staffEditMode = true;
                    if (self.staffInfoObj != null) {
                        $scope.Staff = self.staffInfoObj;
                        $scope.role.value = self.staffInfoObj.role;
                        syncLocalData($scope.Staff);

                        hackService.tryFocusToElem('form[name="StaffForm"] input[name="firstName"]'); // Focus to First Name field

                        if(!$scope.$$phase){
                            $scope.$apply();
                        }
                    } else {
                        staffService.getStaffById({staffId: $stateParams.staffId},
                        function (_res) {
                            if (_res) {
                                console.log("Received Staff:" + JSON.stringify(_res));
                                $scope.Staff = _res;
                                $scope.role.value = _res.role;
                                syncLocalData($scope.Staff);

                                hackService.tryFocusToElem('form[name="StaffForm"] input[name="firstName"]'); // Focus to First Name field

                                if(!$scope.$$phase){
                                    $scope.$apply();
                                }

                            }
                        });
                    }
                }

            } else if ($state.current.name == 'dashboard_staff_list') {
                $scope.StaffListingId = $stateParams.daycareId;

                $scope.staffToDelete = 0;

                $scope.staffData = [];

                // staffService.getStaff({listingId: $scope.StaffListingId},
                // function (_res) {
                //     if (_res && _res.length > 0) {
                //         console.log("Received Staff:" + JSON.stringify(_res));
                //         $scope.staffData = _res;

                //         hackService.tryFocusToElem('form[name="StaffForm"] input[name="firstName"]'); // Focus to First Name field
                //     }
                // });

                // $scope.listing = {};
                // listingService.get({listingId: $scope.StaffListingId}, function(_res) {
                //     if (_res.listing) {
                //         $scope.listing = _res.listing;
                //     } else {
                //         console.warn(_res);
                //     }
                // });

                loadStaffs();
            }

            console.log("staffCtrlLoadingDone");
        }

        function loadStaffs(){
            var user = AuthService.getUser();

            console.log("Load Staffs for: "+user._id);

            $scope.daycareList = []
            $scope.staffData = []

            reviewService.getMyDaycares(user._id)
                .then(
                    function (daycares) {
                        

                        // Request daycares' clients
                        angular.forEach(daycares,function(daycare){

                            var daycareId = daycare._id;
                            var daycareName = daycare.name;
                            var data = {
                                daycareId:daycareId,
                                daycareName:daycareName,
                                staffs:[]
                            };


                           staffService.getStaff({listingId: daycareId},
                            function (staffs) {
                                if (staffs && staffs.length > 0) {
                                    
                                    console.log("Received Staff:" + JSON.stringify(staffs));
                                    
                                    staffs.$promise.then(
                                        function(_staffs){

                                            data.staffs = staffs;
                                            $scope.daycareList.push(data);
                                            $scope.staffData.push(staffs);

                                        });

                                    
                                }
                            });

                        });
                    },
                    function (err) {
                        console.warn(err);
                    }
                );
        }

        function createNewStaff(){
            var newStaff = {};
            var ref = angular.copy($scope.reference);
            var prev = angular.copy($scope.prevEmployer);
            /*
            // Profile
            "firstName": "",
            "lastName": "",
            "email": "",
            "mobileNumber": "",
            "phoneNumber": "",
            "workNumber": "",
            "role": "",
            "birth": "",
            "ss": "",
            "zip": "",
            "pobox": "",
            "street": "",
            "apt": "",
            "city": "",
            "state": "",
            "employmentStart": "",
            "employmentEnd": ""

            // Reference
            firstName:"",
            lastName:"",
            email:"",phoneNumber:""

            // PrevEmployer
            "name":"",
            "address":"",
            "contactFirstName":"",
            "contactMiddleInitial":"",
            "contactLastName":"",
            "employmentStart":"",
            "employmentEnd":"",
            "reason":"",
            "authorizeContact":true
            */
            // newStaff = {
            //     "listingId":$scope.StaffListingId,
            //     "firstName": staff.firstName,
            //     "midInitial": staff.midInitial,
            //     "lastName": staff.lastName,
            //     "email": staff.email,
            //     "mobileNumber": staff.mobileNumber,
            //     "phoneNumber": staff.phoneNumber,
            //     "workNumber": staff.workNumber,
            //     "role": staff.role,
            //     "birth": staff.birth,
            //     "ss": staff.ss,
            //     "zip": staff.zip,
            //     "pobox": staff.pobox,
            //     "street": staff.street,
            //     "apt": staff.apt,
            //     "city": staff.city,
            //     "state": staff.state,
            //     "employmentStart": staff.employmentStart,
            //     "employmentEnd": staff.employmentEnd,
            //     "employmentHistory": [],
            //     "reference": []
            // };

            // for(var r in ref){
            //     newStaff.reference.push({
            //         "firstName":ref[r].firstName, 
            //         "midInitial":ref[r].midInitial, 
            //         "lastName":ref[r].lastName, 
            //         "phoneNumber":ref[r].phoneNumber,
            //         "email":ref[r].email
            //     });
            // }

            // for(var p in prev){
            //     newStaff.employmentHistory.push({
            //         "name":prev[p].name ,
            //         "address":prev[p].address ,
            //         "contactFirstName":prev[p].contactFirstName ,
            //         "contactMidInitial":prev[p].contactMidInitial ,
            //         "contactLastName":prev[p].contactLastName ,
            //         "employmentStart":prev[p].employmentStart ,
            //         "employmentEnd":prev[p].employmentEnd ,
            //         "reason":prev[p].reason ,
            //         "authorizeContact": prev[p].authorizeContact 

            //     });
            // }

            angular.copy($scope.Staff, newStaff);
            newStaff.listingId = $scope.StaffListingId
            newStaff.reference = ref;
            newStaff.employmentHistory = prev;

            return newStaff;
        }

        $scope.updateStaff = function (staffObj,role) {
            console.log("updateStaff");
            console.log(staffObj);
            console.log(role);
            // swal({
            //     title: "Confirm Staff Update",
            //     text: "Are you sure you want to update " +staffObj.firstName + " " + staffObj.lastName + "?",
            //     type: 'warning',
            //     showCancelButton: true,
            //     showConfirmButton: true,
            //     showLoaderOnConfirm: true
            // }, function () {
            //     setTimeout(function () {
            //         update();
            //         //$state.reload();
            //         $state.go('dashboard_staff_list',{daycareId: $stateParams.listingId});
            //     }, function (error) {
            //         swal("Error", error, "error");
            //     });
            // });

            var update = function(){
                staffObj.reference = $scope.reference;
                staffObj.employmentHistory = $scope.prevEmployer;
                staffService.updateStaff({staffObj:staffObj},
                    function(res){
                        console.log("ServerUpdateStaff");
                        console.log(res);
                    });
            }
            update();
            $state.go('dashboard_staff_list',{daycareId: $stateParams.listingId});
        }

        $scope.submitAddStaff = function () {

            $scope.status = 'Saving...';
            // $scope.Staff.role = $scope.role.value;
            $scope.Staff.listingId = $stateParams.listingId;

            console.log("Adding Staff: " + $scope.Staff + " for " + $scope.Staff.listing_id);

            staffService.addStaff($scope.Staff, function (_res) {
                console.log("Staff Added");
                $state.go('dashboard_staff_list',{daycareId: $stateParams.listingId});
            });

            $scope.Staff = {};
        }

        

        $scope.addPrevEmployer = function(){
            
            var newData = {"formName":"prevEmployer"+$scope.prevEmployer.length+1,
            "name":"",
            "address":"",
            "phoneNumber":"",
            "contactFirstName":"",
            "contactMiddleInitial":"",
            "contactLastName":"",
            "contactEmail":"",
            "employmentStart":"",
            "employmentEnd":"",
            "reason":"",
            "authorizeContact":true};

            $scope.prevEmployer.push(newData);
            if(!$scope.$$phase){
                $scope.$apply();
            }
        }

        $scope.removePrevEmployer = function(){
            swal({
                title: "Remove Employer #"+$scope.prevEmployer.length+"?",
                text: "Clicking Yes will result in permanent deletion of data for Employer #"+$scope.prevEmployer.length+".",
                type: "warning",
                showConfirmButton: true,
                confirmButtonText: "Yes",
                showCancelButton: true,
                cancelButtonText: "No"
            },
            function(isConfirm){
                if(isConfirm){
                    var length = $scope.prevEmployer.length-1;
                    $scope.prevEmployer.splice(length);
                    if(!$scope.$$phase){
                        $scope.$apply();
                    }
                }
            });
            $('div.sweet-alert button.cancel').focus();
        }

        $scope.addReference = function(){
            
            var newData = {
                formName:"staffRef"+$scope.reference.length+1,
                firstName:"",
                midInitial:"",
                lastName:"",
                email:"",
                phoneNumber:""
            };

            $scope.reference.push(newData);
            if(!$scope.$$phase){
                $scope.$apply();
            }
        }

        $scope.removeReference = function(){
            swal({
                title: "Remove Reference #"+$scope.reference.length+"?",
                text: "Clicking Yes will result in permanent deletion of data for Reference #"+$scope.reference.length+".",
                type: "warning",
                showConfirmButton: true,
                confirmButtonText: "Yes",
                showCancelButton: true,
                cancelButtonText: "No"
            },
            function(isConfirm){
                if(isConfirm){
                    var length = $scope.reference.length-1;
                    $scope.reference.splice(length);
                    if(!$scope.$$phase){
                        $scope.$apply();
                    }
                }
            });
            $('div.sweet-alert button.cancel').focus();
        }

        $scope.checkProgress = function(form,index,nextFormName,switchTo){
            if(form.$valid){
                $(window).scrollTop(0);
                console.log("Form is Valid.");
                if(index==1){
                    $scope.progress.staff = true;
                }
                if(index==2){
                    $scope.progress.reference = true;
                }
                if(index==3){
                    $scope.progress.employment = true;
                    $scope.newStaff = createNewStaff();
                    console.log($scope.newStaff);
                }
                if (nextFormName) {
                    $scope[nextFormName].$setPristine();
                }
                switchStaffForm(switchTo ? switchTo : ++index);
            }
            if(form.$invalid){
                form.$setSubmitted();
                setTimeout(function () {
                    form.$submitted = true;
                    var firstErrorElement = angular.element("[name='" + form.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    firstErrorElement.focus();
                    $("html, body").animate({scrollTop: firstErrorElement.offset().top - 300}, 1000);
                }, 1);
            }
            if(!$scope.$$phase){
                $scope.$apply();
            }
        }

        //NOTE: this is a DUPLICATE function of submitAddStaff
        $scope.submitNewStaff = function(){
            console.log("Submitting: "+JSON.stringify($scope.newStaff));
            staffService.addStaff($scope.newStaff,function(res){
                console.log(res);
            });
        };

        // only allow to transition to other form if current form is completed
        $scope.overrideFormSequence = function(index,formName){
            console.log("Switch to Form "+index+" from "+index + " >> " + formName) ;
            if (Math.abs($scope.progress.currentIndex-index) <= 1) {
                console.log("overrideClient Warn");
                if (index > $scope.progress.currentIndex) {
                    console.log("Moving forward - " + $scope.progress.currentIndex)

                    switch ($scope.progress.currentIndex) {
                        case 1:
                            $scope.checkProgress($scope['StaffForm'],1,formName,index);
                            // $scope['StaffForm'].$setSubmitted();
                            break;
                        case 2:
                            $scope.checkProgress($scope['StaffRef'],2,formName,index);
                            // $scope['StaffRef'].$setSubmitted();
                            break;
                        case 3:
                            $scope.checkProgress($scope['StaffEmployment'],3,formName,index);
                            // $scope['StaffEmployment'].$setSubmitted();
                            break;
                        default:
                            break;
                    }
                } else {
                    console.log("Staying .. ")
                    if (formName) {
                        $scope[formName].$setPristine();
                    }
                    switchStaffForm(index);
                }
            }


        }

        $scope.selectAllStaff = function(allChecked) {
            $scope.staffToDelete = 0;

            angular.forEach($scope.daycareList, function(daycare) {
                angular.forEach(daycare.staffs, function(val) {
                    if (val.toBeDeleted = allChecked) {
                        $scope.staffToDelete++;
                    }
                });
            });
        };

        $scope.onSelectStaff = function(isChecked) {
            isChecked ? $scope.staffToDelete++ : (!(--$scope.staffToDelete) ? $scope.allChecked = false : true);
        };

        $scope.deleteSelectedStaff = function() {
            swal({
                title: "Delete Staff?",
                text: "Are you sure you want to delete the selected staff?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                showLoaderOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    var tasks = [];
                    angular.forEach($scope.daycareList, function(daycare) {
                        angular.forEach(daycare.staffs, function(val) {
                            if (val.toBeDeleted) {
                                tasks.push(deleteStaff(val._id).$promise);
                            }
                        });
                    });

                    $q.all(tasks).then(function(data) {
                        angular.forEach(data, function(dataVal) {
                            if (dataVal._id) {
                                var go = true;
                                angular.forEach($scope.daycareList, function(dayare) {
                                    angular.forEach(daycare.staffs, function(staffVal, key) {
                                        if (!go) { return; }
                                        if (staffVal._id === dataVal._id) {
                                            $scope.staffData.splice(key, 1);
                                            daycare.staffs.splice(key, 1);
                                            $scope.staffToDelete--;
                                            go = false;
                                            $scope.allChecked = false;
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            });
            $('div.sweet-alert button.cancel').focus();
        }

        function deleteStaff(id) {
            var query = staffService.removeStaff({staffId: id}, function(res) {
                console.log(res);
            });

            return query;
        }

        $scope.gpComponents = {
            locality: 'long_name',
            sublocality: 'long_name',
            administrative_area_level_1: 'short_name',
            neighborhood: 'long_name',
            postal_code: 'short_name'
        };
        $scope.gpCallback = function(result, place, address) {
            console.log('*** Google Autocomplete result ***');
            console.log(result);
            console.log('*** Google Autocomplete original place data ***');
            console.log(place);
            var addrObj = {};
            addrObj.zip = result.postal_code;
            addrObj.city = result.city;
            addrObj.state = result.administrative_area_level_1;
            angular.extend(address ? address : $scope.Staff, addrObj);
        };

        $scope.switchStaffForm = switchStaffForm;
        function switchStaffForm(index) {
            if (index == 1) {
                console.log("Switching NOW to 1");
                $('#crumbStaff').tab('show');
                hackService.tryFocusToElem('form[name="StaffForm"] input[name="firstName"]');
            } else if (index == 2) {
                console.log("Switching NOW to 2");
                $('#crumbReference').tab('show');
                hackService.tryFocusToElem('form[name="StaffRef"] input[name="'+$scope.reference[0].formName+'firstName"]');
            } else if (index == 3) {
                console.log("Switching NOW to 3");
                $('#crumbEmployment').tab('show');
                hackService.tryFocusToElem('form[name="StaffEmployment"] input[name="employmentStart"]');
            } else if (index == 4) {
                console.log("Switching NOW to 4");
                $('#crumbComplete').tab('show');
            }
            $scope.progress.currentIndex = index;
        };

        $scope.setForm = function(name, formObj) {
            $scope[name] = formObj;
        };

        $scope.cancel = function(state, options){
            swal({
                title: "Cancel Changes?",
                text: "Are you sure you want to cancel your changes?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                showLoaderOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    $state.go(state, options);
                    setTimeout(function () {
                        $("html, body").animate({scrollTop: 0}, 200);
                    }, 1);
                }
            });
            $('div.sweet-alert button.cancel').focus();
        };

        function syncLocalData(data) {
            angular.forEach(data.employmentHistory, function(val, key) {
                if (key > 2) {
                    $scope.prevEmployer.push(angular.copy(val));
                    $scope.prevEmployer[key].formName = "prevEmployer" + (key+1);
                } else {
                    angular.merge($scope.prevEmployer[key], val);
                }
            });

            angular.forEach(data.reference, function(val, key) {
                angular.merge($scope.reference[key], val);
            });
        }

        function dateToMilli(date) {
            if(date!=null){
                var d = Date.parse(date.replace(/\u200E/g,''));
                d = new Date(d);
                return d;
            }
            return 0;
            
        };
        self.dateToMilli = dateToMilli;
        $scope.dateToMilli = dateToMilli;

    }
})();
