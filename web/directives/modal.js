(function() {
    'use strict';

    angular
        .module('routerApp')
        .directive('rvModal', rvModal);

    rvModal.$inject = ['$rootScope'];

    function rvModal($rootScope) {

        return {
            restrict: 'A',
            link: link,
            scope: {
                modalSrcObj: '&modalSrcObj'
            }
        }

        function link($scope, $element, $attributes) {

            $element.click(function(event) {

                $rootScope.currentModal = $attributes.modalId;
                $rootScope.currentModalModel = {};

                if (angular.isDefined($scope.modalSrcObj())) {
                    $rootScope.currentModalModel = $scope.modalSrcObj();
                }

                angular.element($attributes.modalId).modal({
                    keyboard: angular.isDefined($attributes.modalNoEsc)?false:true,
                    backdrop: angular.isDefined($attributes.modalBackdrop)?$attributes.modalBackdrop:true
                });

                $rootScope.$broadcast('open-modal');

            });
        }
    }


})();