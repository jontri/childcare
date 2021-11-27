(function() {
  'use strict';

  var restrictTo = function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attributes, modelCtrl) {
        var regex, prevVal;

        scope.$watch(attributes.ngModel, function(val) {
          if (val && regex && prevVal !== val) {
            var res = val.match(regex);
            prevVal = '';
            if (res) {
              res.forEach(function(char) {
                prevVal = prevVal.concat(char);
              });
            }
            modelCtrl.$setViewValue(prevVal);
            modelCtrl.$render();
          }
        });

        attributes.$observe('restrictTo', function(pattern) {
          regex = new RegExp(pattern, 'g');
        });
      }
    };
  };

  angular
    .module('routerApp')
    .directive("restrictTo", [restrictTo]);

})();