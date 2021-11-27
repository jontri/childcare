(function(){
    'use strict';

    angular
        .module('routerApp')
        .directive('rvTooltip', rvTooltip);

    rvTooltip.$inject = [];

    function rvTooltip() {

        return {
            restrict: 'A',
            link: link,
            scope: {
                title: '@title'
            }
        }


        function link($scope, $element, $attributes) {
            if (typeof $attributes.observe != 'undefined') {
                $attributes.$observe('observe', function(val) {
                    if (val) {
                        setTimeout(function() {
                            $element.tooltip({ title: $attributes.title });
                        }, 0);
                    }
                });
            } else {
                $element.tooltip({ title: $attributes.title });
            }
        }

    }

})();
