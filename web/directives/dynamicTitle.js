(function($) {
    'use strict';

    angular
        .module('routerApp')
        .directive('dynamicTitle', dynamicTitle);

    dynamicTitle.$inject = [];

    function dynamicTitle($rootScope, $timeout) {
        return {
            link: function(scope, el) {
                $rootScope.$on('$stateChangeSuccess', function(event, toState) {
                    var title = (toState.data && toState.data.title)
                        ? "Ratingsville " + toState.data.title
                        : 'Ratingsville';
                    $timeout(function() {
                        el.text(title);
                    }, 0, false);
                });
            }
        };
    }

})($);
