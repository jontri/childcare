var registerController = angular.module('registerController', []);

registerController.controller('registerCtrl', ['$scope', 'userService', '$rootScope', '$state', 'stateService', '$stateParams', 'AuthService', 'Upload', 'API_ENDPOINT', 'securityQuestionsService', 'StaticDataService', 'listingService',
    function($scope, userService, $rootScope, $state, stateService, $stateParams, AuthService, Upload, API_ENDPOINT, securityQuestionsService, StaticDataService, listingService) {
        var self = this;
        var state = $state.current.name;
        var timeoutId;

        localStorage.removeItem('userId');

        self.createUser = createUser;
        self.updateUser = updateUser;
        self.changeMailingAddress = changeMailingAddress;
        self.clickBtn = clickBtn;
        self.emailRegex = AuthService.emailRegex;
        //self.emailFormat = "/^[a-z]+[a-z0-9._]+@[a-z]+\.[a-z.]{2,5}$/";

        self.roles = [
            {value:'parent', description:'Parent seeking/using child care services'},
            {value:'provider', description:'Child care provider'}
        ];

        self.user_lastName = "";

        // accordion
        self.oneAtATime = true;
        self.status = {
            isCustomHeaderOpen: false,
            isFirstOpen: true,
            isFirstDisabled: false
        };
        self.securityQuestion = [];
        self.new_user = new User();
        self.previousPage = previousPage;
        self.disableInput = disableInput;

		self.showPassword = function()
		{
			return false;
		}
		
		self.selUserType = [];
		
		self.selectUserType = function(type){
            $('input[name="'+type+'"]').focus();
			var ckBox = $("label input[id^='cbUserType']");
			$.each(ckBox, function(i, item){
				if(item.checked == true && item.value == type)
				{
					self.userTypeRequired = false;
					self.new_user.userType.push(type);
				}
				if(item.checked==false){
					$.each(self.new_user.userType,function(j,k){
						if(k == item.value){
							self.new_user.userType.splice(j,1);
                            if (!self.new_user.userType.length) {
                                self.userTypeRequired = true;
                            }
						}
					});
				}
			});
			console.log("a-->"+JSON.stringify(self.new_user.userType));
		}
		
		self.selectedUserType = [];

        onLoad();
        getSecurityQuestions();


        function onLoad() {
            self.address_is_refreshed = false;
            self.selected_state = [];

            if (state === 'register_owner' || state === 'register_parent' || state === 'register_option') {
                //$rootScope.hideLoginPopup = true;
                $rootScope.hideRegisterPopup = true;
                var lUserId = localStorage.getItem('userId');

                if (lUserId) {
                    setUserData(lUserId);
                }

            } else if (state === 'register') {

                console.log("Entering Registration Page");
                var lUserId = localStorage.getItem('userId');

                $rootScope.hideRegisterPopup = true;
                var specialchars = new RegExp('([!,%,&,@,#,$,^,*,?,_,~])');
                self.regex = "[a-zA-Z0-9]+";
                self.regexPassword = "(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!,%,&,@,#,$,^,*,?,_,~]).{8,25}";
				        self.regexEmail = "/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/";
                self.onlyNumbers = /^[0-9]+$/;

                self.new_user = {
                    status: 'pending',
                    salutation: '',
                    birth: {
                        month: 'Jan',
                        day: 1,
                        year: 1970
                    },
                    contactNumType: 'work',
                    address: {
                        zip: ''
                    },
                    mailing_address: {
                        zip: ''
                    },
                    contactNum: '',
                    mobileNum: '',
                    contactNumType: '',
                    phone_number_verified : '',
                    userType:[],
                    aliasName:''
                    

                };

                getFormData();

                // default checked userType
                // setTimeout(function(){
                //     console.log("use default userType");
                //     self.selectUserType('parent');
                // },0);
                self.userTypeRequired = true;
                

                $scope.$watch(angular.bind(self, function() {
                    return self.new_user.address.zip;
                }), function(newVal, oldValue) {
                    if (angular.isUndefined(newVal) === false && newVal !== '') {
                        autoPopulateAddressFields(self.new_user);
                    }
                });

                self.mailing_address_is_refreshed = false;
                self.selected_mailing_state = [];



                $scope.$watch(angular.bind(self, function() {
                    return self.new_user.contactNum;
                }), function(newVal, oldValue) {
                    if (angular.isUndefined(newVal) === false && newVal !== '' && newVal.length === 10) {
                        angular.element('#contactNumType').focus();
                    }
                });

            } else if (state === 'confirmation') {
                userService.get({
                    userId: localStorage.getItem('userId')
                }, function(user) {
                    self.new_user = user
                });
            }else if (state === 'activation'){

                AuthService.logout(true);
                $rootScope.$broadcast('user-logged-out');
                localStorage.removeItem('userId');

                AuthService.updateConfirmation($stateParams.token, $stateParams.email).then(
                    function(response) {
                        console.log("Result : " + response.status);

                        // TODO: for some reason setTimeout makes swal pop out
                        setTimeout(function() {
                            self.is_verify_successful=true;
                            swal({
                                title: 'Email Verification Successful',
                                text: 'Thank you. We have successfully verified your email account. You may now log in using the ' +
                                'Username and Password fields at the top of this page. You will now be redirected to the Home Page. ' +
                                'If you are not redirected in 10 seconds, please click OK below.',
                                type: 'success',
                                showConfirmButton: true,
                                timer: 10000
                            }, function (isConfirm) {
                                $state.go('home');
                            });
                        }, 500);
                    },
                    function(err) {
                        self.is_verify_successful=false;
                        setTimeout(function() {
                            swal({
                                title: 'Email Verification Failed',
                                html: true,
                                text: '<p>We are unable to verify that you own the email address associated with your Ratingsville account. Email verification is an important and required step to keep your account secure. Please re-click the verification link we recently sent you to complete this step. If this problem continues, please <a href="#/contactus"><b>contact us</b></a> so we can help resolve the matter.</p>',
                                type: 'warning',
                                showConfirmButton: true
                            }, function (isConfirm) {
                                $state.go('home');
                            });
                        }, 500);
                    }
                );



            }else if (state === 'register_parent_step2') {

                getCurrentUser(localStorage.getItem('userId'));

                // listing suggestions
                self.daycare_list = [];
                listingService.getList().$promise.then(function(response) {

                    angular.forEach(response.searchResult, function(listing) {
                        var name = listing.name;
                        var administrator = '';
                         if (angular.isDefined(listing.primaryContact) && angular.isObject(listing.primaryContact)) {
                            administrator = listing.primaryContact.title + '. ' + listing.primaryContact.firstName + ' ' + listing.primaryContact.lastName;
                        }
                        if (angular.isDefined(listing.address) && angular.isObject(listing.address)) {
                            name += ' - ' + listing.address.addressLine1 + ' ' + listing.address.city + ' ' + listing.address.state;
                        }
                        self.daycare_list.push({
                            id: listing._id,
                            name: name,
                            administrator: administrator
                        });
                    });

                });

                self.existing_user = {
                    preferredWayToAddress: 'First Name',
                    otherWayToAddress: '',
                    numChildren: 0,
                    children: [StaticDataService.generateChildData()]
                };

                self.is_Same_lastName = false;
                self.children_lastName = 'No';

                getFormData();

                $scope.$watch(angular.bind(self, function() {
                    return self.children_lastName;
                }), function(value) {
                    if (value == 'Yes') {
                        for (var i = 0; i < self.existing_user.children.length; i++) {
                            self.existing_user.children[i].lastName = self.user_lastName;
                        }

                    } else if (value == 'No') {
                        for (var i = 0; i < self.existing_user.children.length; i++) {
                            self.existing_user.children[i].lastName = null;
                        }
                    }
                });


                $scope.$watch(angular.bind(self, function() {
                    return self.existing_user.numChildren;
                }), function(newVal, oldValue) {
                    self.children = [];
                    for (var i = 1; i <= newVal; i++) {
                        self.children.push(i);
                    }

                    if (newVal > 0) {
                        self.is_Same_lastName = true;
                    } else {
                        self.is_Same_lastName = false;
                    }

                    if (oldValue < newVal) {
                        var diff = parseInt(newVal) - parseInt(oldValue);
                        for (var i = 1; i <= diff; i++) {
                            var child_data = StaticDataService.generateChildData();
                            if (self.children_lastName != 'No') {
                                child_data = angular.extend({lastName: self.user_lastName}, child_data);
                            }
                            self.existing_user.children.push(child_data);
                        }
                    } else {
                        self.existing_user.children = self.existing_user.children.slice(0, parseInt(newVal));
                    }

                });

            } else if (state === 'register_parent_step3') {

                getCurrentUser(localStorage.getItem('userId'));

                self.existing_user = {
                    switchDaycare: 'none'
                };
                getFormData();
            }

            setTimeout(function() {
                $('#cbUserType0').focus();
            }, 1);
        }

        function autoPopulateAddressFields(user) {
            self.address_is_refreshed = false;
            var zip = user.address.zip;
            stateService.getCityAndStateByZipCode(zip).then(
                function(response) {

                    angular.forEach(response.data.results[0].address_components, function(address_component) {

                        if (address_component.types[0] === 'locality') {
                            user.address.city = address_component.long_name;
                        } else if (address_component.types[0] === 'neighborhood') {
                            user.address.city = address_component.long_name;
                        }

                        if (address_component.types[0] === 'administrative_area_level_1') {
                            user.address.state = address_component.short_name;
                        }
                    });

                    if(angular.isDefined(user.address_is_refreshed)) {
                        user.selected_state.push(user.address.state);
                        user.address_is_refreshed = true;
                    } else {
                        self.selected_state.push(user.address.state);
                        self.address_is_refreshed = true;
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                },
                function(err) {
                    console.log(err);
                }
            );
            angular.element('#city').focus();
        }

        self.updateChildDaycare = function(index, id, administrator) {
            index = parseInt(index);
            self.existing_user.children[index].daycare.id = id;
            self.existing_user.children[index].daycare.administrator = administrator;
            self.existing_user.children[index].show_daycare_fields = false;
            $scope.$apply();
        }

        self.showDaycareAddressFields = function(index) {
            delete self.existing_user.children[index].daycare.id;
            delete self.existing_user.children[index].daycare.administrator;
            self.existing_user.children[index].show_daycare_dropdown = false;
            self.existing_user.children[index].show_daycare_fields = true;
        }

        self.changeDaycareZipcode = function(child_daycare) {
            
            if (angular.isDefined(child_daycare.address.zip) && child_daycare.address.zip.toString().length === 5) {
                child_daycare.address_is_refreshed = false;
                autoPopulateAddressFields(child_daycare);
            }
        }

        function User() {
            this.salutation = '';
            this.birth = {
                month: 'Jan',
                day: 1,
                year: 1970
            };
            this.contactNumType = 'work';
            this.address = {
                zip: ''
            };
            this.mailing_address = {
                zip: ''
            };
            this.contactNum = {
                home: null,
                mobile: null,
                preferred: null
            };
            this.security_question = {
               question1: null,
               question2: null,
               question3: null,
               answer1: null,
               answer2: null,
               answer3: null
            };
			this.userType=[];
            this.aliasName='';
        }

        function previousPage() {
            if (state === 'register_parent_step2' && $stateParams.userId) {
                localStorage.setItem('userId', $stateParams.userId);
                $state.go('register');
            }
        }

        function getSecurityQuestions() {
            securityQuestionsService.getListOfQuestions().then(
                function(response) {

                    var questions_arr = [];

                    angular.forEach(response.data, function(data) {
                        questions_arr.push(data);
                    });

                    self.securityQuestion = questions_arr;
                },
                function(err) {
                    console.log(err);
                }
            );
        }

        function disableInput() {
            return self.new_user.hasOwnProperty('_id') && localStorage.getItem('userId');
        }

        function setUserData(id) {
            userService.get({
                userId: id
            }, function(existingUser) {
                self.new_user = existingUser;
            });
        }

        function changeMailingAddress(use_main_address) {
            self.new_user.mailing_address = {};
            if (use_main_address) {
                self.new_user.mailing_address = self.new_user.address;
            }
        }

        function getCurrentUser(userId) {
            userService.get({
                userId: userId
            }, function(user) {
                self.user_lastName = user.lastName;

                if (!user.hasOwnProperty('_id')) {
                    $state.go('register');
                } else {
                    if (state === 'register_parent_step3') {
                        angular.extend(self.existing_user, {
                            children: user.children
                        });
                    }
                }
            });
        }

        function getFormData() {
            getListOfStates();
            self.months = StaticDataService.getListOfMonths();
            self.days = StaticDataService.getListOfDays();
            self.years = StaticDataService.getListOfYears();
        }

        function getListOfStates() {

            var states = stateService.getListOfStates().then(
                function(response) {
                    self.states = [];
                    var data = response.data;
                    for (key in data) {
                        self.states.push({
                            id: key,
                            name: data[key] + ' (' + key + ')'
                        });
                    }
                    self.address_is_refreshed = true;
                    //self.mailing_address_is_refreshed = true;
                },
                function(err) {
                    console.log(err);
                }
            );
        }

        function createUser(new_user, registerForm) {

			if(new_user.userType.length == 0)
			{
				$("#cbUserTypeErrorMsg").css("display","");
                setTimeout(function () {
                    var firstErrorElement = $('input[id="cbUserType0"]:visible:first');
                    firstErrorElement.focus();
                    $("html, body").animate({ scrollTop: firstErrorElement.offset().top - 300}, 1000);
                }, 1);
				return;
			}
            if (!registerForm.$valid) {
                var errors = [];

                setTimeout(function () {

                    var firstErrorElement = angular.element("[name='" + registerForm.$name + "']").find('[class*="ng-invalid"]:visible:first');

                    firstErrorElement.focus();

                    $("html, body").animate({ scrollTop: firstErrorElement.offset().top - 300}, 1000);

                }, 1);


                return;
            }


            //if (AuthService.isAuthenticated()) {
            //
            //    var authUser = angular.copy(AuthService.getUser());
            //
            //    new_user._id = authUser._id;
            //}

            // email and username should be the same
            new_user.username = new_user.email.toLowerCase();
			
            userService.previousData = new_user;
            userService.save(new_user).$promise.then(
                function(response) {

                    //if (!AuthService.isAuthenticated()) {
                         //login({
                         //    username: new_user.username,
                         //    password: new_user.password
                         //}, response.user._id);

                    //} else {
                        //if (self.new_user.userType === 'parent') {
                        //     $state.go('register_parent_step2', {
                        //         userId: new_user._id
                        //     });
                        //} else {
                        //    $state.go('dashboard_provider');
                        //}


                        swal({
                            title: 'Registration Successful',
                            html: true,
                            text:"<p align='left'>Thank you for signing up. We will send you an email with a link to verify that you own the email address you registered with. Email verification is an important and required step in the account activation process.</p></br></br>"+
							"<p align='left'>Please click Contact Us on top of this page to inquire about the status of your verification link if you do not receive it shortly. You will now be redirected to the Home Page. If you are not redirected in 20 seconds, please click OK below.</p></br></br>",
                            type: 'success',
                            timer: 20000,
                            showConfirmButton: true
                        }, function (isConfirm) {

                            $state.go('home');

                            setTimeout(function () {
                                self.user.password = '';
                                self.user.username = '';

                                $("#pass_login").val('');
                                $("#email_login").val('');
                                $("#email_login").focus();

                            }, 1);

                        });

                    //}
                },
                function(err) {
                    if (err.status === 501) {
                        swal({
                            html: true,
                            title: 'Alias is already registered!',
                            text: "This alias has already been selected by another user. Please choose another alias.",
                            type: 'warning',
                            showConfirmButton: true
                        }, function(isConfirm) {
                            if (isConfirm) {

                            } else {
                                //$state.go('home');
                            }

                            setTimeout(function () {
                                $("#aliasName").focus();
                                $("#aliasName").select();
                            }, 1);

                        });
                    } else if (err.status === 503) {
                        swal({
                            html: true,
                            title: 'Email is already registered!',
                            text: "If you have forgotten your password and would like to reset it, please click <a href='/#/forgot-password'><b>here</b></a> or click OK to enter another email address and continue with registration.",
                            type: 'warning',
                            showConfirmButton: true
                        }, function(isConfirm) {
                            if (isConfirm) {

                            } else {
                                //$state.go('home');
                            }

                            setTimeout(function () {
                                $("#email_register").focus();
                                $("#email_register").select();
                            }, 1);

                        });
                    } else if (err.status === 508) {
                        swal({
                            html:true,
                            title: 'Cell number is already registered!',
                            text: "If you have forgotten the username associated with this number, please click <a href='/#/forgot-username'><b>here</b></a> to retrieve it or click OK to enter another cell number and continue with registration. ",
                            type: 'warning',
                            showConfirmButton: true,
                            //showCancelButton: true,
                        }, function(isConfirm) {
                            if (isConfirm) {
                                //$state.go('login');
                            }
							
							setTimeout(function () {
                                $("#mobile_register").focus();
                                $("#mobile_register").select();
                            }, 1);
                        });
                    } else {
                        swal({
                            title: "Error",
                            text: err.statusText,
                            type: 'error'
                        });
                    }
                }
            );
        }

        function updateUser(existing_user) {

            if (state === 'register_parent_step3') {
                delete existing_user.children
                if (existing_user.otherMedium) {
                    existing_user.submedium = existing_user.otherMedium;
                    delete existing_user.otherMedium;
                }
            }

            if (state === 'register_parent_step2' && angular.isDefined(existing_user.photo) && self.croppedDataUrl !== '' && (!self.formUpdateUser.drop_file.$pristine || !self.formUpdateUser.file.$pristine)) {
                existing_user._id = $stateParams.userId;
                return updateWithPhoto(existing_user);

            }

            userService.get({
                userId: $stateParams.userId
            }, function(user) {
                angular.extend(user, existing_user);
                user.$save(function(response, putResponseHeaders) {
                    if (state === 'register_parent_step2') {
                        $state.go('register_parent_step3', {
                            userId: response.user._id
                        });
                    }

                    if (state === 'register_parent_step3') {

                        swal({
                            title: "",
                            text: "Your registration is complete.  Please check your email and click on the verification link to enjoy all features of Ratingsville.",
                            type: "success",
                            closeOnConfirm: true
                        }, function() {
                            $state.go('home');
                        });
                    }
                });
            });
        }

        function updateWithPhoto(existing_user) {
            Upload.upload({
                url: API_ENDPOINT + '/upload-with-photo',
                method: 'POST',
                data: existing_user,
                file: existing_user.photo
            }).then(
                function(response) {
                    $state.go('register_parent_step3', {
                        userId: response.data.user._id
                    });
                },
                function(err) {
                    console.log(err);
                }
            );
        }

        function login(user, id) {

            AuthService.login(user).then(
                function(response) {
                    if (angular.isDefined(response.data.username)) {
                        AuthService.setUser(response.data);
                        if (AuthService.isParent()) {
                            $state.go('register_parent_step2', {
                                userId: id
                            });
                        } else {
                            $state.go('dashboard_provider');
                        }
                    }
                },
                function(err) {
                    self.is_loading = false;
                    if (angular.isDefined(err.status) && err.status === 401) self.unauthorized = true;
                }
            );
        }

        function clickBtn(id) {
            angular.element(id).click();
        }

        $('#zipCode').loceo('city', {
            key: null
        }, function(feature) {
            $('#city').val('');
            if (feature != null && feature.properties != null && feature.properties.city != null) {
                $('#city').val(feature.properties.city);
            }
        });

        //$("#password").strength({
        //    strengthClass: 'form-control',
        //    strengthMeterClass: 'strength_meter',
        //    strengthButtonClass: 'button_strength',
        //});

    }
]);

registerController.directive('validateEmail', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {
				if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(viewValue)) {
                    // it is valid
                    ctrl.$setValidity('validateEmail', true);
                    return viewValue;
                } else {
                    // it is invalid, return undefined (no model update)
                    ctrl.$setValidity('validateEmail', false);
                    return undefined;
                }
            });
        }
    };
});