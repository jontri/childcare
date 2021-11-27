var memberService = angular.module('memberService', ['ngResource']);

memberService.factory('memberService', ['$resource',
    function($resource) {
        return $resource('/api/all_parents', {}, {
            query: {
                method: 'GET',
                params: {
                    
                },
                isArray: false
            }
        });

    }
]);