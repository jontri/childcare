(function() {
    'use strict';

    angular
        .module('routerApp')
        .factory('AuthService', AuthService);

    AuthService.$inject = ['$auth','$q', '$rootScope', 'API_ENDPOINT', 'storage', '$http', 'userService'];

    function AuthService($auth,$q, $rootScope, API_ENDPOINT, storage, $http, userService) {

        var session_user = getUserFromStorage();
        var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        storage.onBeforePersist(
            function handlePersist() {
                storage.setItem("rv_user", session_user);
            }
        );

        function getUserFromStorage() {
            // console.log("Extract User from storage: " + storage.extractItem("rv_user") );
            var user = storage.extractItem("rv_user");

            if (!user) {
                user = getUser();

                if (!user) {
                    user = [];
                }
            }

            return user;
        }

        return {
            login: login,
            setUser: setUser,
            getUser: getUser,
            getUserFromDB: getUserFromDB,
            isAuthenticated: isAuthenticated,
            isAuthorized: isAuthorized,
            logout: logout,
            forgotPassword: forgotPassword,
            verifyResetLink: verifyResetLink,
            saveNewPassword: saveNewPassword,
            forgotUsername: forgotUsername,
            checkContactAndZip: checkContactAndZip,
            accountLock: accountLock,
            updateConfirmation: updateConfirmation,
            sendSmsToken: sendSmsToken,
            verifySmsToken: verifySmsToken,
            isParent: isParent,
            isProvider: isProvider,
            isAdmin: isAdmin,
            isParentOrProvider: isParentOrProvider,
            isPhoneVerified : isPhoneVerified,
            sendFeedback: sendFeedback,
            sendInvite: sendInvite,
            getAllFeedback : getAllFeedback,
            markFeedback : markFeedback,
            emailRegex : emailRegex,
            saveSession:saveSession,
            deleteSession:deleteSession,
            checkEmail: checkEmail,
            getSubscription: getSubscription,
        }

        function login(user) {
            // enable persist for local storage
            storage.enablePersist();

            return $auth.login({
                username: user.username.toLowerCase(),
                password: user.password
            });
        }

        function setUser(user) {
            if (typeof user.photo != 'undefined' && user.photo && user.photo.indexOf('assets/uploads') == -1) {
                user.photo = 'assets/uploads/' + user.photo;
            }
            session_user = [];
            session_user.push(user);
            storage.setItem("rv_user", session_user[0]);
        }

        function isAuthenticated() {
            return $auth.isAuthenticated() && angular.isDefined(getUser());
        }


        function isAuthorized(authorizedRoles) {

            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }

            var user = getUser();
            var userType = user.userType;

            if(!angular.isArray(userType)){
                userType = [userType];
            }

            for (var i = 0; i < authorizedRoles.length; i++) {

                console.log("Checking Roles: " + authorizedRoles[i] + " in  " + JSON.stringify(userType));
                if( (isAuthenticated() && userType.indexOf( authorizedRoles[i] ) >= 0) ) {
                    return true;
                }
            }

            return false;
        }

        function isParent(){
            var user = getUser();
            return  ( isAuthenticated() && ( !angular.isUndefined(user) && ( user.userType === 'parent' ||  user.userType.indexOf('parent') >= 0 )) );
        }

        function isParentOrProvider(){
            var user = getUser();
            return ( isAuthenticated() &&
                ( user.userType === 'parent' || user.userType.indexOf('parent') >= 0
                    || user.userType === 'provider' || user.userType.indexOf('provider') >= 0  ) );
        }

        function isAdmin(){
            var user = getUser();
            return  ( isAuthenticated() && ( !angular.isUndefined(user)  && (user.userType === 'admin' ||  user.userType.indexOf('admin') >= 0 )) );
        }

        function isProvider(){
            var user = getUser();
            return  ( isAuthenticated() && ( !angular.isUndefined(user) && (user.userType === 'provider' ||  user.userType.indexOf('provider') >= 0 )) );
        }

        function logout(noRedirectToHome) {
            var logoutUser = getUser();
            storage.disablePersist();
            session_user = [];
            deleteSession( logoutUser );
            $rootScope.$broadcast('user-logged-out');
            localStorage.removeItem('userId');
            $rootScope.noRedirectToHome = noRedirectToHome;
            // trigger logout on other tabs
            localStorage.setItem('logout', 1);
            localStorage.removeItem('logout');
            return $auth.logout();
        }

        function isPhoneVerified(){
            if( isAuthenticated() ){
                var user = getUser();
                //return (user.phone_number_verified == "true")?true:false;
                
                if(user.phone_number_verified == "true"){
                    return true;
                }else{
                    return false;
                }
                
            }
            return false;
        }

        function getUser() {


            if( session_user && session_user.length >= 1 ){
                return session_user[0] ;
            } else if (localStorage.getItem('userId')) {
                userService.get({
                    userId: localStorage.getItem('userId')
                }, function(user) {

                    if(user) {
                        setUser(user);
                    }

                    return user;
                });
            }
        }

        function getUserFromDB(cb) {
            userService.get({
                userId: localStorage.getItem('userId')
            }, function(user) {
                cb(user);
            });
        }

        function forgotPassword(email) {
            return $http.post(API_ENDPOINT + '/password-reset', {
                email: email
            });
        }

        function accountLock(email) {
            return $http.post(API_ENDPOINT + '/account-lock', {
                email: email
            });
        }

        function clearLock(email, ip) {
            return $http.post(API_ENDPOINT + '/clear-lock', {
                email: email
            });
        }

        function verifyResetLink(token, email) {
            return $http.post(API_ENDPOINT + '/verify-reset-link', {
                token: token,
                email: email
            });
        }

        function saveNewPassword(user) {
            return $http.post(API_ENDPOINT + '/save-new-password', {
                user: user
            });
        }

        function forgotUsername(user) {
            return $http.post(API_ENDPOINT + '/send-username', {
                user: user
            });
        }

        function checkContactAndZip(user) {
            return $http.post(API_ENDPOINT + '/user/all', {
                user: user
            });
        }

        function updateConfirmation(token, email){
            return $http.post(API_ENDPOINT + '/account/activation', {
                token: token,
                email: email
            });
        }

        function sendFeedback(user_id,name,email,feedback){
            //return console.log("this is a post from authService");
            console.log("UserId=>"+user_id);
            console.log("Name=>"+name);
            console.log("Email=>"+email);
            console.log("FeedbackText=>"+feedback);
            var date = new Date();
            return $http.post(API_ENDPOINT + '/sendFeedback', {
                user_id: user_id,
                name:name,
                email:email,
                feedback:feedback,
                date:date
            });
        }

        function sendInvite(user_id, first_name, last_name, email, message, recipient){
            //return console.log("this is a post from authService");
            // console.log("UserId=>"+user_id);
            // console.log("Name=>"+name);
            // console.log("Email=>"+email);
            // console.log("Message=>"+message);
            var date = new Date();

            return $http.post(API_ENDPOINT + '/sendInvite', {
                user_id: user_id,
                first_name:first_name,
                last_name: last_name,
                email:email,
                message:message,
                date:date,
                recipient:recipient
            });
        }

        function getAllFeedback(user_id,name,email,feedback){
            //return console.log("this is a post from authService");
            var date = new Date();
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/getAllFeedback')
            .then(function(res){
                defer.resolve(res.data);
                //console.log("getAllFeedbackSuccess");
            },function(err){
                defer.reject(err);
                //console.log("getAllFeedbackError");
            });
            return defer.promise;
        }

        function markFeedback(feedbackId,status){
            console.log("Feedback updating: "+feedbackId);
            
            return $http.post(API_ENDPOINT + '/markFeedback', {
                _id : feedbackId,
                status : status
            });
        }
        //function sendActivationLink(user){
        //    return $http.post(API_ENDPOINT + '/user/sendActivationLink', {
        //        user: user
        //    });
        //}

        function verifySmsToken(token, email) {
            return $http.post(API_ENDPOINT + '/verifySmsToken', {
                token: token,
                email: email
            });
        }

        function sendSmsToken(email) {
            return $http.post(API_ENDPOINT + '/sendSmsToken', {
                email: email
            });
        }

        function saveSession(data){
            //console.log("$auth.loginRESPONSE: "+JSON.stringify(data));
            $http.post(API_ENDPOINT + '/sessionsave', {
                user: data
            });
        }

        function deleteSession(data){
            //console.log("$auth.logoutRESPONSE: "+JSON.stringify(data));
            $http.post(API_ENDPOINT + '/sessiondelete', {
                userId: data
            });
        }

        function checkEmail(email){
            //console.log("$auth.logoutRESPONSE: "+JSON.stringify(data));
            return $http.get(API_ENDPOINT + '/check-email', {
                params: { email: email }
            });
        }

        function getSubscription(){
            //console.log("$auth.logoutRESPONSE: "+JSON.stringify(data));
            var user = getUser();
            if(isAuthenticated() && ( !angular.isUndefined(user)  && (user.userType === 'provider' ||  user.userType.indexOf('provider') >= 0 ))){
                console.log('user.subscription: ',user.subscription);
                return user.subscription;
            }
        }
    }

})();