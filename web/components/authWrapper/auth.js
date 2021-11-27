(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('authWrapper', {
      controller: AuthWrapperCtrl,
      templateUrl: './components/authWrapper/auth.html',
      transclude: {
        'content': 'content'
      }
    });

  function AuthWrapperCtrl($controller, $scope) {
    var ctrl = this;

    var authCtrl = $controller('authCtrl', {
      $scope: $scope
    });

    ctrl.authCtrl = authCtrl;
  }

  AuthWrapperCtrl.$inject = ['$controller', '$scope'];
})(angular);