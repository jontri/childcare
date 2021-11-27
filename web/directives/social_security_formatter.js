(function(angular) {
  'use strict';

  var rvSsFormatter = function() {
    return {
      restrict: 'A',
      link: function(scope, element, attributes) {
        attributes.$observe('rvSsFormatter', function(ss) {
          if (ss) {
            var ssArr = ss.split(''),
              len = (ssArr.length >= 6) ? 6 : ssArr.length;
            for (var i = 0; i < len; i++) {
              if (ssArr[i] != '-') {
                ssArr[i] = 'X';
              }
            }
            element.text(ssArr.join(''));
          }
        });
      }
    };
  };

  angular
    .module('routerApp')
    .directive("rvSsFormatter", [rvSsFormatter]);

})(angular);