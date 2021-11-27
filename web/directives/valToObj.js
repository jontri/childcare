(function(angular){
  'use strict';

  angular
    .module('routerApp')
    .directive('valToObj', valToObj);

  valToObj.$inject = ['$window'];

  function valToObj($window) {

    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        valToObj: '=',
        rvProperty: '='
      },
      link: link
    }

    function link($scope, $element, $attributes, modelCtrl) {
      modelCtrl.$parsers.push(function(val) {
        var prop = $scope.rvProperty || $attributes.rvProperty;
        if (val && prop) {
          return val[prop];
        }
        return val;
      });

      modelCtrl.$formatters.push(function(val) {
        var prop = $scope.rvProperty || $attributes.rvProperty;
        if (val && typeof val != 'object' && $scope.valToObj && prop) {
          if ($scope.valToObj instanceof Array) {
            for (var i = 0; i < $scope.valToObj.length; i++) {
              if (val === $scope.valToObj[i][prop]) {
                return $scope.valToObj[i];
              }
            }
          }
        }
        return val;
      });
    }

  }

})(angular);