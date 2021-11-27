var documentService = angular.module('documentService', ['ngResource']);

documentService.factory('documentService', ['$resource',

    function($resource) {
        var getToken = function (){
            console.log('Token: Bearer '+localStorage.getItem('satellizer_token'));
            return 'Bearer '+localStorage.getItem('satellizer_token');
        }
        return $resource(
            '/api/document', {}, {
                saveEnrollment: {
                    url:'/api/document/enroll',
                    method: 'POST'
                },
                updateEnrollment: {
                    url:'/api/document/enroll/update',
                    method: 'POST'
                },
                getEnrollment: {
                    url:'/api/document/enroll/:userId/:docId',
                    method: 'GET',
                    isArray: false
                },
                saveEmergencyCard: {
                    url:'/api/document/emergencycard',
                    method: 'POST'
                },
                updateEmergencyCard: {
                    url:'/api/document/emergencycard/update',
                    method: 'POST'
                },
                getEmergencyCard: {
                    url:'/api/document/emergency/:userId/:docId',
                    method: 'GET',
                    isArray: false
                },
                saveMedAuth: {
                    url:'/api/document/medauth',
                    method: 'POST'
                },
                updateMedAuth: {
                    url:'/api/document/medauth/update',
                    method: 'POST'
                },
                getMedAuth: {
                    url:'/api/document/medauth/:userId/:docId',
                    method: 'GET',
                    isArray: false
                },
                prepareDoc: {
                    url:'/api/document/prepare',
                    method: 'POST',
                    isArray:false,
                },
                downloadPdf :{
                    url:'/api/downloadpdf/:filename',
                    method: 'GET',
                    responseType : 'arraybuffer',
                    cache: false,
                    transformResponse: function (data) {
                      return {
                        response: new Blob([data], {type: 'application/pdf'})
                      };
                    }
                },
                printPdf: {
                    url: '/api/printpdf/:filename',
                    method: 'GET',
                    responseType : 'arraybuffer',
                    cache: false,
                    transformResponse: function (data) {
                      return {
                        response: new Blob([data], {type: 'application/pdf'})
                      };
                    }
                },
                getPdfByUser :{
                    url:'/api/downloadpdf/:clientId/:docType',
                    method: 'GET',
                    //isArray:false,
                    responseType : 'arraybuffer',
                    cache: false,
                    transformResponse: function (data) {
                      return {
                        response: new Blob([data], {type: 'application/pdf'})
                      };
                    }
                },
                getDocumentsByStudentId: {
                    url: '/api/document/student/:studentId',
                    method: 'GET',
                    isArray: true
                },
                removeDocument: {
                    url: '/api/document/:docId',
                    method: 'DELETE'
                },
                getDocumentHistoryByStudentId: {
                    url: '/api/document/history/:studentId/:docType',
                    method: 'GET',
                    isArray: true
                }
            }
        );
    }
    
]);