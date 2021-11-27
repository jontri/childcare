var docHelperService = angular.module('routerApp');

docHelperService.factory('docHelperService', ['AuthService', '$state', '$timeout',

  function(AuthService, $state, $timeout) {
    return {
      goToLogIn: goToLogIn
    }

    function goToLogIn(email, routeName, userId, docId, callback) {
      var user = angular.copy(AuthService.getUser());

      if (!user){
          $state.go('login', {
              email: email,
              redirectTo: routeName,
              uId: userId,
              docId: docId
          });
      }

      else if (!email || (user && user.email === email)) {
        callback();
      } else {
        AuthService.checkEmail(email)
          .then(function(res) {
            if (res.data) {
              if (AuthService.isAuthenticated) {
                AuthService.logout();
              }
              console.log("Route Name: " + routeName);

              $state.go('login', {
                email: email,
                redirectTo: routeName,
                uId: userId,
                docId: docId
              });

            } else {
              $timeout(function() {
                swal({
                  title: "Register",
                  text: "Registering now will autopopulate most of the forms with information on file with us and save you time",
                  type: 'warning',
                  showCancelButton: true,
                  showConfirmButton: true,
                  confirmButtonText: 'Register Now',
                  cancelButtonText: 'Continue As Guest',
                  showLoaderOnConfirm: true
                }, function (isConfirm) {
                  if (isConfirm) {
                    $state.go('register');
                  } else {
                    callback();
                  }
                });
                $('div.sweet-alert button.cancel').focus();
              }, 200);
            }
          }, function(err) {
            console.warn(err);
          });
      }
    }
  }
]);