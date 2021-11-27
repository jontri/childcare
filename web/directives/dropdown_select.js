(function() {
    'use strict';

    angular
        .module('routerApp')
        .directive('rvDropdownSelect', rvDropdownSelect);

    rvDropdownSelect.$inject = [];

    function rvDropdownSelect() {

        return {
            restrict: 'A',
            link: link,
            scope: {
                selectOptions: '=selectOptions',
                selectItems: '=selectItems',
                selectType: '@',
                selectModel: '@',
                selectTextValue: '@',
                onSelectOption: '&onSelectOption'
            }
        }

        function link($scope, $element, $attributes) {

            // keep watching and unwatch if defined
            var unregister = $scope.$watchGroup(['selectOptions', 'selectItems'], function() {


                // make sure that the evaluated data is not undefined
                if ($scope.selectOptions && $scope.selectItems) {


                    if ($attributes.selectType === 'basic-dropdown') {
                            var control = '',
                                $select = '';
                        var $select = $element.selectize({
                            options: $scope.selectOptions,
                            items: $scope.selectItems,
                            hideSelected: false,
                            closeAfterSelect: true,
                            selectOnTab: true,
                            valueField: 'id',
                            labelField: 'name',
                            searchField: ['name'],
                            render: {

                            },
                            onChange: function(value) {
                                var administrator = '';
                                angular.forEach($scope.selectOptions, function(option) {

                                    if(angular.isDefined(option.administrator) && option.id === value) {
                                        administrator = option.administrator;
                                    }
                                });
                                
                                $scope.onSelectOption({
                                    model: $attributes.selectModel,
                                    id: value,
                                    administrator: administrator
                                });
                            },
                            onDropdownOpen: function($dropdown) {

                            }
                        });

                        var control = $select[0].selectize;

                    }

                }
            });

        }

    }

})();