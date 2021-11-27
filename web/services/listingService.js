var listingService = angular.module('listingService', ['ngResource']);

listingService.factory('listingService', ['$resource',
    function($resource) {
        return $resource('/api/listing/:listingId', {}, {
            query: {
                method: 'POST',
                params: {
                    name: 'name'
                },
                isArray: false
            },
            getList: {
                method: 'GET',
                url: '/api/listing'
            },
            approveListing: {
                method: 'POST',
                url: '/api/listing/approve'
            },
            listingByEmail: {
                method: 'POST',
                url: '/api/listingByEmail'
            },
			addRoleByListingId:{
				//params:{ listing: listing},
				method: 'POST',
                url: '/api/listing/addRoleByListingId'
			}
        });

    }
]);