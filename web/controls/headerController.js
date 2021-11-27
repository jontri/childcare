(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('headerCtrl', headerCtrl);

    headerCtrl.$inject = ['$scope', 'AuthService', 'userService' ,'securityQuestionsService','$state', 'listingService'];

    function headerCtrl($scope, AuthService , userService , securityQuestionsService , $state , listingService) {
        var vm = this;

        vm.state = $state.current.name;

        // console.log("State: " + vm.state);

        vm.user = angular.copy(AuthService.getUser());

        vm.userData = null;

        vm.is_userQuestions = false;
        vm.phone_number_verified = false;
        vm.user_is_logged_in = AuthService.isAuthenticated();
        vm.isParent = AuthService.isParent();
        vm.isProvider = AuthService.isProvider();
        vm.isAdmin = AuthService.isAdmin();

        vm.updateUser = updateUser;
        vm.verifyUser = verifyUser;
        vm.sendVerificationCode = sendVerificationCode;
        vm.resetSearch = resetSearch;

        vm.formUpdateError = false;

        vm.user_update = {
            security_question: {}
        }

        vm.emailRegex = AuthService.emailRegex;

        vm.routesNoMobileMenu = {
            login: true
        };
        
        getSecurityQuestions();
        checkUserDataQuestions();

        $scope.$on('user-logged-out', function(event) {
            vm.user_is_logged_in = false;
        });

        $scope.$on('user-logged-in', function(event) {
            vm.user_is_logged_in = true;
        });

        // listen for events my dear
        $scope.$on('reload-user', function(e, event) {
            vm.user = angular.copy(AuthService.getUser());
            // check that there is no current $digest process to prevent error when using $apply
            if(!$scope.$$phase) {
                $scope.$apply();
            }
        });

        function getSecurityQuestions(){
            securityQuestionsService.getListOfQuestions().then(
                    function(response) {

                        var questions_arr = [];

                        angular.forEach(response.data, function(data) {
                            questions_arr.push( data );
                        });

                        vm.securityQuestion =  questions_arr;
                    },
                    function(err) {
                        console.log(err);
                    }
                );
        }

        function checkUserDataQuestions(){
            if( vm.user_is_logged_in ){

                vm.userData = userService.get({
                        userId: vm.user._id
                    }, function() {
                        if( vm.userData.security_question ){
                            if( angular.isDefined(vm.userData.security_question.answer1) ){
                                vm.is_userQuestions = false;
                            }else{
                                vm.is_userQuestions = true;
                            }

                        }else{
                            vm.is_userQuestions = true;
                        }

                        if( vm.userData.phone_number_verified == 'verified' ){
                            vm.phone_number_verified = true;
                        }else{
                            vm.phone_number_verified = false;
                        }

                        if( AuthService.isProvider() ){

                            listingService.listingByEmail({
                               email: vm.userData.email
                            }, function(response) {
                                vm.listing = response.listing;
                            });
                        }

                    });
            }


        }


        $scope.filter1 = function(item){
          return (!(vm.user_update.security_question.question1&&vm.user_update.security_question.question1)||item !=vm.user_update.security_question.question1);
        };

        $scope.filter2 = function(item){
          return (!(vm.user_update.security_question.question2&&vm.user_update.security_question.question2)||item!=vm.user_update.security_question.question2);
        };
        $scope.filter3 = function(item){
          return (!(vm.user_update.security_question.question3&&vm.user_update.security_question.question3)||item !=vm.user_update.security_question.question3);
        };

        function resetSearch(){
            console.log("Resetting Search");
            localStorage.removeItem('advance-daycare-status');
            localStorage.removeItem('SearchItem');
        }

        function updateUser(user_update){
            console.log(user_update);

            if( user_update.security_question.question1 && user_update.security_question.question2 && user_update.security_question.question3 &&
                user_update.security_question.answer1 && user_update.security_question.answer2 && user_update.security_question.answer3 ){

                var user = userService.get({
                    userId: vm.user._id
                }, function() {
                    angular.extend(user, user_update);

                    user.$save(function(response, putResponseHeaders) {
                        console.log(response);

                        if( response.$resolved ){
                            console.log('Update Success');
                            vm.formUpdateError = false;
                            vm.formUpdateSuccess = true;

                            setTimeout(function(){
                                $('#securityQuestionsModal').modal('hide');
                                vm.is_userQuestions = false;
                            },1000);

                        }
                    });

                });

            }else{
                vm.formUpdateError = true;
            }



        }

        function verifyUser(verifyCode){

            if( verifyCode){
                console.log(verifyCode);
                vm.formVerifyError = false;

                var user = userService.get({
                    userId: vm.user._id
                }, function() {
                    console.log(user);
                    if( user.verification_code == verifyCode ){
                        vm.formVerifyInvalid = false;
                        user.phone_number_verified = 'verified';
                        user.status = "active";

                        user.$save(function(response, putResponseHeaders) {
                            console.log(response);

                            if( response.$resolved ){
                                console.log('Update Success');
                                vm.formVerifySuccess = true;
                                vm.phone_number_verified = true;
                                setTimeout(function(){
                                    $('#phoneVerificationModal').modal('hide');
                                },1000);

                            }
                        });
                    }else{
                        vm.formVerifyInvalid = true;
                    }
                    
                });
                
            }else{
                vm.formVerifyError = true;
            }

        }

        function sendVerificationCode(){
            var status = authService.sendSmsToken({
                   email: vm.user.email
                }, function() {
                    if(status){
                        console.log("Sending Verification Code Success");
                        vm.sendingCode = true;
                    }
                });
        }

        $scope.$on('user-logged-in',function(e){
            if (vm.state !== 'login') {
                $state.reload();
            }
        });
        $scope.feedbackForm = {
            //feedbackText : "",
            //feedbackEmail : ""
        };
        
        $scope.submitFeedback = function(feedbackForm){
            if(feedbackForm.$invalid){
                setTimeout(function () {
                    var firstErrorElement = angular.element("[name='" + feedbackForm.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    firstErrorElement.focus();
                }, 1);
                return;
            }

            if(vm.user_is_logged_in){

                AuthService.sendFeedback(vm.user._id,vm.user.firstName+" "+vm.user.lastName,vm.user.email,$scope.feedbackForm.feedbackText);
                feedbackForm.feedbackText = '';
                feedbackForm.$setPristine();
                $scope.multipleInviteModel.multipleInviteText = multipleInviteTextDefault;

                $("#multipleInviteBtn").show();
                $scope.multipleInviteModel.multipleInviteText = multipleInviteTextDefault;
                $("#feedbackContainer").animate({'margin-bottom':'-550'});
                $("#feedbackBtn").show();

                swal("Success!", "Your feedback has been sent", "success");

            }else if(!vm.user_is_logged_in){

                console.log("feedbackText "+JSON.stringify($scope.feedbackForm.feedbackText));
                console.log("feedbackEmail "+JSON.stringify($scope.feedbackForm.feedbackEmail));

                AuthService.sendFeedback("NOT AUTHENTICATED USER","NOT AUTHENTICATED USER", $scope.feedbackForm.feedbackEmail,$scope.feedbackForm.feedbackText);
                feedbackForm.feedbackText = '';
                feedbackForm.feedbackEmail  = '';
                feedbackForm.$setPristine();
                $scope.multipleInviteModel.multipleInviteText = multipleInviteTextDefault;

                $("#multipleInviteBtn").show();
                $scope.multipleInviteModel.multipleInviteText = multipleInviteTextDefault;
                $("#feedbackContainer").animate({'margin-bottom':'-550'});
                $("#feedbackBtn").show();
                swal("Success!", "Your feedback has been sent", "success");

            }else{
                console.log("USER UNDEFINED");
            }
            
            
        }   

        function checkEmailValidity(email)
        {
            return vm.emailRegex.test(email);
        }

        var multipleInviteTextDefault = "I am inviting you to join Ratingsville.com, a website designed to help parents with their child care search.  Ratingsville has a more comprehensive listing of child care centers than you can imagine and a growing database of testimonials from other parents.  I thought you might benefit from their resources or be able to help other parents by contributing with a review on thie child care center your child attends.  Thanks for considering my invitation."


        $scope.multipleInviteModel = {
            firstName: '',
            lastName: '', 
            multipleInviteEmailSender: '',
            multipleInviteText: multipleInviteTextDefault
        };

        $scope.updateInviteText = function() {
            var multipleInviteModel = $scope.multipleInviteModel;     
            multipleInviteModel.multipleInviteText = multipleInviteTextDefault;
        }

        $scope.updateInviteText();

        function splitMulti(str, tokens){
            var tempChar = tokens[0]; // We can use the first token as a temporary join character
            for(var i = 1; i < tokens.length; i++){
                str = str.split(tokens[i]).join(tempChar);
            }
            str = str.split(tempChar);
            return str;
        }

        $scope.submitMultipleInvite = function(multipleInviteForm) {
            if(multipleInviteForm.$invalid){
                setTimeout(function () {
                    var firstErrorElement = angular.element("[name='" + multipleInviteForm.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    firstErrorElement.focus();
                }, 1);
                return;
            }

            console.log(JSON.stringify($scope.multipleInviteModel));

            var multipleInviteModel = $scope.multipleInviteModel;                        
            var multipleInviteEmails = multipleInviteModel.multipleInviteEmails !== undefined ? splitMulti(multipleInviteModel.multipleInviteEmails,[',',';']) : [];

            if(multipleInviteModel.multipleInviteEmailSender) {
                multipleInviteEmails.push(multipleInviteModel.multipleInviteEmailSender);
            }

            var emailList = "";

            var recipientCount = 0;
            angular.forEach(multipleInviteEmails, function(email) {


                if(checkEmailValidity(email.toLowerCase().trim())){
                    recipientCount++;
                    emailList = emailList + email.toLowerCase().trim() + ";";
                }

                console.log("Validating email: " + email);
            });

            if(vm.user_is_logged_in) {

                    console.log("Email List: " + emailList);

                    AuthService.sendInvite( 
                        vm.user._id, 
                        vm.user.firstName, 
                        vm.user.lastName, 
                        vm.user.email,
                        multipleInviteModel.multipleInviteText, 
                        emailList 
                    );

                    // multipleInviteModel.multipleInviteText = '';
                    console.log('count: ',recipientCount);
                    if(recipientCount == 1){
                        swal("Success!", "Your invitation has been sent to 1 friend.  Thank you for helping spread the word.", "success");
                    }
                    else{
                        swal("Success!", "Your invitation has been sent to "+recipientCount+" friends.  Thank you for helping spread the word.", "success");
                    }
                    multipleInviteForm.$setPristine();
                    $("#multipleInviteBtn").show();
                    $scope.multipleInviteModel.multipleInviteText = multipleInviteTextDefault;
                    $("#multipleInviteContainer").animate({'margin-bottom':'-550'});
                    $("#feedbackBtn").show();
                    $scope.multipleInviteModel.multipleInviteEmails = "";

            } else if (!vm.user_is_logged_in){
                    var emailList = "";
                    angular.forEach(validEmails, function(email) {
                        emailList = emailList + email + ";";
                    });

                    AuthService.sendInvite("NOT AUTHENTICATED USER","NOT AUTHENTICATED USER",multipleInviteForm.multipleInviteEmailSender,multipleInviteForm.multipleInviteText, emailList);
                    multipleInviteModel.multipleInviteText = '';
                    multipleInviteForm.$setPristine();

                    $("#multipleInviteBtn").show();
                    $scope.multipleInviteModel.multipleInviteText = multipleInviteTextDefault;
                    $("#multipleInviteContainer").animate({'margin-bottom':'-550'});
                    $("#feedbackBtn").show();
                    $scope.multipleInviteModel.multipleInviteEmails = "";
                    swal("Success!", "Your invitation has been sent.", "success");

            } else {
                console.log("USER UNDEFINED");
            }
        };
    }
})();
