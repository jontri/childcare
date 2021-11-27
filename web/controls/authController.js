(function () {
  'use strict';

  angular
      .module('routerApp')
      .controller('authCtrl', authCtrl);

  authCtrl.$inject = ['$scope', 'AuthService','AutoLogoutService', 'userService', '$state', '$rootScope', '$stateParams', 'StaticDataService', '$timeout', 'localStorageService', 'hackService'];

  function authCtrl($scope, AuthService,AutoLogoutService, userService, $state, $rootScope, $stateParams, StaticDataService, $timeout, localStorageService, hackService) {
    var vm = this;
    var state = $state.current.name,
      route_name = $stateParams.redirectTo,
      user_id = $stateParams.uId,
      doc_id = $stateParams.docId;

    var statesWithSmsModal = {
      smsVerify: true,
      search: true,
      ownershipUploads: true,
      contactus: true,
      listingDetail: true,
      login: true
    };

    var emailSelector = '#email_login';
    var hiddenLogInSelector = '#hidden-log-in-btn';
    var logInBtnSelector = '#log-in-btn';
    var passwordSelector = '#pass_login';

    var destroyModalWatcher = $scope.$watch('$ctrl.authCtrl.isLoginModal', function(newVal) {
      // if login modal, point to inputs on modal
      if (newVal === true) {
        emailSelector = '#modal-email_login';
        hiddenLogInSelector = '#modal-hidden-log-in-btn';
        logInBtnSelector = '#modal-log-in-btn';
        passwordSelector = '#modal_pass_login';
        destroyModalWatcher();
      }
    });

    // public variables
    vm.unauthorized = false;
    vm.login_successful = false;
    vm.is_loading = false;
    vm.is_request_expired = false;
    vm.is_reset_successful = false;
    vm.is_verifying_request = true;
    vm.email_not_found = false;
    vm.account_blocked = false;
    vm.submitted = false;
    vm.user = {};
	vm.tokenSentCount = 0;
    vm.regexPassword = "(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!,%,&,@,#,$,^,*,?,_,~]).{8,25}";
    vm.emailRegex = AuthService.emailRegex;
    //self.emailFormat = "/^[a-z]+[a-z0-9._]+@[a-z]+\.[a-z.]{2,5}$/";


    // public methods
    vm.login = login;
    vm.logout = logout;
    vm.sendPasswordResetLink = sendPasswordResetLink;
    vm.resetPassword = resetPassword;
    vm.sendForgottenUsername = sendForgottenUsername;
    vm.sendAccountLock = sendAccountLockEmail;
    vm.verifyOrSendSmsToken = verifyOrSendSmsToken;
    vm.processUser = processUser;

    onLoad();

    function onLoad() {
      if (state === 'logout') {
        logout();
      } else if (state === 'changePassword') {
        vm.is_verifying_request = true;
        if (angular.isDefined($stateParams.token)) {
          vm.request_token = $stateParams.token;
          vm.request_email = $stateParams.email;
          verifyResetLink(vm.request_token, vm.request_email);
        }
      } else if (state === 'login') {
        $rootScope.hideLoginPopup = true;
        vm.email = $stateParams.email;
        vm.isLoginModalOpen = true;
        // redirect to home when sms verify modal is closed
        $scope.$watch('auth_ctrl.showSmsModal', function(newVal) {
          if (newVal === false && AuthService.isAuthenticated()) {
            $state.go('dashboard_home');
          }
        });
        // $state.data.isLogout is set from app.js
        if (AuthService.isAuthenticated()) {
          $state.go('home');
        }
      } else if (state === 'forgotUsername' || state === 'forgotPassword') {
        vm.user = {
          contactNumType: 'work'
        };
        vm.onlyNumbers = /^[0-9]+$/;
      } else if (state === 'smsVerify'){
          console.log("SMS verify");
          vm.user = AuthService.getUser()
          $("html, body").animate({ scrollTop: 50}, 1000);

      } else if (statesWithSmsModal[state]){
        // if sms modal, retrieve user since it's using different authCtrl than login
        vm.user = AuthService.getUser() || {};
		vm.tokenSentCount = 0;
        vm.isTokenVerified = null;
      }

      if ($state.current.name.search(/dashboard/i) == -1) {
        swal.close();
      } else {
        if (angular.isUndefined($scope.user)) {
          swal({
              title: 'Unauthorized Access',
              text: "Please log in to access the dashboard. You will now be redirected to the Home page. " +
                  "If you are not redirected in 10 seconds, please click OK below.",
              type: 'warning',
              showConfirmButton: true,
              timer: 10000
          }, function () {
              if ($state.current.name !== 'home') {
                  $state.go('home');
              }
          });
        }
      }
    }

    function login(user, fromLogInPage) {
      $(".spin").css({
        display: 'inline-block'
      });
      console.log(user);
      vm.unauthorized = false;
      vm.is_loading = true;
      vm.login_successful = false;
      vm.account_blocked = false;

      if (!user.username || !user.password) {
        if (!vm.isLoginModal) {
          swal({
            title: "Please try again.",
            text: " A valid username and password are required. ",
            type: "warning"
          }, function () {
            $(".spin").css({
              display: 'none'
            });
            setTimeout(function () {
              vm.user.password = '';
              $(passwordSelector).val('');
              if (!user.username) {
                $(emailSelector).focus();
                $(emailSelector).val('');
              } else {
                $(passwordSelector).focus();

              }
            }, 1);

          });

          $(".spin").css({
            display: 'none'
          });
        } else {
          vm.user.password = '';
          $(passwordSelector).val('');
          if (!user.username) {
            $(emailSelector).focus();
            $(emailSelector).val('');
          } else {
            $(passwordSelector).focus();
          }
        }

        return;
      }

      AuthService.login(user).then(
          function (response) {
            vm.user._id = response.data._id;

            AuthService.saveSession(response.data);

            // TODO: trigger right hidden button
            $timeout(function() {
              var selector = fromLogInPage ? 'div.login' : 'rv-login-popup';
              $(selector + " " + hiddenLogInSelector).click();
            }, 100);
          },
          function (err) {
            console.log("Error logging in", err);
            vm.is_loading = false;
              if (angular.isDefined(err.status) && err.status === 401) {
              swal({
                title: "Please try again.",
                text: "The " + ((!$stateParams.email)?"Username and/or ":"") + "Password does not match our records.",
                type: "warning"
              }, function () {
                $(".spin").css({
                  display: 'none'
                });

                setTimeout(function () {
                  vm.user.password = '';
                  $(passwordSelector).val('');
                  if (!user.username) {
                    $(emailSelector).focus();
                    $(emailSelector).val('');
                  } else {
                    $(passwordSelector).focus();
                  }
                }, 1);
                vm.wrongUsernamePass && vm.wrongUsernamePass();
              });
            };
            if (angular.isDefined(err.status) && err.status === 422) {
              if (err.data.error_type === 'account_blocked') {
                vm.account_blocked = true;

                if (vm.isLoginModal) {
                    // closes the login modal
                    $('#loginModal').modal('hide');
                }

                swal({
                  title: "Account Locked",
                  text: "Your account has been locked due to three unsuccessful log in attempts. " +
                  "Please check your email and follow instructions on how to unlock your account.",
                  confirmButtonText: "OK",
                  closeOnConfirm: true,
                  type: "warning"
                }, function () {
                  if (!vm.isLoginModal) {

                    setTimeout(function () {
                      vm.user.password = '';
                      $(passwordSelector).val('');
                      $(emailSelector).val('');
                      $(emailSelector).focus();

                      vm.user.password = '';
                      vm.user.username = '';
                    }, 1);
                  } else {
                    $state.go('home');
                  }
                });

                console.log("Sending account block email to : " + user.username);
                vm.sendAccountLock(user.username);



                // put focus on 'OK' button on sweetalert
                hackService.scrollAnim('div.sweet-alert button.confirm');
              } else if (err.data.error_type === 'account_blocked_ip') {

                if (vm.isLoginModal) {
                    // closes the login modal
                    $('#loginModal').modal('hide');
                }

                vm.account_blocked_ip = true;
                swal({
                  title: "IP Address Locked",
                  text: "Your IP Address has been locked due to multiple unsuccessful log in attempts.  " +
                  "Your account will be unlocked automatically after 5 hours",
                  type: "warning",
                  closeOnConfirm: true
                }, function () {
                  if (!vm.isLoginModal) {

                      setTimeout(function () {
                          vm.user.password = '';
                          $(passwordSelector).val('');
                          $(emailSelector).val('');
                          $(emailSelector).focus();

                          vm.user.password = '';
                          vm.user.username = '';
                      }, 1);
                  } else {
                      $state.go('home');
                  }

                });


              }
            }

            $(".spin").css({
              display: 'none'
            });
            
          }
      );
    }

    function processUser() {

      userService.get({
        userId: vm.user._id
      }, function (loggedInUser) {
        vm.user = loggedInUser;

        if (angular.isDefined(loggedInUser.username)) {

          console.log(" Account " + loggedInUser.username + "  " + loggedInUser.status);

          if(loggedInUser.status=='pending'){

            $(".spin").css({
              display: 'none'
            });

              if (vm.isLoginModal) {
                  // closes the login modal
                  $('#loginModal').modal('hide');
              }

            //AuthService.sendSmsToken(user.email);

            swal({
              title: "Email Verification Required",
              html: true,
              text: "To access your account, you need to verify your email by clicking the verification link we recently sent you. " +
              "For your convenience, we are re-sending you the link at the email address on record. Please click OK below and verify " +
              "your email so you can log in and enjoy the benefits of Ratingsville.com.",
              type: "warning"
            }, function () {
                logout();
                localStorage.removeItem('userId');

              setTimeout(function () {
                vm.user.password = '';
                $(passwordSelector).val('');
                if (!vm.user.username) {
                  $(emailSelector).val('');
                }
                $("#homeTxtDayCare").focus();
              }, 1);
            });

          } else {
            AuthService.setUser(loggedInUser);
            vm.login_successful = true;
            localStorage.setItem('userId', vm.user._id);
            $rootScope.$broadcast('user-logged-in');
            vm.is_loading = false;
            AutoLogoutService.start();

            console.log("Successful logging in. ");
            console.log("Mobile Verified: " + (loggedInUser.phone_number_verified==true).toString());

            var current_state = $state.current.name;
            if(!loggedInUser.phone_number_verified || loggedInUser.phone_number_verified === 'false') {
              if(statesWithSmsModal[current_state]){
                $rootScope.$broadcast("showSmsVerifyModal");
                if (current_state === 'search') {
                  $state.reload();
                }
              }else{
                $state.go('smsVerify', {
                  redirectTo: route_name,
                  uId: user_id,
                  docId: doc_id
                });
              }
            }
            else {
              if(route_name && user_id && doc_id){
                $state.go(route_name, {
                  userId: user_id,
                  docId: doc_id
                });
              }else if(/(home)|(smsVerify)/.test(current_state) || !statesWithSmsModal[current_state]){
                $state.go('dashboard_home');
              }else if(current_state === 'search'){
                $state.reload();
              }
            }
          }
        }
      });
    }

    function logout() {
      AuthService.logout();
      AutoLogoutService.stop();
      $state.go('home');
    }

    function verifyResetLink(token, email) {

      AuthService.verifyResetLink(token, email).then(
          function (response) {
            vm.requester = {
              email: response.data.reset_request.email,
              token: token
            };
            vm.is_request_expired = false;
            vm.is_verifying_request = false;

            $timeout(function () {
              $('#password').focus();
            }, 2);

          },
          function (err) {
            vm.is_request_expired = true;
            vm.is_verifying_request = false;

          }
      );
    }

    function verifyOrSendSmsToken(token, email, sendToken, remindMe) {  
      if (AuthService.isAuthenticated()) {
        var inProfile = $state.current.name == 'dashboard_profile';
        var inSearch = $state.current.name == 'search';
        if (remindMe) {
          if (inProfile) {
            $('#need-sms-verify').modal('hide');
          } else if(inSearch){
            $('#need-sms-verify').modal('hide');
          } else if (route_name && user_id && doc_id) {
            $state.go(route_name, {
              userId: user_id,
              docId: doc_id
            });
          } else {
            $state.go('dashboard_home');
          }
          return;
        }
        console.log('Verify or Send Sms Token: ' + token + ' for ' + email);

        vm.isMissingToken = false;

        if (!token && !sendToken) {
            // setTimeout(function () {  $('#requestSms').focus(); }, 1);
            vm.isMissingToken = true;
			setTimeout(function () {  $('input[name="tokenCode"]').focus(); }, 1);
          return;
        }

        if(sendToken){
          // send new token
          AuthService.sendSmsToken(email).then(
              function (response) {
                  console.log("Point 2");
                setTimeout(function () {  $('input[name="tokenCode"]').focus(); }, 1);
				vm.tokenSentCount += 1;
                vm.isTokenVerified=null;
              },
              function (err) {
                  console.log("Point 3");
                setTimeout(function () {  $('input[name="tokenCode"]').focus(); }, 1);
				vm.tokenSentCount += 0;
                console.log("Error Sms:" + err);
              }
          );
        } else {
          // verify token
          AuthService.verifySmsToken(token, email).then(
              function (response) {
                vm.isTokenVerified = true;
                if (inProfile||inSearch) {
                  $('#need-sms-verify').modal('hide');
                }
                swal({
                  title: 'Cell Number Verification Successful',
                  text: (inProfile||inSearch)?'This window will disappear in 10 seconds. If it does not, click OK to close the window.':'You will now be redirected to your dashboard. If you are not redirected in 10 seconds, please click OK below.',
                  type: 'success',
                  showConfirmButton: true,
                  closeOnConfirm: true,
                  timer: 10000
                }, function (isConfirm) {
                  if (inSearch||inProfile) {
                    console.log("ImInSearch");
                    swal.close();

                    if ($('#need-sms-verify').length) $('#need-sms-verify').modal('hide');
                    if ($('#smsVerifyModal').length) $('#smsVerifyModal').modal('hide');

                    if (inSearch) {
                      if($("#txtDayCareAdv").is( ":visible" )){
                          $("#txtDayCareAdv").focus();
                      } else if ($("#txtDayCare").is( ":visible" )){
                          $("#txtDayCare").focus();
                      }
                    }
                  } else {
                    window.location.href = window.location.href.split('#')[0] + "#/dashboard";
                  }
                });
              },
              function (err) {
                swal({
                  title: 'Please try again',
                  text: 'The SMS code you entered is incorrect. Please enter the correct code.',
                  type: 'warning',
                  showConfirmButton: true,
                  allowEscapeKey: (inProfile||inSearch)?false:true
                }, function (isConfirm) {
                  setTimeout(function () {  $('input[name="tokenCode"]').focus(); }, 1);
                });
                vm.isTokenVerified = false;
              }
          );
        }
      } else {
        $state.go('home');
      }
    }

    function resetPassword(user, changePasswordForm) {

      vm.is_loading = true;
      vm.hasErrors = false;
      vm.is_reset_successful = false;

      //if (!changePasswordForm.$valid) {
      //  var errors = [];
      //
      //  vm.is_loading = false;
      //
      //  $timeout(function () {
      //    $('#password').focus();
      //  }, 2);
      //
      //  return;
      //}
      if (vm.is_loading) {
        console.log('changing password');
        $("[name='" + changePasswordForm.$name + "']").find(".spin").css({
          display: 'inline-block'
        });
        if (!changePasswordForm.$valid) {
          console.log('valid error form');
          var errors = [];

          vm.is_loading = false;

          $("[name='" + changePasswordForm.$name + "']").find(".spin").css({
            display: 'none'
          });

          setTimeout(function () {

            var firstErrorElement = angular.element("[name='" + changePasswordForm.$name + "']").find('[class*="ng-invalid"]:visible:first');

            firstErrorElement.focus();

            $("html, body").animate({ scrollTop: firstErrorElement.offset().top - 300}, 1000);

          }, 1);


          return;
        }

        AuthService.saveNewPassword(user).then(function (response) {
          vm.is_loading = false;
          vm.is_reset_successful = true;

          $("[name='" + changePasswordForm.$name + "']").find(".spin").css({
            display: 'none'
          });

          swal({
            title: 'Password Reset Successful',
            text: "Please use your new password to log in.  You will now be redirected to the Home page. " +
                  "If you are not redirected in 10 seconds, please click OK below.",
            type: 'success',
            showConfirmButton: true,
            timer: 10000
          }, function (isConfirm) {
        window.location.href = window.location.href.split('#')[0] + "#/home";
        //$state.go('home');

            setTimeout(function () {
              vm.user.password = '';
              vm.user.username = '';

              $(passwordSelector).val('');
              $(emailSelector).focus();

            }, 1);
          });

        }, function (err) {

          if (err.data) {
            vm.is_reset_successful = false;
          }

          vm.hasErrors = true;
          vm.errorText = err.data.error;
          vm.is_loading = false;

          $("[name='" + changePasswordForm.$name + "']").find(".spin").css({
            display: 'none'
          });

          $('#password').focus();
        });
      }

    }



    function sendPasswordResetLink(user_email, passResetForm) {

      if (!passResetForm.$valid) {
        var errors = [];

        setTimeout(function () {
          if (!passResetForm.$valid) {
            var firstErrorElement = angular.element("[name='" + passResetForm.$name + "']").find('.ng-invalid:visible:first');

            firstErrorElement.focus();

            $("html, body").animate({ scrollTop: firstErrorElement.offset().top - 300}, 1000)
          }
        }, 1);

        return;
      }

      if (user_email) {

        $(".spin").css({
          display: 'inline-block'
        });
        vm.is_loading = true;

        AuthService.forgotPassword(user_email.toLowerCase())
            .then(
                function (response) {
                  vm.sending_email_success = true;
                  vm.email_not_found = false;
                  vm.is_loading = false;
                  console.log(response);
                  $(".spin").css({
                    display: 'none'
                  });
                }, function (err) {
                  vm.email_not_found = false;
                  vm.sending_email_error = false;

                  if (err.status === 422) {
                    vm.email_not_found = true;
                  } else {
                    vm.sending_email_error = true;
                  }

                  vm.is_loading = false;

                  $(".spin").css({
                    display: 'none'
                  });

                  //setTimeout(function () {
                  $('#forgotPasswordEmail').focus();
                  //}, 1);
                }
            );
      }
    }

    function sendAccountLockEmail(user_email) {
      if (user_email) {
        $(".spin").css({
          display: 'inline-block'
        });
        vm.is_loading = true;

        AuthService.accountLock(user_email)
            .then(
                function (response) {
                  vm.sending_email_success = true;
                  vm.email_not_found = false;
                  vm.is_loading = false;
                  console.log(response);
                  $(".spin").css({
                    display: 'none'
                  });
                }, function (err) {
                  vm.email_not_found = false;
                  vm.sending_email_error = false;
                  if (err.status === 422) {
                    vm.email_not_found = true;
                  } else {
                    vm.sending_email_error = true;
                  }
                  vm.is_loading = false;
                  $(".spin").css({
                    display: 'none'
                  });
                }
            );
      }
    }

    function sendForgottenUsername(user, forgotUsernameForm) {


      if (!forgotUsernameForm.$valid) {
        var errors = [];

        setTimeout(function () {

          var firstErrorElement = angular.element("[name='" + forgotUsernameForm.$name + "']").find('.ng-invalid:visible:first');

          firstErrorElement.focus();

          $("html, body").animate({ scrollTop: firstErrorElement.offset().top - 300}, 1000)
        }, 1);


        return;
      }

      $(".spin").css({
        display: 'inline-block'
      });
      vm.is_loading = true;
      vm.email_not_found = false;
      vm.sending_email_error = false;
      vm.error_code = '';


      AuthService.forgotUsername(user)
          .then(
              function (response) {
                vm.emailClue = response.data.emailClue;
                vm.sending_email_success = true;
                vm.is_loading = false;
                //<a href='/web/#/login'>here</a>.</p>
                swal({
                  title: 'Success',
                  html: true,
                  text: "  <p>Our records show your email address as </p> <p><b>" + vm.emailClue + "</b></p> " +
                  "<p> Please use this email to log in.</p>  <p>You will now be redirected to the Home page. " +
                  "If you are not redirected in 10 seconds, please click OK below.",
                  type: 'success',
                  showConfirmButton: true,
                  timer: 10000
                }, function (isConfirm) {

                  $state.go('home');

                  setTimeout(function () {
                    vm.user.password = '';
                    vm.user.username = '';

                    $(passwordSelector).val('');
                    $(emailSelector).val('');
                    $(emailSelector).focus();

                  }, 1);

                });

                $(".spin").css({
                  display: 'none'
                });

              }, function (err) {
                vm.is_loading = false;
                if (err.status === 422) {
                  vm.error_code = err.data.error_code;
                  vm.email_not_found = true;
                  console.log("Error Code:  " + vm.error_code);
                } else {
                  vm.sending_email_error = true;
                }

                $(".spin").css({
                  display: 'none'
                });
              }
          );


    }

    // listen for events my dear
    $rootScope.$on('open-modal', function(e, event) {
        vm.user = angular.copy($rootScope.currentModalModel);
        // check that there is no current $digest process to prevent error when using $apply
        if(!$scope.$$phase) {
            $scope.$apply();
        }

    });

    getFormData();

    function getFormData() {
      vm.months = StaticDataService.getListOfMonths();
      vm.days = StaticDataService.getListOfDays();
      vm.years = StaticDataService.getListOfYears();
    }

    vm.setCallbacks = setCallbacks;

    // callbacks = {wrongUsernamePass}
    function setCallbacks(callbacks) {
      vm.wrongUsernamePass = callbacks.wrongUsernamePass;
    }
  }

})();