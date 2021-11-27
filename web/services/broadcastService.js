var broadcastService = angular.module('broadcastService', ['ngResource']);

broadcastService.factory('broadcastService', ['$resource',
    function($resource) {
        return $resource('/api/broadcast', null, {
            get: {
                url : '/api/broadcast/:type',
                method: 'GET',
                isArray: true,
                params:{
                    type : '@type'
                }
            },
            insert:{
                method:'POST'
            }
        });
    }
]);


