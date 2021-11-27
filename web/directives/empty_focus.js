(function() {
    'use strict';

    var emptyFocus = function() {
        return function(scope, element) {
            element.bind('focus', function() {
                alert('focus on ' + element);
            });
        };
    };

    angular
        .module('routerApp')
        .directive("emptyFocus", emptyFocus);

})();