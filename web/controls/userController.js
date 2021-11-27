var userController = angular.module('userController',[]);

userController.controller('userCtrl', 
                          ['$scope', 
                           'userService', 
                           function ($scope, 
                                     userService) {
  var self = $scope;


  console.log($cookies.getAll());

  userService.save({email:'jorzi@yahoo.com'}, function(response) {
    self.response =  response;
  });

  
  // ******************* register employee *******************
    var regForm = function () {
            this.firstName = '';
            this.lastName = '';
            this.country = '';
            this.phoneNumber = '';
            this.email = '';
            this.password = '';
            this.rePassword = '';
        },
        hasError = function () {
            if (!self.regForm) {
                return false;
            }

            var error = {},
                regForm = self.regForm;

            if (regForm.firstName.length == 0) {
                error.firstName = 'required*';
            }

            if (regForm.lastName.length == 0) {
                error.lastName = 'required*';
            }

            if (regForm.country.length == 0) {
                error.country = 'required*';
            }

            if (regForm.email.length == 0) {
                error.email = 'required*';
            }

            if (regForm.password.length == 0) {
                error.password = 'required*';
            } else if (regForm.password.length < 6) {
                error.password = 'minimum of 6 characters';
            }

            if (regForm.rePassword.length == 0) {
                error.rePassword = 'required*';
            } else if (regForm.rePassword != regForm.password) {
                error.rePassword = 'Password did not match*'
            }

            
            return error
        },
        submitForm = function () {
            self.formError = hasError();

            if (Object.keys(self.formError).length > 0) {
                console.warn('to do has error');
                return;
            }
        };

    self.regForm = new regForm();
    self.submit = submitForm;
    self.formError = {};

}]);


