(function(angular){
  'use strict';

  angular
    .module('routerApp')
    .directive('rvInfo', rvInfo);

  rvInfo.$inject = ['$sce'];

  function rvInfo($sce) {

    return {
      restrict: 'E',
      scope: {
        rvLabel: '='
      },
      link: link,
      templateUrl: function (elem, attr) {
        var path = "../templates/directives/";
        var type = attr.rvType ? attr.rvType : 'default';
        return path + 'dashboard_info_' + type + '.tpl.html';
      }
    }

    function link($scope, $element, $attributes) {
      var prefix;

      $scope.$sce = $sce;

      $attributes.$observe('rvInfoText', function(info) {
        if (info) {
          if ($attributes.rvType == 'address' || $attributes.rvType == 'table' || $attributes.rvType == 'list') {
            $scope.info = JSON.parse(info);
           } else if (info = info.trim()) {
             $scope.info = (prefix ? prefix + ' ' + info : info);
           }
        }
      });
      $attributes.$observe('rvStart', function(start) {
        $scope.start = start;
      });
      $attributes.$observe('rvEnd', function(end) {
        $scope.end = end;
      });
      $attributes.$observe('rvPrefix', function(val) {
        if ($attributes.rvType != 'address' && val) {
          prefix = val.trim();
          if ($scope.info) {
            $scope.info = prefix + ' ' + $scope.info;
          }
        }
      });
    }

  }

})(angular);