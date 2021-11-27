(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('templateCtrl', templateCtrl);

    templateCtrl.$inject = ['$state', 'AuthService', '$rootScope'];

    function templateCtrl($state, AuthService, $rootScope) {
        var vm = this;

        vm.user = angular.copy(AuthService.getUser());
        // console.log(vm.user);

        vm.user_is_logged_in = AuthService.isAuthenticated();

        $rootScope.$on('user-logged-out', function(event) {
            vm.user_is_logged_in = false;
        });

        $rootScope.$on('user-logged-in', function(event) {
            vm.user_is_logged_in = true;
        });
    }

})();
