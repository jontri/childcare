(function() {
    'use strict';

    var compareTo = function() {
        return {
            require: "ngModel",
            scope: {
                otherModelValue: "=compareTo",
                contrast: "=contrast"
            },
            link: function(scope, element, attributes, ngModel) {

                ngModel.$$setOptions({
                    updateOnDefault: true,
                    allowInvalid: true
                });

                ngModel.$validators.compareTo = function(modelValue) {
                    //console.log("Other Value: " + scope.otherModelValue + " Model Value: " + modelValue);
					if(modelValue !== undefined && modelValue.length > 0 &&
                        scope.otherModelValue !== undefined && scope.otherModelValue.length > 0)
						return scope.contrast ? modelValue != scope.otherModelValue : modelValue == scope.otherModelValue;

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
        .directive("compareTo", compareTo);

})();