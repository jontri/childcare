var allUserService = angular.module('allUserService', ['ngResource']);

allUserService.factory('allUserService', ['$resource',
    function($resource) {
        return $resource('/api/all_users', {}, {
            query: {
                method: 'GET',
                params: {
                    
                },
                isArray: false
            },
            deleteUser: {
                method: 'POST',
                url: '/api/user/delete'
            }
        });

    }
]);