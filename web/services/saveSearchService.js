var saveSearchService = angular.module('routerApp');

saveSearchService.factory('saveSearchService', ['$resource',

    function($resource) {
        return $resource(
            '/api/saveSearch', null, 
            {
                'get': {
                    url :'/api/saveSearch/:userId',
                    method: 'GET',
                    isArray: true
                },
                'getByTag' : {
                    url : '/api/saveSearch/:userId/:searchTag',
                    method: 'GET',
                    isArray: true,
                    params:{
                        userId : '@userId',
                        searchTag : '@searchTag'
                    }
                },
                'getById' : {
                    url :'/api/saveSearch/:userId',
                    method: 'POST',
                    isArray: true
                },
                'post' : {
                    method: 'POST'
                },
                'put' : {
                    method: 'PUT'
                },
                'removeFilter' : {
                    url : '/api/saveSearch/:filterId',
                    method: 'DELETE'
                }
            }
        );
    }
]);