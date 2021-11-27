var providerService = angular.module('providerService', ['ngResource']);

providerService.factory('providerService', ['$resource',
    function($resource) {
        return $resource('/api/all_providers', {}, {
            query: {
                method: 'GET',
                params: {
                    
                },
                isArray: false
            }
        });

    }
]);