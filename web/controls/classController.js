(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('classCtrl', classCtrl);

    classCtrl.$inject = [
        '$state',
        '$stateParams',
        '$q',
        '$rootScope',
        '$scope',
        'AuthService',
        'classService',
        'reviewService',
        'staffService'
    ];

    function classCtrl($state, $stateParams, $q, $rootScope, $scope, AuthService, classService, reviewService, staffService) {
        console.log("ClassCtrlInitialize");
        var self = this;

        self.user = angular.copy(AuthService.getUser());

        self.classesToDelete = 0;

        self.classId = null;

        self.updateMode = false;

        self.classFormData = {
            providerId : self.user._id,
            name : "",
            ageGroup: {
                min: null,
                max: null
            },
            capacityMax: null,
            capacityTaken: null,
            capacityVacant: null,
            teacher:['']
        };

        self.ageGroups = [
            {min:0,max:1,name:'Infants (0 - 1 year)'},
            {min:1,max:2,name:'1 - 2 years'},
            {min:2,max:3,name:'2 - 3 years'},
            {min:3,max:4,name:'3 - 4 years'},
            {min:4,max:5,name:'4 - 5 years'},
            {min:5,max:0,name:'5 years +'},
            {name:'Other'}
        ];

        self.ageGroupTimes = ['weeks', 'months', 'years'];

        self.progress = {
            updateMode:false,
            formIndex: 1,
            overviewCompleted: false
        };

        self.floaterInit = {initTop: 200, topOffset: 200};
        self.rightOffset = 15;
        self.headerHeight = 126;

        self.setForm = function(name, formObj) {
            self[name] = formObj;
        };

        self.switchClassForm = function(data){
            $(window).scrollTop(0);
            console.log("Switching forms to " + data);
            if(data == 1){
                console.log("Switching NOW to " + data);
                $('#crumbOverview a').tab('show');
                // hackService.tryFocusToElem(
                //     data==1 ? 'form[name="clientFormStudent"] input[name="clientFormFirstName"]' : 'form[name="clientFormPedia"] input[name="clientFormPedFirstName"]'
                // );
            }else if(data == 2){
                console.log("Switching NOW to 2");
                $('#crumbComplete a').tab('show');
            }

            self.progress.formIndex = data;
            
            if(!$scope.$$phase){
                $scope.$apply();
            }
        }

        self.submitClassForm = function(data,index,skipped,dontSwitch){
            console.log("Submitting :" + index);

            if(index==1){

                console.log("a class: "+JSON.stringify(data));
                
                self.progress.overviewCompleted = true;
                
                if (!dontSwitch) {
                    self.switchClassForm(2);
                }
                
            }else{

                console.log("no index. not submitting anything");
                
            }
        };

        self.verifyClassForm = function(formObj,dataObj,index,nextFormName,switchTo){
            if(formObj.$invalid){
                console.log("Form is Invalid.");
                formObj.$submitted = true;
                setTimeout(function () {
                    var firstErrorElement = angular.element("[name='" + formObj.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    firstErrorElement.focus();
                    $("html, body").animate({scrollTop: firstErrorElement.offset().top - 300}, 1000);
                }, 1);

                return;
            }

            $(window).scrollTop(0);
            console.log("Form is Valid.");
            self.verifyData = dataObj;
            self.progress.formIndex = index;
            console.log("Index: "+index+" Verify Data:");
            console.log(self.verifyData);

            self.submitClassForm(self.verifyData, index, false, switchTo?true:false);

            if (nextFormName) {
                self[nextFormName].$setPristine();
            }
            if (switchTo) {
                self.switchClassForm(switchTo);
            }
            
        };

        self.overrideClassFormSequence = function(index,formName,dataObj){
            console.log("overrideClassFormSequence: "+index);

            if (Math.abs(self.progress.formIndex-index) <= 1) {
                console.log("overrideClass Warn");
                if (index > self.progress.formIndex) {
                    switch (self.progress.formIndex) {
                        case 1:
                            self.verifyClassForm(self['classOverviewForm'],dataObj,1,formName,index);
                            break;
                        default:
                            break;
                    }
                } else {
                    if (formName) {
                        self[formName].$setPristine();
                    }
                    self.switchClassForm(index);
                }
            }
        };

        self.saveNewClass = function(){
            self.classFormData.ageGroup.min = Number(self.classFormData.ageGroup.min);
            self.classFormData.ageGroup.max = Number(self.classFormData.ageGroup.max);
            self.classFormData.listingId = $stateParams.listingId;
            console.log("Submitting: "+ JSON.stringify(self.classFormData));
            classService.save(self.classFormData,function(res){
                if(res)console.log(res);
                $state.go('dashboard_class');
            })
        };

        self.updateClass = function(){
            console.log("Updating: "+ JSON.stringify(self.classFormData));
            self.classFormData.ageGroup.min = Number(self.classFormData.ageGroup.min);
            self.classFormData.ageGroup.max = Number(self.classFormData.ageGroup.max);
            classService.update({classId:self.classFormData._id},self.classFormData,function(res){
                if(res)console.log(res);
                $state.go('dashboard_class');
            });
        };

        self.deleteClass = function(id) {
            return classService.delete({classId:id},function(res) {
                console.log(res);
            });
        };

        self.deleteSelectedClasses = function() {
            swal({
                title: "Delete Classes?",
                text: "Are you sure you want to delete the selected classes?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                showLoaderOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    var tasks = [];
                    angular.forEach(self.daycareList, function(daycare) {
                        angular.forEach(daycare.classList, function(val) {
                            if (val.toBeDeleted) {
                                tasks.push(self.deleteClass(val._id).$promise);
                            }
                        });
                    });

                    $q.all(tasks).then(function(data) {
                        angular.forEach(data, function(dataVal) {
                            if (dataVal._id) {
                                var go = true;

                                angular.forEach(self.daycareList, function(daycare) {
                                    angular.forEach(daycare.classList, function(classVal, key) {
                                        if (!go) { return; }
                                        if (classVal._id === dataVal._id) {
                                            daycare.classList.splice(key, 1);
                                            self.classesToDelete--;
                                            go = false;
                                            self.allChecked = false;
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
        
        self.selectAllClasses = function(allChecked) {

            self.classesToDelete = 0;

            angular.forEach(self.daycareList, function(daycare) {
                angular.forEach(daycare.classList, function(val) {
                    if (val.toBeDeleted = allChecked) {
                        self.classesToDelete++;
                    }
                });
            });
        };

        self.isSelectAllDisabled = function() {
            return self.daycareList && self.daycareList.every(function(daycare) {
                return daycare.classList && daycare.classList.length <= 0;
            });
        };

        self.onSelectClass = function(isChecked) {
            isChecked ? self.classesToDelete++ : self.classesToDelete--;

            var totalNumberOfClasses = self.classListLength;
            var numOfClassesToDelete = self.classesToDelete || 0;

            console.log("Classes to delete: " + totalNumberOfClasses + " vs. " + numOfClassesToDelete);

            if(totalNumberOfClasses > numOfClassesToDelete) {
                self.allChecked = false;
            } else if(totalNumberOfClasses == numOfClassesToDelete) {
                self.allChecked = true;
            }
        }

        self.cancel = function(state, options){
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

        self.printTeachers = function() {
            if (!self.classFormData || !self.classFormData.teachers) {
                return '';
            }

            var teachers = self.classFormData.teachers.map(function(teacher) {
                if (!self.staffHash || !self.staffHash[teacher]) {
                    return '';
                }
                return self.staffHash[teacher].firstName + ' ' + self.staffHash[teacher].lastName
            });

            return teachers.join('</br>');
        };

        $scope.setAgeGroup = function(index){
            if (index <  self.ageGroups.length - 1) {
                self.classFormData.ageGroup.min = self.ageGroups[index].min;
                // defaults to years
                self.classFormData.ageGroup.minTime = self.ageGroupTimes[self.ageGroupTimes.length-1];
                self.classFormData.ageGroup.max = self.ageGroups[index].max;
                // defaults to years
                self.classFormData.ageGroup.maxTime = self.ageGroupTimes[self.ageGroupTimes.length-1];
                console.log("self.classFormData.ageMin"+self.classFormData.ageGroup.min);
                console.log("self.classFormData.ageMax"+self.classFormData.ageGroup.max);
            }
        }



        onLoad();

        function onLoad(){
            console.log("ClassCtrlLoading");

            if($state.current.name == "dashboard_class"){
                self.classListLength = 0;
                reviewService.getMyDaycares(self.user._id).then(function(daycares) {
                    self.daycareList = daycares;
                    daycares.forEach(function(daycare) {
                        classService.get({providerId:self.user._id, listingId: daycare._id},function(res){
                            if(res){
                                daycare.classList = res;
                                console.log("Class list : "  + daycare.classList.length);
                                if(daycare.classList.length > 0){
                                    self.classListLength += daycare.classList.length
                                }

                            }
                        });
                    });
                });
            }
            if($state.current.name == "dashboard_class_update"){

                console.log("Update Class: "+$stateParams.classId+ " provider: "+self.user._id);
                self.progress.updateMode = true;

                classService.getClass({classId: $stateParams.classId}, function(response){
                    console.log("response: "+JSON.stringify(response));
                    self.classFormData = response;
                    self.ageInput = self.ageGroups.findIndex(function(ageGroup) {
                        return ageGroup.min === response.ageGroup.min && response.ageGroup.minTime === self.ageGroupTimes[self.ageGroupTimes.length-1] &&
                            ageGroup.max === response.ageGroup.max && response.ageGroup.maxTime === self.ageGroupTimes[self.ageGroupTimes.length-1];
                    });
                    self.ageInput === -1 && (self.ageInput = self.ageGroups.length-1);
                    self.ageInput += '';
                    console.log("Class: "+JSON.stringify(self.classFormData));
                    loadStaffOptions(response.listingId);
                });
                


            }
            if($state.current.name == "dashboard_class_register"){
                loadStaffOptions($stateParams.listingId);
            }
            console.log("ClassCtrlLoadingDone");
        }

        function loadStaffOptions(listingId) {
            staffService.getStaff({listingId: listingId}, function(response) {
                self.staffHash = {};
                self.staffOptions = response.map(function(staff) {
                    self.staffHash[staff._id] = staff;
                    return {
                        label: staff.firstName + ' ' + staff.lastName,
                        value: staff._id
                    };
                });
            });
        }
    }
})();