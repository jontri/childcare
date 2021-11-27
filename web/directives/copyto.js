(function() {
    'use strict';

    var copyTo = function() {
        return {
            require: "ngModel",
            scope: {
                otherModelValue: "=copyTo",
                dontCopy: "=dontCopy"
            },
            link: function(scope, element, attributes, ngModel) {

                ngModel.$validators.copyTo = function(modelValue) {
                    if (!scope.dontCopy) {
                      scope.otherModelValue = modelValue;
                    }

                    return true;
                };

                scope.$watch("otherModelValue", function() {
                    ngModel.$validate();
                });
            }
        };
    };

    angular
        .module('routerApp')
        .directive("copyTo", copyTo);

})();