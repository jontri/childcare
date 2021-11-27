var appointmentService = angular.module('appointmentService', ['ngResource']);

appointmentService.factory('appointmentService', ['$resource',
    function($resource) {

        return $resource('/api/appointment/:appointmentId', {}, {
            put: {
                method: 'PUT'
            },
            schedule: {
                method: 'POST'
            }
            
        });

    }
]);