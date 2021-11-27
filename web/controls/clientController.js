(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('clientCtrl', clientCtrl);

    clientCtrl.$inject = [
        '$q',
        '$state',
        '$stateParams',
        '$rootScope',
        '$scope',
        '$window',
        'AuthService',
        'clientService',
        'stateService',
        'listingService',
        'hackService',
        'classService',
        'reviewService'
    ];

    function clientCtrl($q,$state,$stateParams,$rootScope, $scope, $window, AuthService, clientService, stateService, listingService, hackService, classService, reviewService) {
        
        $scope.user = angular.copy(AuthService.getUser());
        $scope.clientData = [];

        $scope.emailRegex = AuthService.emailRegex;

        $scope.floaterInit = {initTop: 200, topOffset: 200};
        $scope.rightOffset = 15;
        $scope.headerHeight = 126;

        $scope.sortType     = 'student.firstName';
        $scope.sortReverse  = false;

        var placeHolder = {
            name : 'Loading ...',
            age:'Loading ...',
            gender:'Loading ...'
        };

        $scope.progress = {
            updateMode:false,
            formIndex: 1,
            primaryCompleted: false,
            secondaryCompleted: false,
            studentCompleted: false
        };

        $scope.listing = {};

        $scope.newClientId = "";
        $scope.newPrimaryGuardian = "";
        $scope.clientData.push(placeHolder);

        $scope.daycareId=$stateParams.daycareId;
        $scope.providerId=$scope.user._id;

        $scope.clientObj = {
            daycareId: $scope.daycareId,
            providerId: $scope.providerId,
            noSecondary: false
        }

        // cache for submitted forms
        $scope.primaryGuardianData = {};
        $scope.secondaryGuardianData = {};
        $scope.studentData = {};

        // form model template
        $scope.formDataTemplate = {
            // profile info
            relationship:'father',
            firstName:"",
            lastName:"",
            middleInitial:"",
            birth:"",
            // birthM:null,
            // birthD:null,
            // birthY:null,
            custody:"",
            emergencyContact: 'Y',
            employer:"",
            age:"",
            // contact info
            mailing_address:{},
            work_address:{},
            email:"",
            contactNum:"",
            mobileNum:"",
            workNum:"",
        };

        // form model
        $scope.clientPrimaryGuardian = {};
        $scope.clientSecondaryGuardian = {};

        angular.copy($scope.formDataTemplate,$scope.clientPrimaryGuardian);
        angular.copy($scope.formDataTemplate,$scope.clientSecondaryGuardian);

        $scope.clientStudent = {
            firstName:"",
            lastName:"",
            middleInitial:"",
            birth:null,
            // birthM:null,
            // birthD:null,
            // birthY:null,
            age:null,
            mailing_address:"",
            gender:"male",
            pediatrician: {
                firstName:"",
                lastName:"",
                middleInitial:"",
                work_address:"",
                officeName:"",
                workNum:"",
            }
        };

        $scope.clientsToDelete = 0;

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

        $scope.datePick = {
            m : [],
            d : [],
            y : []
        }
        $scope.inputDate = {
            
        }

        $scope.dateRegex = /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d$/;
        generateMDY();

        // Write all functions after this line for proper $scope variables initialization

        function generateMDY(){
            var m = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sept','Oct','Nov','Dec']
            var d = [];
            var y = [];
            for (var i = 1; i <= 31; i++) {
                d.push(i);
            }

            var year = new Date().getFullYear();
            for (var i = 1970; i <= year; i++) {
                y.push(i);
            }

            $scope.datePick = {
                m : m,
                d : d,
                y : y
            };
        }

        onLoad();
        
        if ($state.current.name == 'addStudent') {

            switchClientForm(1);
            
            console.log("Creating client for daycare: "+$stateParams.daycareId);
            if(!$scope.$$phase){
                $scope.$apply();
            }
        }

        if ($state.current.name == 'updateStudent') {
            $scope.progress.updateMode=true;
            $scope.newClientId = $stateParams.clientId;

            clientService.getClientData({clientId:$scope.newClientId},
                function(res){
                    if(res){
                        //console.log("Updating: "+JSON.stringify(res));
                        for(var client in res){
                            if(res[client]!=null){
                                if(client == 'student'){
                                    $scope.progress.studentCompleted = true;
                                    //console.log("student:"+JSON.stringify(res[client]));
                                    angular.copy(res[client],$scope.clientStudent);
                                    //$scope.clientStudent = res[client];
                                }
                                if(client == 'primaryGuardian'){
                                    $scope.progress.primaryCompleted = true;
                                    //console.log("primaryGuardian:"+JSON.stringify(res[client]));
                                    angular.copy(res[client],$scope.clientPrimaryGuardian);
                                    //$scope.clientPrimaryGuardian = res[client];
                                }
                                if(client == 'secondaryGuardian'){
                                    $scope.progress.secondaryCompleted = true;
                                    //console.log("secondaryGuardian:"+JSON.stringify(res[client]));
                                    angular.copy(res[client],$scope.clientSecondaryGuardian);
                                    //$scope.clientSecondaryGuardian = res[client];
                                }
                                if(client == 'client') {
                                    $scope.clientObj = res[client];
                                    console.log($scope.clientObj);
                                }

                            }
                            
                            
                            //console.log("Client:"+JSON.stringify(res[client]));
                        }
                        if(!$scope.$$phase){
                            $scope.$apply();
                        }
                    }
                });

            switchClientForm(1);

            console.log("Updating client: "+$stateParams.clientId);
            if(!$scope.$$phase){
                $scope.$apply();
            }
        }

        if ($state.current.name == 'dashboard_client_list') {
            loadClients();
            $(window).scrollTop(0);
        }

        $scope.listingInit = listingInit;
        $scope.loadClients = loadClients;
        $scope.toggleClientList = toggleClientList;
        $scope.loadFormForClient = loadFormForClient;
        $scope.switchClientForm = switchClientForm;
        $scope.verifyClientForm = verifyClientForm;
        $scope.submitClientForm = submitClientForm;
        $scope.calculateAge = _calculateAge;
        $scope.zipCheck = zipCheck;
        $scope.validateZip = validateZip;
        $scope.copyHomeAddress = copyHomeAddress;
        $scope.copyPrimaryAddress = copyPrimaryAddress;
        $scope.isFormActive = isFormActive;
        $scope.overrideClientFormSequence = overrideClientFormSequence;
        $scope.saveNewClient = saveNewClient;
        $scope.updateClient = updateClient;
        $scope.updateClientStudent = updateClientStudent;
        $scope.updateClientGuardian = updateClientGuardian;
        $scope.deleteSelectedClients = deleteSelectedClients;
        $scope.getChildAge = getChildAge;
        $scope.cancel = cancel;
        $scope.setForm = setForm;
        $scope.checkSecondary = checkSecondary;
        $scope.onPrimaryCustody = onPrimaryCustody;
        $scope.selectAllClients = selectAllClients;
        $scope.onSelectClient = onSelectClient;
        $scope.sortClient = sortClient;

        $scope.gpComponents = {
            locality: 'long_name',
            sublocality: 'long_name',
            administrative_area_level_1: 'short_name',
            neighborhood: 'long_name',
            postal_code: 'short_name'
        };

        function loadClients(){
            var user = AuthService.getUser();
            console.log("Load Clients for: "+user._id);

            $scope.daycareList = []
            $scope.clientData = []

            reviewService.getMyDaycares(user._id)
                .then(
                    function (daycares) {
                        console.log("daycares: " + daycares.length );

                        // Request daycares' clients
                        angular.forEach(daycares,function(daycare){

                            var daycareId = daycare._id;
                            var daycareName = daycare.name;
                            var data = {
                                daycareId:daycareId,
                                daycareName:daycareName,
                                clients:[]
                            };


                            clientService.getDaycareClient({
                                providerId: user._id,
                                daycareId: daycareId
                            },function(clients){

                                if(clients){
                                    // console.log("clients: "+clients.length);
                                    clients.$promise.then(
                                        function(_clients){

                                            data.clients = clients;

                                            $scope.daycareList.push(data);
                                            $scope.clientData.push(clients);

                                        });

                                }else{
                                    self.wizardProgress.isImpossible = true;
                                    swal({
                                        title:'No Clients Available',
                                        text:'No Clients to send the Form',
                                        type:'warning'
                                    },function(){
                                        $state.go('document_form_list');
                                    })
                                }

                            });


                        });
                    },
                    function (err) {
                        console.warn(err);
                    }
                );
        }

        function listingInit(daycareId){
            console.log("listingInit: "+daycareId);
            listingService.get({listingId:daycareId}, function(res) {
                if (res.listing) {
                    $scope.listing = res.listing;
                } else {
                    console.warn(res);
                }
            });
        }
        

        function sortClient(sort){
            if($scope.sortType == sort){
                $scope.sortReverse = !$scope.sortReverse;
            }
            $scope.sortType = sort;
        }

        function loadFormForClient(id){
            console.log("loadFormForClient: "+id);
            $state.go('addStudent',{daycareId:id});
        }

        function toggleClientList(id){

            if ($('.client-' + id).hasClass('hidden')){
                $('.client-' + id).removeClass('hidden');
                $('#btn-' + id).attr('value', '-');
            }
            else {
                $('.client-' + id).addClass('hidden');
                $('#btn-' + id).attr('value', '+');
            }
            
        }

        function switchClientForm (data){
            $(window).scrollTop(0);
            console.log("Switching forms to " + data);
            if(data == 1 || data == 4){
                console.log("Switching NOW to " + data);
                $(data==1?'#crumbStudent a':'#crumbPedia a').tab('show');
                $scope.progress.formIndex = data;
                $scope.clientStudent.mailing_address = angular.copy($scope.clientPrimaryGuardian.mailing_address);
                delete $scope.clientStudent.mailing_address.suite;
                $scope.clientFormData = $scope.clientStudent;
                hackService.tryFocusToElem(
                    data==1 ? 'form[name="clientFormStudent"] input[name="clientFormFirstName"]' : 'form[name="clientFormPedia"] input[name="clientFormPedFirstName"]'
                );
            }else if(data == 2){
                console.log("Switching NOW to 2");
                $('#crumbPrimary a').tab('show');
                $scope.progress.formIndex = 2;
                $scope.clientPrimaryGuardian.type = "primary";
                if (!$scope.clientPrimaryGuardian.custody)
                    $scope.clientPrimaryGuardian.custody = "sole";
                $scope.clientFormData = $scope.clientPrimaryGuardian;

                //$scope.clientPrimaryGuardian.mailing_address = angular.copy($scope.primaryGuardianData.mailing_address);
                copyHomeAddress($scope.clientFormData);
                hackService.tryFocusToElem('form[name="clientForm"] select[name="clientFormRelationship"]');
            }else if(data == 3){
                console.log("Switching NOW to 3");
                $('#crumbSecondary a').tab('show');
                $scope.progress.formIndex = 3;
                $scope.clientSecondaryGuardian.type = "secondary";
                if (!$scope.clientObj.noSecondary) {
                    if (!$scope.clientSecondaryGuardian.custody)
                        $scope.clientSecondaryGuardian.custody = "none";
                    $scope.clientFormData = $scope.clientSecondaryGuardian;

                    if($scope.clientFormData.sameAsPrimary) {
                        $scope.clientSecondaryGuardian.mailing_address = angular.copy($scope.clientPrimaryGuardian.mailing_address);
                        $scope.secondaryGuardianData.mailing_address = angular.copy($scope.clientPrimaryGuardian.mailing_address);
                    }
                    copyHomeAddress($scope.clientFormData);
                } else {
                    $scope.clientFormData = {};
                }
                hackService.tryFocusToElem('form[name="clientFormSecondary"] select[name="clientFormRelationship"]');
            }else if(data == 5){
                console.log("Switching NOW to 5");
                $('#crumbComplete a').tab('show');
                $scope.progress.formIndex = 5;
            }
            //$(window).scrollTo(0, 0);
            

            if(!$scope.$$phase){
                $scope.$apply();
            }
        }

        function overrideClientFormSequence(index,formName,dataObj){
            console.log("overrideClientFormSequence: "+index);
            //console.log($scope.progress);
            // if($scope.progress.updateMode==true){
            //     console.log("overrideClient update");
            //     switchClientForm(index);
            // }

            if (Math.abs($scope.progress.formIndex-index) <= 1) {
                console.log("overrideClient Warn");
                // swal({
                //   type: "warning",
                //   title: "Unsaved Changes will be Lost",
                //   text: "Any updates to this form that have not been saved will be lost upon moving to another tab. Would you like to save your updates?",
                //   showConfirmButton: true,
                //   showCancelButton: true,
                //   confirmButtonText: "Yes",
                //   cancelButtonText: "No"
                // },function(isConfirm){
                //     if (isConfirm) {
                //         switch ($scope.progress.formIndex) {
                //             case 1:
                //                 verifyClientForm($scope['clientFormStudent'],dataObj,1,formName,index);
                //                 break;
                //             case 2:
                //                 verifyClientForm($scope['clientForm'],dataObj,2,formName,index);
                //                 break;
                //             case 3:
                //                 verifyClientForm($scope['clientFormSecondary'],dataObj,3,formName,index);
                //                 break;
                //             default:
                //                 break;
                //         }
                //     } else {
                //         switchClientForm(index);
                //     }
                //     $scope[formName].$setPristine();
                //     if(!$scope.$$phase){
                //         $scope.$apply();
                //     }
                // });
                if (index > $scope.progress.formIndex) {
                    switch ($scope.progress.formIndex) {
                        case 1:
                            verifyClientForm($scope['clientFormStudent'],dataObj,1,formName,index);
                            break;
                        case 2:
                            verifyClientForm($scope['clientForm'],dataObj,2,formName,index);
                            break;
                        case 3:
                            verifyClientForm($scope['clientFormSecondary'],dataObj,3,formName,index);
                            break;
                        case 4:
                            verifyClientForm($scope['clientFormPedia'],dataObj,4,formName,index);
                            break;
                        default:
                            break;
                    }
                } else {
                    if (formName) {
                        $scope[formName].$setPristine();
                    }
                    switchClientForm(index);
                }
            }
        }

        function verifyClientForm(formObj,dataObj,index,nextFormName,switchTo){
            if(formObj.$invalid && (index != 3 || !$scope.clientObj.noSecondary)){
                console.log("Form is Invalid.");
                // console.log(formObj.$error);
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
            $scope.verifyData = dataObj;
            $scope.progress.formIndex = index;
            //$scope.verifyData.index = index;
            console.log("Index: "+index+" Verify Data:");
            console.log($scope.verifyData);
            // var y =parseInt($scope.verifyData.birthY);
            // var m =parseInt($scope.verifyData.birthM);
            // var d =parseInt($scope.verifyData.birthD);
            // console.log("%s %s %s",y,m,d);
            // $scope.verifyData.birth = new Date(y,m,d);
            

            // if(index == 1){
            //     $('#confirm-submit-student').modal('show');
            //     return;
            // }

            // if($scope.verifyData.birth){
            //     // TODO: get Date from select input
                
            //     dataObj.age = _calculateAge($scope.verifyData.birth);
            //     console.log($scope.verifyData.birth+" --> Calculate Age: "+$scope.verifyData.age);
                
            // }
            // $('#confirm-submit').modal('show');

            if (index != 3 || !$scope.clientObj.noSecondary) {
                $scope.submitClientForm($scope.verifyData, index, false, switchTo?true:false);
            }

            if (nextFormName) {
                $scope[nextFormName].$setPristine();
            }
            if (switchTo) {
                switchClientForm(switchTo);
            }
        };
        function getChildAge(y,m,d){
            var _m = parseInt(m);
            var _d = parseInt(d)+1;
            var _y = parseInt(y);
            var day = new Date(_y,_m,_d);
            console.log("Birth "+day);
            $scope.clientStudent.birth = day;
            return _calculateAge(day);
        }
        function _calculateAge(birthday) { // birthday is a date
            if (birthday) {
                var birthday = new Date(birthday);
                if (birthday.toDateString() != 'Invalid Date') {
                    var msDay = 86400000; // milliseconds in a day
                    var dateNowMs = new Date(new Date().toDateString()).getTime(); // gets today's date with no time ex: Sun Jul 02 2017 00:00:00
                    var ageDifMs = dateNowMs - birthday.getTime();
                    // check for edge case, when ageDifMs is exactly 30 days, add 1 day
                    if (ageDifMs/msDay == 30) {
                        ageDifMs += msDay;
                    }
                    var ageDate = new Date(ageDifMs); // miliseconds from epoch
                    var ageStr = Math.abs(ageDate.getUTCFullYear() - 1970) + ' Years ' + ageDate.getUTCMonth() + ' Months';
                    if ($scope.clientFormData) {
                        $scope.clientFormData.age = ageStr;
                    }
                    return ageStr;
                }
            }
            return '';
        }
                
        function submitClientForm(data,index,skipped,dontSwitch){
            console.log("Submitting :" + index);

            var providerId = $scope.providerId;
            var daycareId = $scope.daycareId;

            if(index==3){

                console.log("a client of "+providerId);
                console.log("a secondary guardian for daycare "+daycareId);

                if (!skipped) {
                    //createClientGuardian(providerId,daycareId,data);
                    $scope.secondaryGuardianData = {};
                    angular.copy(data,$scope.secondaryGuardianData);
                    $scope.secondaryGuardianData.mailing_address = angular.copy($scope.secondaryGuardianData.mailing_address);
                    $scope.secondaryGuardianData.work_address = angular.copy($scope.secondaryGuardianData.work_address);
                    delete $scope.secondaryGuardianData.mailing_address.suite;
                    if ($scope.secondaryGuardianData.work_address)
                        delete $scope.secondaryGuardianData.work_address.apt;

                    console.log("cached: "+JSON.stringify($scope.secondaryGuardianData));
                    
                    $scope.progress.secondaryCompleted = true;
                }

                if (!dontSwitch) {
                    switchClientForm(4);
                }

            }else if(index==2){

                console.log("a client of "+providerId);
                console.log("a primary guardian for daycare "+daycareId);

                var mailing_address = angular.copy(data.mailing_address);
                delete mailing_address.suite;
                $scope.studentData.mailing_address = $scope.clientStudent.mailing_address = mailing_address;
                
                //createClientGuardian(providerId,daycareId,data);
                $scope.primaryGuardianData = {};
                angular.copy(data,$scope.primaryGuardianData);
                $scope.primaryGuardianData.mailing_address = angular.copy($scope.primaryGuardianData.mailing_address);
                $scope.primaryGuardianData.work_address = angular.copy($scope.primaryGuardianData.work_address);
                delete $scope.primaryGuardianData.mailing_address.suite;
                if ($scope.secondaryGuardianData.work_address)
                    delete $scope.primaryGuardianData.work_address.apt;

                console.log("cached: "+JSON.stringify($scope.primaryGuardianData));

                $scope.progress.primaryCompleted = true;

                if (!dontSwitch) {
                    switchClientForm(3);
                }

            }else if(index==1 || index==4){

                console.log("a student: "+JSON.stringify(data));

                //createClientStudent(data);
                $scope.studentData = {};
                angular.copy(data,$scope.studentData);
                
                $scope.progress[(index==1)?'studentCompleted':'pediaCompleted'] = true;

                if (index == 4) {
                    $scope.classes.forEach(function(x, y) {
                        if (x._id == $scope.studentData.class) {
                            $scope.studentData.classroomName = x.name;
                        }
                    });
                }
                
                if (!dontSwitch) {
                    switchClientForm((index==1)?2:5);
                }
                
            }else{

                console.log("no index. not submitting anything");
                
            }
        };

        function updateClientData(clientId, studentId,primaryGuardianId,secondaryGuardianId,callback){

            var update = {};

            update.clientId = clientId;
            update.noSecondary = $scope.clientObj.noSecondary;

            if(studentId){
                update.studentId = studentId;
            }

            if(primaryGuardianId){
                update.primaryGuardianId = primaryGuardianId;
            }

            if(secondaryGuardianId){
                update.secondaryGuardianId = secondaryGuardianId;
            }

            clientService.update(update,function(res){
                if(res){
                    console.log("clientUpdated");
                    callback();
                }
            })
        };

        function cancel(state, options){
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

        function createClientStudent(data){
            data.clientId = $scope.newClientId;
            data.primaryGuardianId = $scope.primaryGuardianData.id;
            clientService.addStudent(data,
                function(res){
                    console.log("newStudentSubmitOk");
                    if($scope.progress.formIndex==3){
                        $scope.studentData = {};
                        angular.copy(res, $scope.studentData);
                        console.log("studentCached: "+JSON.stringify($scope.studentData));

                        updateClientData();

                        if(!$scope.$$phase){
                            $scope.$apply();
                        }
                    }
                }
            );
        };

        function saveNewClient(callback){
            if (!callback) {
                callback = function(){
                    $state.go('dashboard_client_list',{daycareId:$scope.daycareId});
                };
            }

            prepareClient(function(resClientId){

                if(resClientId!=null){
                    var tasks = [];
                    if($scope.progress.primaryCompleted){

                        $scope.primaryGuardianData.clientId = resClientId;
                        tasks.push(saveClientGuardian($scope.primaryGuardianData).$promise);
                    }

                    if($scope.progress.secondaryCompleted){

                        $scope.secondaryGuardianData.clientId = resClientId;
                        tasks.push(saveClientGuardian($scope.secondaryGuardianData).$promise);
                    }

                    if($scope.progress.studentCompleted && $scope.progress.pediaCompleted){

                        $scope.studentData.clientId = resClientId;
                        tasks.push(saveClientStudent($scope.studentData).$promise);
                    }

                    // after all documents are saved, update client table
                    $q.all(tasks).then(function(data) {

                        console.log("QResponse: "+JSON.stringify(data));
                        var studentId = "";
                        var primaryGuardianId = "";
                        var secondaryGuardianId = "";

                        for (var i = data.length - 1; i >= 0; i--) {

                            var id = data[i]._id;
                            if(data[i].type=='primary'){

                                primaryGuardianId = id;

                            }else if(data[i].type=='secondary'){

                                secondaryGuardianId = id;

                            }else{

                                studentId = id;

                            }
                        }

                        updateClientData(resClientId,studentId,primaryGuardianId,secondaryGuardianId,callback);
                    });
                }
            });
        };

        function prepareClient(callback){

            console.log("Client : { provider: "+$scope.clientObj.providerId+" , daycare: "+$scope.clientObj.daycareId);

            clientService.add($scope.clientObj,
            function(res){
                if(res){
                    callback(res._id);
                }else{
                    callback(null);

                }

            });
        };

        function saveClientStudent(data){
            var query = clientService.addStudent(data,
                function(){
                    console.log("studentSaved");
                }
            );

            return query;
        };

        function saveClientGuardian(data){
            var query = clientService.addGuardian(data,
                function(){
                    console.log("guardianSaved");
                }
            );
            return query;
        }

        function updateClient(callback) {
            if (!callback) {
                callback = function(){
                    $state.go('dashboard_client_list',{daycareId:$scope.daycareId});
                };
            }

            var tasks = [],
                clientId = $scope.clientObj._id;

            if($scope.progress.primaryCompleted){
                if ($scope.clientObj.primaryGuardianId) {
                    tasks.push(updateClientGuardian($scope.primaryGuardianData).$promise);
                } else {
                    $scope.primaryGuardianData.clientId = clientId;
                    tasks.push(saveClientGuardian($scope.primaryGuardianData).$promise);
                }
            }

            if($scope.progress.secondaryCompleted){
                if ($scope.clientObj.secondaryGuardianId) {
                    if ($scope.clientObj.noSecondary) {
                        tasks.push(removeGuardian($scope.clientObj.secondaryGuardianId).$promise);
                    } else {
                        tasks.push(updateClientGuardian($scope.secondaryGuardianData).$promise);
                    }
                } else {
                    $scope.secondaryGuardianData.clientId = clientId;
                    tasks.push(saveClientGuardian($scope.secondaryGuardianData).$promise);
                }
            }

            if($scope.progress.studentCompleted && $scope.progress.pediaCompleted){
                if ($scope.clientObj.studentId) {
                    tasks.push(updateClientStudent($scope.studentData).$promise);
                } else {
                    $scope.studentData.clientId = clientId;
                    tasks.push(saveClientStudent($scope.studentData).$promise);
                }
            }

            // after all documents are saved, update client table
            $q.all(tasks).then(function(data) {

                console.log("QResponse: "+JSON.stringify(data));
                var studentId = "";
                var primaryGuardianId = "";
                var secondaryGuardianId = "";

                for (var i = data.length - 1; i >= 0; i--) {

                    var id = data[i]._id;
                    if (id) {
                        if(data[i].type=='primary'){

                            primaryGuardianId = id;

                        }else if(data[i].type=='secondary'){

                            secondaryGuardianId = id;

                        }else{

                            studentId = id;

                        }
                    }
                }

                updateClientData(clientId,studentId,primaryGuardianId,secondaryGuardianId,callback);
            });
        }

        function updateClientStudent(data){
            // TODO: Student Client info update
            /*if(form.$valid){
                console.log("UpdateStudentValid");

            }
            if(form.$invalid){
                console.log("UpdateStudentInvalid:"+JSON.stringify(form.$error));
            }*/
            console.log("UpdateStudent:"+JSON.stringify(data));
            var query = clientService.updateStudent(data,function(response){
                console.log("UpdateStudent:"+JSON.stringify(response)+" OK");
            });

            return query;
        }

        function updateClientGuardian(data){
            // TODO: Guardian Client info update
            /*if(form.$valid){
                console.log("UpdateGuardianValid");
            }
            if(form.$invalid){
                console.log("UpdateGuardianInvalid:"+JSON.stringify(form.$error));
            }*/
            console.log("UpdateGuardian:"+JSON.stringify(data));
            var query = clientService.updateGuardian(data,function(response){
                console.log("UpdateGuardian:"+JSON.stringify(response)+" OK");
            });  

            return query;         
        }

        function removeGuardian(guardianId) {
            var query = clientService.removeGuardian({guardianId: guardianId}, function(response) {
                console.log("RemoveGuardian:"+response);
            });

            return query;
        }

        function deleteSelectedClients() {
            swal({
                title: "Delete Clients?",
                text: "Are you sure you want to delete the selected clients?",
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
                        angular.forEach(daycare.clients, function(val) {
                            if (val.toBeDeleted) {
                                tasks.push(deleteClient(val._id).$promise);
                            }
                        });
                    });

                    $q.all(tasks).then(function(data) {
                        angular.forEach(data, function(dataVal) {
                            if (dataVal._id) {
                                var go = true;

                                angular.forEach($scope.daycareList, function(daycare) {
                                    angular.forEach(daycare.clients, function(clientVal, key) {
                                        if (!go) { return; }
                                        if (clientVal._id === dataVal._id) {
                                            $scope.clientData.splice(key, 1);
                                            daycare.clients.splice(key, 1);
                                            $scope.clientsToDelete--;
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

        function deleteClient(id) {
            var query = clientService.removeClient({clientId:id},function(res) {
                console.log(res);
            });

            return query;
        }

        function copyHomeAddress(data) {
            var srcObj = data.mailing_address;

            if(data.sameAsHome){
                data.work_address = srcObj;
                data.work_address.suite = data.mailing_address.apt;
            } else {
                data.work_address = angular.copy(data.work_address);
            }
        };

        function copyPrimaryAddress(data) {
            var srcObj = $scope.clientPrimaryGuardian.mailing_address;

            if(data.sameAsPrimary){
                data.mailing_address = srcObj;
                $scope.secondaryGuardianData.mailing_address = srcObj;
            } else {
                data.mailing_address = angular.copy(data.mailing_address);
            }
        };

        function zipCheck(data){
            data.mailing_address.zip = $scope.validateZip(data.mailing_address.zip);
            if(data.sameAsHome){
                data.work_address.zip=data.mailing_address.zip;
            }
        };

        function validateZip(zip) {

            return zip.replace(/[^0-9]/g, '');
        };

        function setForm(name, formObj) {
            $scope[name] = formObj;
        }

        function checkSecondary(noSecondary) {
            if (noSecondary) {
                // $scope.clientSecondaryGuardian = $scope.clientFormData;
                $scope.clientFormData = {};
            } else {
                var guardianId = $scope.clientSecondaryGuardian._id;
                angular.copy($scope.formDataTemplate, $scope.clientSecondaryGuardian);
                $scope.clientSecondaryGuardian._id = guardianId;
                $scope.clientSecondaryGuardian.sameAsPrimary = false;
                onPrimaryCustody($scope.clientPrimaryGuardian.custody);
                $scope.clientFormData = $scope.clientSecondaryGuardian;
                $scope.clientSecondaryGuardian.type = "secondary";
            }
        }

        function onPrimaryCustody(custody) {
            switch (custody) {
                case 'sole':
                    $scope.clientSecondaryGuardian.custody = 'none';
                    break;
                case 'joint':
                    $scope.clientSecondaryGuardian.custody = 'joint';
                    break;
                default:
                    break;
            }
        }

        function selectAllClients(allChecked) {

            $scope.clientsToDelete = 0;

            angular.forEach($scope.daycareList, function(daycare) {
                angular.forEach(daycare.clients, function (val) {
                    if (val.toBeDeleted = allChecked) {
                        $scope.clientsToDelete++;
                    }
                });
            });
        }

        function onSelectClient(isChecked) {
            isChecked ? $scope.clientsToDelete++ : (!(--$scope.clientsToDelete) ? $scope.allChecked = false : true);
        
            var totalNumberOfClients = $scope.clientData.length;
            var numOfClientsToDelete = $scope.clientsToDelete || 0;
            
            if(totalNumberOfClients > numOfClientsToDelete) {
                $scope.allChecked = false;
            } else if(totalNumberOfClients == numOfClientsToDelete) {
                $scope.allChecked = true;
            }
        }

        function isFormActive(index){
            console.log("isIndex: "+index+" active? "+($scope.progress.formIndexess == index));
            return $scope.progress.formIndex == index;
        }

        function onLoad() {
            classService.get({providerId: $scope.user._id}, function(res){
                if(res){
                    console.log(res);
                    $scope.classes = res;
                }
            });
        }
    }
})();