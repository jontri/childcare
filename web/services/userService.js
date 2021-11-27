var userService = angular.module('userService', ['ngResource']);

userService.factory('userService', ['$resource',
    function($resource) {

        return $resource('/api/user/:userId', {}, {
            query: {
                method: 'POST',
                params: {
                    name: 'name'
                },
                isArray: false
            },
            update: {
                method: 'PUT'
            },
            save : {
                method: 'POST',
                url: '/api/user/register'
            },
            saveSecurityInformation: {
                method: 'POST',
                url: '/api/user/update'
            },
            activateUser:{
                method : 'POST',
                url : '/api/activateUser'
            },
            getStaff:{
                method: 'GET',
                url: '/api/staff/:listingId',
                isArray : true
            },
            getStaffById:{
                method: 'GET',
                url: '/api/staffById/:staffId'
            },
            addStaff:{
                method: 'POST',
                url: '/api/staff/addStaff'
            },
            removeStaff:{
                method: 'POST',
                url: '/api/staff/removeStaff'
            },
            updateStaff:{
                method: 'POST',
                url: '/api/staff/updateStaff'
            },
            addFavorites:{
                method : 'POST',
                url : '/api/favorites'
            },
            getFavorites:{
                method : 'GET',
                url : '/api/favorites/:userId',
                isArray: true
            },
            removeFavorites:{
                method: 'POST',
                url:'/api/favorites/remove'
            },
            sendRevApprovalEmail:{
                method: 'POST',
                url:'/api/sendRevApprovalEmail'
            }
        });

    }
]);