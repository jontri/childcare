var clientService = angular.module('clientService', ['ngResource']);

clientService.factory('clientService', ['$resource',

    function($resource) {
        return $resource(
            '/api/clients', {}, {
                get: {
                    url:'/api/clients/:providerId',
                    method: 'GET',
                    isArray: true
                },
                getDaycareClient: {
                    url:'/api/clients/:providerId/:daycareId',
                    method: 'GET',
                    isArray: true
                },
                getClient:{
                    url:'/api/clients/:clientId',
                    params: {
                        clientId:'@clientId'
                    },
                    method: 'GET',
                    isArray: true
                },
                getClientData:{
                    url:'/api/client/:clientId',
                    params: {
                        clientId:'@clientId'
                    },
                    method: 'GET',
                    isArray: false
                },
                removeClient:{
                    url: '/api/client/:clientId',
                    method: 'DELETE'
                },
                getStudent:{
                    url:'/api/client/student/:studentId',
                    params: {
                        clientId:'@studentId'
                    },
                    method: 'GET',
                    isArray: false
                },
                add: {
                    method: 'POST',
                    url: '/api/clients/add'
                },
                update: {
                    method: 'POST',
                    url: '/api/clients/update'
                },
                addGuardian: {
                    method: 'POST',
                    url: '/api/clients/guardian/add'
                },
                addStudent: {
                    method: 'POST',
                    url: '/api/clients/student/add'
                },
                removeGuardian: {
                    method: 'DELETE',
                    url: '/api/clients/guardian/:guardianId'
                },
                updateGuardian: {
                    method: 'POST',
                    url: '/api/clients/guardian/update'
                },
                updateStudent: {
                    method: 'POST',
                    url: '/api/clients/student/update'
                }
            }

        );
    }
]);