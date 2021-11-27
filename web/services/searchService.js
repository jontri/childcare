var searchService = angular.module('searchService', ['ngResource']);

searchService.factory('searchService', ['$resource',

    function($resource) {
        return $resource(
            '/api/search', {}, {
                query: {
                    method: 'GET',
                    params: {
                        category: 'category'
                    },
                    isArray: false
                },
                search: {
                    method: 'GET',
                    isArray: false
                },
                filter: {
                    method: 'POST',
                    isArray: false
                }
            }
        );
    }
    
]);