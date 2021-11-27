(function(angular, $) {
  'use strict';

  var rvFloater = function($window) {
    return {
      restrict: 'A',
      link: function(scope, element, attributes) {
        var defaultObj = {
          initTop: 0,
          topOffset: 0
        };
        var gap = 0,
          objHeight = 0,
          right = 0,
          offsetMode = false;

        $(element).css('position', 'fixed');
        $(element).css('z-index', '5');

        $($window).scroll(function(e) {
          if (gap > 0) {
            var scrollY = Math.round(this.scrollY);
            if (scrollY > gap) {
              if (!offsetMode) {
                $(element).css('top', defaultObj.topOffset + objHeight);
                offsetMode = true;
              }
            } else {
              $(element).css('top', defaultObj.initTop - scrollY);
              offsetMode = false;
            }
          }
        });

        attributes.$observe('rvFloater', function(val) {
          if (val) {
            angular.extend(defaultObj, JSON.parse(val));
            $(element).css('top', defaultObj.initTop ? defaultObj.initTop : (defaultObj.topOffset + objHeight));
            calculateGap();
          }
        });
        attributes.$observe('rvObjHeight', function(val) {
          if (val) {
            objHeight = parseInt(val);
            if (!defaultObj.initTop) {
              $(element).css('top', defaultObj.topOffset + objHeight);
            }
          }
        });
        attributes.$observe('rvRight', function(val) {
          if (val) {
            $(element).css('right', right = parseInt(val));
            calculateGap();
          }
        });

        function calculateGap() {
          gap = defaultObj.initTop - objHeight - defaultObj.topOffset;
        }
      }
    };
  };

  angular
    .module('routerApp')
    .directive("rvFloater", rvFloater);

  rvFloater.$inject = ['$window'];

})(angular, $);