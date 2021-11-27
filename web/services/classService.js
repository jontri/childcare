var classService = angular.module('classService', ['ngResource']);

classService.factory('classService', ['$resource',

    function($resource) {
        return $resource(
            '/api/class/:classId', {}, {
                get: {
                    url:'/api/class/:providerId',
                    method: 'GET',
                    params: {
                        listingId:'@listingId',
                    },
                    isArray: true
                },
                getClass: {
                    url:'/api/classroom/:classId',
                    method: 'GET',
                    isArray: false
                },
                save: {
                    url:'/api/class/add',
                    method: 'POST',
                    isArray: false
                },
                update: {
                    method: 'PUT'
                }
            }
        );
    }
    
]);