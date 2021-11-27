(function() {
    'use strict';

    angular
        .module('routerApp')
        .factory('AuditLogService', AuditLogService);

    AuditLogService.$inject = ['$auth', 'API_ENDPOINT', 'storage', '$http'];

    function AuditLogService($auth, API_ENDPOINT, storage, $http) {

        return {
            addAuditLog: addAuditLog,
			getAuditLog: getAuditLog,
			updateAuditLog:updateAuditLog,
			countAllVisitSite:countAllVisitSite
        }

        function addAuditLog(ip_address, email, url_visited, visit_counter) {
            return $http.post(API_ENDPOINT + '/addAuditLog', {
                ip_address: ip_address,
				email: email,
				url_visited: url_visited,
				visit_counter: visit_counter
            });
        }
		
		function getAuditLog(ip_address, email){
			return $http.post(API_ENDPOINT + '/getAuditLog', {
                ip_address: ip_address,
				email: email
            });
		}
		
		function updateAuditLog(visit_counter, id){
			return $http.post(API_ENDPOINT + '/updateAuditLog', {
                visit_counter: visit_counter,
				id:id
            });
		}
		
		function countAllVisitSite(){
			return $http.post(API_ENDPOINT + '/incrementOverallAuditLog', {});
		}
    }

})();