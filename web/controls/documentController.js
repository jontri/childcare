(function() {
    'use strict';
    var module = angular.module('routerApp');
    // Base Document controller
    module.controller('documentCtrl', documentCtrl);

    documentCtrl.$inject = [
        '$q',
        '$state',
        '$stateParams',
        '$rootScope',
        '$scope',
        '$sce',
        'AuthService',
        'reviewService',
        'clientService',
        'documentService',
        'hackService'

    ];

    function documentCtrl($q,$state, $stateParams,$rootScope, $scope, $sce,AuthService,reviewService,clientService,documentService, hackService ) {
        console.log("documentCtrl");
        var self = this;

        var docsPath = 'assets/uploads/documents/';

        self.daycareList = [];
        self.daycareDocSummary = {};

        self.docList = [];
        self.pickForm = [];
        self.pickClient = [];
        self.pickClientId = [] ;
        self.docHistory = [];
        self.wizardProgress = {
            index : 0,
            isPickFormComplete:false,
            isPickClientComplete:false,
            isSendComplete: false,
            isImpossible: false
        };

        self.pdfDocument = null;
        self.hasClient = false;

        if($state.current.name == 'document_send_client'){
            loadAllClients($stateParams.pickClient);
            self.sourceId = $stateParams.sourceId;
            self.daycareId = $stateParams.daycareId;

            if ($stateParams.pickClient != undefined && $stateParams.pickClient != '') {
                self.hasClient = true;
                self.wizardProgress.index = 1;
            }

        }else if($state.current.name =='document_daycare_list'){
            loadDaycares();
        }else if($state.current.name =='document_form_summary'){
            $scope.docsToDelete = 0;
            // loadDaycareClients($stateParams.daycareId);
            // loadAllClients();
            // loadAllDaycareClients();
            loadAllClients();
        }


        // Load All client for all owned daycare
        // NOTE: Client table is a reference to Guardian and Students Table
        self.loadAllClients = loadAllClients;
        function loadAllClients(studentId){
            var user = AuthService.getUser();

            console.log(" loadAllClients Load Clients for user: "+user._id);

            // Request daycares of the provider
            
            reviewService.getMyDaycares(user._id)
                .then(
                    function (daycares) {
                        console.log("daycares: " + daycares.length );

                        // Request daycares' clients
                        angular.forEach(daycares,function(daycare){

                            var daycareId = daycare._id;
                            var daycareName = daycare.name;
                            var data = {
                                daycareId:daycareId,
                                daycareName:daycareName,
                                client:[]
                            };


                            clientService.getDaycareClient({
                                providerId: user._id,
                                daycareId: daycareId
                            },function(clients){

                                if(clients){
                                    // console.log("clients: "+clients.length);
                                    clients.$promise.then(
                                    function(_clients){

                                        // angular.forEach(_clients,function(client){
                                        //
                                        //     data.client.push(client);
                                        //
                                        // });
                                        data.clients = clients;
                                        getDocsByStudentId(data.clients)

                                        self.daycareList.push(data);

                                        if (studentId != undefined) {
                                            data.clients.forEach(function(x, y) {
                                                studentId.split(',').forEach(function(e, i) {
                                                    if (e == x.student.id) {
                                                        self.addClient(daycareId,x.student);
                                                    }
                                                });
                                            });
                                        }
                                    });

                                }else{
                                    self.wizardProgress.isImpossible = true;
                                    swal({
                                        title:'No Clients Available',
                                        text:'No Clients to send the Form',
                                        type:'warning'
                                    },function(){
                                        $state.go('document_form_list');
                                    })
                                }

                            });


                        });
                    }, 
                    function (err) {
                        console.warn(err);
                    }
                );
        }

        // function loadAllDaycareClients(){
        //     var user = AuthService.getUser();
        //
        //     console.log(" loadAllClients Load Clients for user: "+user._id);
        //
        //     // Request daycares of the provider
        //
        //     reviewService.getMyDaycares(user._id)
        //         .then(
        //             function (daycares) {
        //
        //
        //                 console.log("daycares: " + daycares.length );
        //
        //                 // Request daycares' clients
        //                 angular.forEach(daycares,function(daycare){
        //
        //                     console.log("daycare " + daycare.name);
        //                     // console.log(daycare);
        //
        //
        //                     var daycareId = daycare._id;
        //                     var daycareName = daycare.name;
        //                     var data = {
        //                         daycareId:daycareId,
        //                         daycareName:daycareName,
        //                         client:[]
        //                     };
        //
        //
        //                     self.daycareDocSummary = daycare;
        //
        //                     clientService.getDaycareClient({
        //                         providerId: user._id,
        //                         daycareId: daycareId
        //                     },function(clients){
        //
        //                         if(clients){
        //                             console.log("clients: "+clients.length);
        //
        //                             clients.$promise.then(
        //                                 function(_clients){
        //
        //                                     /*angular.forEach(_clients,function(client){
        //                                      var d = [client.student._id,
        //                                      client.guardian._id,
        //                                      client.secondaryGuardian._id];
        //                                      self.daycareDocSummary.clients.push(d);
        //                                      });*/
        //
        //                                     data.clients = clients;
        //                                     // self.daycareDocSummary.clients = clients;
        //                                     // console.log("Return");
        //                                     // console.log(self.daycareDocSummary);
        //                                     // console.log(self.daycareDocSummary.clients);
        //                                     self.daycareList.push(data);
        //                                     // getDocsByStudentId();
        //                                 });
        //
        //                         }else{
        //                             self.wizardProgress.isImpossible = true;
        //                             swal({
        //                                 title:'No Clients Available',
        //                                 text:'No Clients to send the Form',
        //                                 type:'warning'
        //                             },function(){
        //                                 $state.go('document_form_list');
        //                             })
        //                         }
        //
        //                     });
        //
        //
        //                 });
        //             },
        //             function (err) {
        //                 console.warn(err);
        //             }
        //         );
        // }


        // Load All client for on daycare
        // function loadDaycareClients(daycareId){
        //
        //     console.log("loadDaycareClients");
        //
        //     $scope.daycareId = daycareId;
        //
        //     var user = AuthService.getUser();
        //     reviewService.getDaycare(daycareId).
        //         then(
        //             function(daycare){
        //                 console.log("daycare");
        //                 console.log(daycare);
        //
        //                 if(daycareId == $stateParams.daycareId && $stateParams.daycareId){
        //                     self.daycareDocSummary = daycare;
        //                 }
        //
        //                 clientService.getDaycareClient({
        //                     providerId: user._id,
        //                     daycareId: daycareId
        //                 },function(clients){
        //
        //                     if(clients){
        //                         console.log("clients: "+clients.length);
        //                         clients.$promise.then(
        //                         function(_clients){
        //
        //                             /*angular.forEach(_clients,function(client){
        //                                 var d = [client.student._id,
        //                                 client.guardian._id,
        //                                 client.secondaryGuardian._id];
        //                                 self.daycareDocSummary.clients.push(d);
        //                             });*/
        //                             self.daycareDocSummary.clients = clients;
        //                             // console.log("Return");
        //                             // console.log(self.daycareDocSummary);
        //                             // console.log(self.daycareDocSummary.clients);
        //
        //                             getDocsByStudentId();
        //                         });
        //
        //                     }else{
        //                         self.wizardProgress.isImpossible = true;
        //                         swal({
        //                             title:'No Clients Available',
        //                             text:'No Clients to send the Form',
        //                             type:'warning'
        //                         },function(){
        //                             $state.go('document_form_list');
        //                         })
        //                     }
        //
        //                 });
        //             },function(error){
        //                 console.log("error");
        //                 console.log(error);
        //             });
        // }

        // function getDocsByStudentId() {
        //     angular.forEach(self.daycareDocSummary.clients, function(val, key) {
        //         documentService.getDocumentsByStudentId({studentId: val.student._id}, function(docs) {
        //             // console.log(docs);
        //             self.daycareDocSummary.clients[key].docs = docs;
        //         }, function(err) {
        //             console.warn(err);
        //         });
        //     });
        // }

        function getDocsByStudentId(clients) {
            angular.forEach(clients, function(val, key) {
                documentService.getDocumentsByStudentId({studentId: val.student._id}, function(docs) {
                    // console.log(docs);
                    clients[key].docs = docs;
                }, function(err) {
                    console.warn(err);
                });
            });
        }

        self.showPdf = showPdf;
        function showPdf(clientId,docType){

            var document = documentService.getPdfByUser({clientId:clientId,docType:docType});

            document.$promise.then(
                function(doc){
                    console.log(doc);
                    if(doc.status == 200 || !doc.status){
                        $scope.viewPdf = true;
                        var file = new Blob([doc.response], {type: 'application/pdf'});
                        var fileURL = URL.createObjectURL(file);
                        //var fileURL = window.URL.createObjectURL(doc.response);

                        console.log("fileURL");
                        console.log(fileURL);
                        console.log("res");
                        console.log(doc.response);
                        self.pdfDocument = $sce.trustAsResourceUrl(fileURL);
                        //self.pdfDocument = fileURL;
                    }else{
                        $scope.viewPdfNotFound = true;
                    }
                    
                },
                function(err){

                    console.log(err);
                    //$scope.viewPdfNotFound = true;

                    swal({
                        title:'File Not Found',
                        text:'File is not yet generated.',
                        type:'warning'
                    });

                })

        };

        $scope.pageLoaded = function(curPage, totalPages) {
            $scope.currentPage = curPage;
            $scope.totalPages = totalPages;
        };

        $scope.loadProgress = function(loaded, total, state) {
            console.log('loaded =', loaded, 'total =', total, 'state =', state);
        };

        function getStudent(daycareId,studentId){
            var deferred = $q.defer();
            console.log("GetStudent: "+studentId);
            clientService.getStudent({studentId: studentId},
                function(student){

                    var clientData = {
                        daycareId:daycareId,
                        student:student
                    };

                    //data.client.push(clientData);
                    deferred.resolve(clientData);
                });
            return deferred.promise;

        }

        self.loadDaycares = loadDaycares;
        function loadDaycares(){
            var user = AuthService.getUser();
            console.log("Load Daycares owned by: "+user._id);

            // Request daycares of the provider
            reviewService.getMyDaycares(user._id).then(
                function (daycare) {

                    // List of Daycare owned by provider
                    $scope.mydaycares = [];
                    
                    // Request daycares' clients
                    for(var i in daycare){
                        $scope.mydaycares.push(daycare[i]);
                        var daycareId = daycare[i]._id;
                    }

                    console.log("Daycares: "+$scope.mydaycares.length);
                },
                function(err){
                    console.log(err);
                });
        }

        self.loadDocSummary = function (daycareId){

        };

        // provider picks which form to send, add it to the pickForm array
        self.addForm = function(formType, description){

            console.log("Before addForm: "+ self.pickForm);
            var index = self.pickForm.indexOf(formType);
            if( index == -1){
                self.pickForm.push(formType);
                self.docList.push(description);
            }
            if( index != -1){
                self.pickForm.splice(index,1);
                self.docList.splice(index,1);
            }

            if(self.pickForm.length>0) {
                self.wizardProgress.isPickFormComplete = true
            } else {
                self.wizardProgress.isPickFormComplete = false
            }
            console.log("After addForm: "+ self.pickForm);
            
        }

        // provider picks which form to send, add it to the pickClient array
        self.addClient = function(daycareId,student){
            console.log("Before addClient: "+ JSON.stringify(self.pickClient));
            //var index = self.pickClient.indexOf(clientId);
            var studentId = student.id;
            var studentData = {
                studentId: student.id,
                clientId: student.clientId,
                daycareId : daycareId,
                student: student
            };
            var index = -1;

            if(self.pickClient.length>0){
                for (var i = self.pickClient.length - 1; i >= 0; i--) {
                    if(self.pickClient[i].studentId == studentId){
                        index = i; 
                        break;
                    }
                }
            }

            if( index == -1){
                self.pickClient.push(studentData);
            }
            if( index != -1){
                self.pickClient.splice(index,1);
            }

            if(self.pickClient.length>0) {
                self.wizardProgress.isPickClientComplete = true;
            }
            else{
                self.wizardProgress.isPickClientComplete = false;
            }

            console.log(self.pickClient);

            self.pickClientId = [];

            self.pickClient.forEach(function(x, y) {
                self.pickClientId.push(x.studentId);
            });
        }

        // control/restrict the flow of the wizard
        self.wizardNext = function(index,back){
            console.log("WizardNext to "+index);
            console.log(self.wizardProgress);

            var goBack = (back)?back:false;

            if(self.wizardProgress.index ==0){
                if(self.wizardProgress.isPickClientComplete){
                    $('#crumbPickForm a').tab('show');

                    // User picked form/s and client/s
                    // POST request
                    // self.sendClientForm();

                    self.wizardProgress.index = 1;
                }else{
                    swal({
                        title:"Pick at least 1 client",
                        type: 'warning'
                    });
                }


            }
            else if(self.wizardProgress.index ==1){
                if(goBack){

                    $('#crumbPickClient a').tab('show');
                    self.wizardProgress.index = 0;

                }else if (self.wizardProgress.isPickFormComplete) {
                    $('#crumbComplete a').tab('show');
                    self.wizardProgress.index = 2;
                }else{
                    swal({
                        title:"Pick at least 1 form",
                        type: 'warning'
                    });
                }

            }else if(self.wizardProgress.index=2){
                if(goBack){
                    
                    $('#crumbPickForm a').tab('show');
                    self.wizardProgress.index = 1;

                }
            }
        }

        self.toggleClientList = function(id, index) {
            if ($('#daycareBody_' + index).hasClass('hidden')){
                $('#daycareBody_' + index).removeClass('hidden');
                $('#btn-' + id).attr('value', '-');
            }
            else {
                $('#daycareBody_' + index).addClass('hidden');
                $('#btn-' + id).attr('value', '+');
            }
        }

        self.sendClientForm = function(){
            var provider = AuthService.getUser();

            console.log("Provider: " + JSON.stringify(provider));

            documentService.prepareDoc({providerId: provider._id, recipient:self.pickClient,form:self.pickForm, providerEmail:provider.email},
            function(response){
                console.log(response.data);
                
            },function(err){
                console.log(err);

            });

            if (self.sourceId == 'clients') $state.go('dashboard_client_list');
            else $state.go('document_form_summary');
        }

        self.showFiles = showFiles;
        self.onSelectDoc = onSelectDoc;
        self.deleteSelectedDocs = deleteSelectedDocs;
        self.viewDoc = viewDoc;
        self.viewDocHst = viewDocHst;
        self.openDocumentHistory = openDocumentHistory;
        self.downloadSelectedDocs = downloadSelectedDocs;
        self.printSelectedDocs = printSelectedDocs;
        self.goToEditDocPage = goToEditDocPage;
        self.toggleCheck = function(index) {

            if ($('#toggle-check-' + index).prop('checked')) {
                $('#daycareBody_' + index + ' .client-doc-file').each(function(i, e) {
                    $(e).prop('checked', false);
                    $(e).trigger('click');
                });
            }
            else {
                $('#daycareBody_' + index + ' .client-doc-file').each(function(i, e) {
                    $(e).prop('checked', true);
                    $(e).trigger('click');
                });
            }
        }

        function showFiles(client) {
            client.showFiles = !client.showFiles;
        }

        function onSelectDoc(isChecked, clientId, daycareId, student) {
            isChecked ? $scope.docsToDelete++ : $scope.docsToDelete--;

            if (isChecked && !$('.client-' + clientId).prop('checked')) {
                $('.client-' + clientId).prop('checked', true);

                self.addClient(daycareId, student);
            }
        }

        function deleteSelectedDocs() {
            swal({
                title: "Delete Documents?",
                text: "Are you sure you want to delete the selected documents?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                showLoaderOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    var tasks = [];
                    
                    iterateSelectedDocs(function(doc) {
                        tasks.push(deleteDoc(doc._id).$promise);
                    });

                    $q.all(tasks).then(function(docs) {
                        angular.forEach(docs, function(doc) {
                            deleteDocFromArr(doc._id);
                        });
                    });
                }
            });
            $('div.sweet-alert button.cancel').focus();
        }

        function iterateSelectedDocs(func) {
            angular.forEach(self.daycareList, function(daycare) {
                angular.forEach(daycare.clients, function(client) {
                    angular.forEach(client.docs, function(doc) {
                        if (doc.toBeDeleted) {
                            func(doc);
                        }
                    });
                });
            });
        }

        function deleteDoc(id) {
            var query = documentService.removeDocument({docId: id}, function(res) {
                console.log("Remove document response: " + res);
            });
            return query;
        }

        function deleteDocFromArr(id) {
            var go = true;
            angular.forEach(self.daycareDocSummary.clients, function(client, clientIdx) {
                if (!go) { return; }
                angular.forEach(client.docs, function(doc, docIdx) {
                    if (!go) { return; }
                    if (id === doc._id) {
                        self.daycareDocSummary.clients[clientIdx].docs.splice(docIdx, 1);
                        $scope.docsToDelete--;
                        go = false;
                    }
                });
            });
        }

        function openDocumentHistory(doc){
            console.log("Open Document History " + doc.studentId + " " + doc.type);

            documentService.getDocumentHistoryByStudentId({studentId:doc.studentId, docType:doc.type},function(response){

                console.log("Inside Open Document History " + doc.studentId + " " + doc.type);
                if(response){
                    self.docHistory = response;
                }

                var events;
                if(!$('#modalDocumentHistory').hasClass('in')){
                    $('#modalDocumentHistory').off('shown.bs.modal').on('shown.bs.modal', function () {
                        events = hackService.bindEscapeModalSeq(this);
                        hackService.allowSecondModalFocus();

                    })
                        .off('hidden.bs.modal').on('hidden.bs.modal', function(e) {

                        hackService.unbindCustomEvents(events);
                    })
                        .modal({
                            keyboard: false,
                            backdrop: 'static'
                        });
                }
            }, function(err){
                console.warn(err);
            });

        }



        function viewDoc(doc) {
            var existingViewPdf = $('#'+doc._id+'_view');
            var existingDownloadPdf = $('#'+doc._id+'_download');

            if (existingViewPdf.length) {
                existingViewPdf[0].click();
            } else if (existingDownloadPdf.length) {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.id = doc._id + '_view';
                a.href = existingDownloadPdf[0].href;
                a.target = '_blank';
                a.click();
            } else {
                downloadPdf(doc.pdfPath, function(data){
                    $scope.documentLoading = false;
                    console.log("$scope.documentLoading:"+$scope.documentLoading);
                    var a = document.createElement("a");
                    document.body.appendChild(a);
            
                    var fileURL = window.URL.createObjectURL(data.response);
                    a.id = doc._id + '_view';
                    a.href = fileURL;
                    a.target = '_blank';
                    a.click();
                });
            }
        }

        function viewDocHst(doc) {
            downloadPdf(doc.pdfPath, function(data){

                console.log("View older version of document");
                var a = document.createElement("a");
                document.body.appendChild(a);

                var fileURL = window.URL.createObjectURL(data.response);
                a.id = doc._id + '_view';
                a.href = fileURL;
                a.target = '_blank';
                a.click();
            });
        }

        function downloadSelectedDocs() {
            iterateSelectedDocs(function(doc) {
                var existingViewPdf = $('#'+doc._id+'_view');
                var existingDownloadPdf = $('#'+doc._id+'_download');

                if (existingDownloadPdf.length) {
                    existingDownloadPdf[0].click();
                } else if (existingViewPdf.length) {
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.id = doc._id + '_download';
                    a.href = existingViewPdf[0].href;
                    a.download = doc.pdfPath;
                    a.click();
                } else {
                    downloadPdf(doc.pdfPath, function(data){
                        $scope.documentLoading = false;
                        console.log("$scope.documentLoading:"+$scope.documentLoading);
                        var a = document.createElement("a");
                        document.body.appendChild(a);
                
                        var fileURL = window.URL.createObjectURL(data.response);
                        a.id = doc._id + '_download';
                        a.href = fileURL;
                        a.download = doc.pdfPath;
                        a.click();
                    });
                }
            });
        }

        function printSelectedDocs() {
            iterateSelectedDocs(function(doc) {
                var existingPrint = $('#'+doc._id+'_print');
                if (!existingPrint.length) {
                    printPdf(doc.pdfPath, doc._id);
                } else {
                    existingPrint[0].click();
                }
            });
        }

        function goToEditDocPage(doc) {
            switch (doc.type) {
                case 'enrollment':
                    $state.go('document_edit_enroll', {userId: doc.userId, docId: doc._id, daycareId: $scope.daycareId});
                    break;
                case 'emergencycard':
                    $state.go('document_edit_emergency', {userId: doc.userId, docId: doc._id, daycareId: $scope.daycareId});
                    break;
                case 'medauth':
                    $state.go('document_edit_medauth', {userId: doc.userId, docId: doc._id, daycareId: $scope.daycareId});
                    break;
                default:
                    break;
            }
        }

        function downloadPdf(filename, cb){
            
            var d = documentService.downloadPdf(
                {filename:filename}
            );
    
            d.$promise.then(cb);
        }

        function printPdf(filename, id){
            
            var d = documentService.printPdf(
                {filename:filename}
            );
    
            d.$promise.then(function(data){
                $scope.documentLoading = false;
                console.log("$scope.documentLoading:"+$scope.documentLoading);
                var a = document.createElement("a");
                document.body.appendChild(a);

                var fileURL = window.URL.createObjectURL(data.response);
                a.id = id + '_print';
                a.href = fileURL;
                a.target = '_blank';
                a.click();
            });
        }

        function setContentHeight(isDocumentSummary) {
            $('footer').css('bottom', '0');
            $('footer').css('position', 'fixed');
            $('footer').css('width', '100%');
    
            var docHeight = getViewport()[1];
            var footerHeight = $('footer').outerHeight();
            var navHeight = $('header').outerHeight();
    
            var newHeight = docHeight - footerHeight - navHeight;
    
            $('.content-area').css('height', newHeight + 'px');

            if (isDocumentSummary) {
                var contentHeader = $('.content-area > div:eq(0) > div:eq(0)').outerHeight();
                var actionItems = $('.content-area > div:eq(0) .action-item').outerHeight();
        
                $('.content-area > div:eq(0) > div:eq(2)').css('height', (newHeight - contentHeader - actionItems - 30) + 'px');
                $('.content-area > div:eq(0) > div:eq(2)').css('overflow-y', 'auto');
                $('.content-area > div:eq(0) > div:eq(2)').css('overflow-x', 'hidden');
            }
            else {
                var contentHeader = $('.content-area > div:eq(0)').outerHeight();
                var actionItems = $('.content-area > div:eq(1) .tab-pane .action-item').outerHeight();
        
                $('.content-area > div:eq(1) .tab-pane > div:eq(2)').css('height', (newHeight - contentHeader - actionItems - 10) + 'px');
                $('.content-area > div:eq(1) .tab-pane > div:eq(2)').css('overflow-y', 'auto');
                $('.content-area > div:eq(1) .tab-pane > div:eq(2)').css('overflow-x', 'hidden');
            }
        }

        function getViewport() {

            var viewPortWidth;
            var viewPortHeight;
    
            // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
            if (typeof window.innerWidth != 'undefined') {
            viewPortWidth = window.innerWidth,
            viewPortHeight = window.innerHeight
            }
    
            // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
            else if (typeof document.documentElement != 'undefined'
            && typeof document.documentElement.clientWidth !=
            'undefined' && document.documentElement.clientWidth != 0) {
            viewPortWidth = document.documentElement.clientWidth,
            viewPortHeight = document.documentElement.clientHeight
            }
    
            // older versions of IE
            else {
                viewPortWidth = document.getElementsByTagName('body')[0].clientWidth,
                viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
            }
    
            return [viewPortWidth, viewPortHeight];
        }

        if($state.current.name == 'document_send_client') {
            $(window).load(function() {
                setContentHeight(false);
            });
        
            $(window).resize(function() {
                setContentHeight(false);
            });
        
            setContentHeight(false);
        }
        else if($state.current.name =='document_form_summary') {
            $(window).load(function() {
                setContentHeight(true);
            });
        
            $(window).resize(function() {
                setContentHeight(true);
            });
        
            setContentHeight(true);
        }
    }

    // Enrollment Form Controller
    module.controller('enrollmentCtrl',enrollmentCtrl);

    enrollmentCtrl.$inject = [
        '$state',
        '$stateParams',
        '$scope',
        'AuthService',
        'documentService',
        'clientService',
        'StaticDataService',
        'stateService',
        'API_ENDPOINT',
        'storage',
        'docHelperService'
    ];

    function enrollmentCtrl($state,$stateParams,$scope,AuthService,documentService,clientService, StaticDataService,stateService,API_ENDPOINT,storage,docHelperService){
        console.log("enrollmentCtrl");
        console.log("Bearer "+localStorage.getItem('satellizer_token'));

        var self = this;

        var userId = $stateParams.userId;
        var docId = $stateParams.docId;

        self.daycareId = $stateParams.daycareId;
        self.user = angular.copy(AuthService.getUser());
        self.editMode = false;

        var tmpUserId = ''

        if(self.user && self.user._id){
            tmpUserId = self.user._id;
        }

        self.profileData = {
            userId : tmpUserId,
            type : 'enrollment',
            firstName:'',
            middleName:'',
            lastName:'',
            nickName:'',
            birth:null,
            birthY:null,
            birthM:null,
            birthD:null,
            gender:'',
            pobox:'',
            street:'',
            apt:'',
            zip:'',
            city:'',
            state:'',
            careHourStart:'',
            careHourEnd:'',
            careDay:[],
            careMeal:[],
            liveWith:'',
            liveWithOther:'',
            motherName:'',
            motherAddress:'',
            motherHomeNum:'',
            motherWorkNum:'',
            motherMobileNum:'',
            motherEmployer:'',
            motherEmployerAddress:'',
            fatherName:'',
            fatherAddress:'',
            fatherHomeNum:'',
            fatherWorkNum:'',
            fatherMobileNum:'',
            fatherEmployer:'',
            fatherEmployerAddress:'',
            doctor:[],
            contact:[],
            medicalPermission:false,
            note:'',
            custody:'',
            hospital:''
        };

        self.doctor = [
            {
                inputName:'doctorName0',
                inputAddress:'doctorAddress0',
                inputPhone:'doctorPhone0',
                doctorName:'',
                doctorAddress:'',
                doctorPhone:''
            }
        ];

        self.contact = [
            {
                inputName:'contactName0',
                inputAddress:'contactAddress0',
                inputHomeNum:'contactHomeNum0',
                inputWorkNum:'contactWorkNum0',
                contactName:'',
                contactAddress:'',
                contactHomeNum:'',
                contactWorkNum:'',
            }
        ];

        self.medicalData = {
            allergy : [
                {inputName: 'medInput0',name:''}
            ]
        };

        self.states = null;
        stateService.getListOfStates().then(function(response){
            self.states = response.data;
        });

        self.careTime = [];
        generateHours(6,17);
        function generateHours(startHour,totalHours){
            for (var t = 0; t <= totalHours; t+=1) {
                if((startHour+t)%12!=0){
                    self.careTime.push( {
                        text: (startHour+t>12?((startHour+t)%12)+":00 PM":(startHour+t)+":00 AM" ),
                        data: startHour+t
                    } );
                }else{
                    self.careTime.push( {
                        text: "12:00 PM",
                        data: startHour+t
                    } );
                } 
            }
        }
        self.careDay = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        self.careMeal = ['Breakfast','AM Snack','Lunch','PM Snack','Supper','Evening Snack'];

        self.datePick = {
            m : StaticDataService.getListOfMonths(),
            d : StaticDataService.getListOfDays(),
            y : StaticDataService.getListOfYears(1970)
        }

        $scope.documentLoading = false;

        onLoad();

        function onLoad(){
            if($state.current.name == 'document_edit_enroll'){
                docHelperService.goToLogIn($stateParams.email, $state.current.name, userId, docId, initialize);
            }
        }

        function initialize() {
            self.editMode = true;
            
            console.log("Edit Enrollment ("+userId+"):("+docId+")");

            documentService.getEnrollment({userId: userId, docId: docId},function(response){

                if(response.data){

                    var resData = response.data;

                    if(resData.firstName) {
                        $scope.errorLoading = false;
                        angular.copy(resData,self.profileData);
                        self.profileData.userId = resData.userId;

                        var tmpBirth = (resData.birth)? new Date(resData.birth):null;
                        console.log("tmpBirth:"+tmpBirth);
                        self.profileData.birthD = (tmpBirth)?tmpBirth.getDate():null;
                        self.profileData.birthM = (tmpBirth)?tmpBirth.getMonth():null;
                        self.profileData.birthY = (tmpBirth)?tmpBirth.getFullYear():null;

                        if(resData.doctor) addDoctor(resData.doctor);
                        if(resData.medicalData && resData.medicalData.allergy.length>0) addMedData(resData.medicalData.allergy);
                        if(resData.contact) addContact(resData.contact);

                        console.log("FormData:"+JSON.stringify(self.profileData));
                    } else {
                        console.log("Getting Client Data to prepopulate form: " +  userId);
                        clientService.getClientData({clientId: userId},
                            function (res) {
                                if (res) {

                                    var tmpBirth = null;
                                    if(res.student.birth){
                                        tmpBirth = new Date(res.student.birth);
                                    }

                                    self.profileData = {
                                        firstName: (res.student.firstName) ? res.student.firstName : null,
                                        middleName: (res.student.middleInitial) ? res.student.middleInitial : null,
                                        lastName: (res.student.lastName) ? res.student.lastName : null,
                                        gender: (res.student.gender) ? res.student.gender : null,
                                        birth: (tmpBirth) ? tmpBirth : null,
                                        birthY: (tmpBirth) ? tmpBirth.getFullYear() : null,
                                        birthM: (tmpBirth) ? tmpBirth.getMonth() : null,
                                        birthD: (tmpBirth) ? tmpBirth.getDate() : null,
                                        pobox: (res.student.mailing_address.pobox) ? res.student.mailing_address.pobox : null,
                                        street: (res.student.mailing_address.street) ? res.student.mailing_address.street : null,
                                        zip: (res.student.mailing_address.zip) ? res.student.mailing_address.zip : null,
                                        city: (res.student.mailing_address.city) ? res.student.mailing_address.city : null,
                                        state: (res.student.mailing_address.state) ? res.student.mailing_address.state : null
                                    };

                                    if(res.primaryGuardian){
                                        if(res.primaryGuardian.relationship == "father"){

                                            self.profileData.fatherName =  res.primaryGuardian.firstName + " " + res.primaryGuardian.lastName;
                                            self.profileData.fatherAddress = res.primaryGuardian.mailing_address.street + " " + res.primaryGuardian.mailing_address.city
                                                    + " " + res.primaryGuardian.mailing_address.state;
                                            self.profileData.fatherMobileNum = res.primaryGuardian.mobileNum;
                                            self.profileData.fatherHomeNum = res.primaryGuardian.contactNum;
                                            self.profileData.fatherWorkNum = res.primaryGuardian.workNum;

                                        } else {
                                            self.profileData.motherName =  res.primaryGuardian.firstName + " " + res.primaryGuardian.lastName;
                                            self.profileData.motherAddress = res.primaryGuardian.mailing_address.street + " " + res.primaryGuardian.mailing_address.city
                                                + " " + res.primaryGuardian.mailing_address.state;
                                            self.profileData.motherMobileNum = res.primaryGuardian.mobileNum;
                                            self.profileData.motherHomeNum = res.primaryGuardian.contactNum;
                                            self.profileData.motherWorkNum = res.primaryGuardian.workNum;
                                        }
                                    }
                                }
                            }
                        );
                    }







                }else{
                    console.log("DocumentNotFound");
                    $scope.errorLoading = true;
                }
                
                
            });
        }
        
        function addDoctor(data){
            if(data){
                self.doctor = [];
                for(var i in data){
                    var d = {
                        inputName:'doctorName'+self.doctor.length+1,
                        inputAddress:'doctorAddress'+self.doctor.length+1,
                        inputPhone:'doctorPhone'+self.doctor.length+1,
                        doctorName: data[i].doctorName,
                        doctorAddress: data[i].doctorAddress,
                        doctorPhone: data[i].doctorPhone
                    };
                    self.doctor.push(d);
                }
                
            }else{
                var d = {
                    inputName:'doctorName'+self.doctor.length+1,
                    inputAddress:'doctorAddress'+self.doctor.length+1,
                    inputPhone:'doctorPhone'+self.doctor.length+1,
                    doctorName:'',
                    doctorAddress:'',
                    doctorPhone:''
                };
                self.doctor.push(d);

            }
            
        }
        self.addDoctor = addDoctor;

        function removeDoctor(){
            swal({
                title: "Confirm Remove Doctor",
                text: "Your input data will permanently deleted",
                type: "warning",
                showConfirmButton: true,
                showCancelButton: true,
            },
            function(isConfirm){
                if(isConfirm){
                    setTimeout(function() {
                        $scope.$apply(
                            function(){
                                var length = self.doctor.length-1;
                                self.doctor.splice(length);
                            }
                        );
                    }, 50);
                }
            });
        }
        self.removeDoctor = removeDoctor;

        function addMedData(data){
            if(data){
                self.medicalData.allergy = [];
                for(var i in data){
                    var d = {
                        inputName:'inputName'+self.medicalData.allergy.length+1,
                        name : data[i]
                    };
                    self.medicalData.allergy.push(d);
                }

            }else{
                var d = {
                    inputName:'inputName'+self.medicalData.allergy.length+1,
                    name:'',
                };
                self.medicalData.allergy.push(d);
            }

            
        }
        self.addMedData = addMedData;

        function removeMedData(){
            swal({
                title: "Confirm Remove Info",
                text: "Your input data will permanently deleted",
                type: "warning",
                showConfirmButton: true,
                showCancelButton: true,
            },
            function(isConfirm){
                if(isConfirm){
                    setTimeout(function () {
                        $scope.$apply(
                            function(){
                                var length = self.medicalData.allergy.length-1;
                                self.medicalData.allergy.splice(length);
                            }
                        );
                    }, 50);
                }
            });
        }
        self.removeMedData = removeMedData;

        function addContact(data){
            if(data){
                self.contact = [];
                for(var i in data){
                    var c = {
                        inputName:'contactName'+self.contact.length+1,
                        inputAddress:'contactAddress'+self.contact.length+1,
                        inputHomeNum:'contactHomeNum'+self.contact.length+1,
                        inputWorkNum:'contactWorkNum'+self.contact.length+1,
                        contactName:data[i].contactName,
                        contactAddress:data[i].contactAddress,
                        contactHomeNum:data[i].contactHomeNum,
                        contactWorkNum:data[i].contactWorkNum
                    };

                    self.contact.push(c);
                }

            }else{
                var c = {
                    inputName:'contactName'+self.contact.length+1,
                    inputAddress:'contactAddress'+self.contact.length+1,
                    inputHomeNum:'contactHomeNum'+self.contact.length+1,
                    inputWorkNum:'contactWorkNum'+self.contact.length+1,
                    contactName:'',
                    contactAddress:'',
                    contactHomeNum:'',
                    contactWorkNum:'',
                };

                self.contact.push(c);

            }            
            

        }
        self.addContact = addContact;

        function removeContact(){
            swal({
                title: "Confirm Remove Contact",
                text: "Your input data will permanently deleted",
                type: "warning",
                showConfirmButton: true,
                showCancelButton: true,
            },
            function(isConfirm){
                if(isConfirm){
                    setTimeout(function () {
                        $scope.$apply(
                            function(){
                                var length = self.contact.length-1;
                                self.contact.splice(length);
                            }
                        );
                    }, 50);
                }
            });
        }
        self.removeContact = removeContact;

        function checkMeal(index){

            var arrIndex = -1;
            if(self.profileData.careMeal && self.profileData.careMeal.length >= 0){
                self.profileData.careMeal.indexOf(self.careMeal[index]);
            }else{
                self.profileData.careMeal = [];
            }

            console.log("checkMeal "+index+(arrIndex==-1?" Add":" Remove"));

            if(arrIndex==-1){
                // tick checkbox
                self.profileData.careMeal.push(self.careMeal[index])
            }

            if(arrIndex!=-1){
                // untick checkbox
                self.profileData.careMeal.splice(arrIndex,1);
            }

        }
        self.checkMeal = checkMeal;

        function checkDay(index){

            var arrIndex = -1;
            if(self.profileData.careDay && self.profileData.careDay.length >= 0){
                self.profileData.careDay.indexOf(self.careDay[index]);
            }else{
                self.profileData.careDay = [];
            }

            //console.log("checkDay "+index+(arrIndex==-1?" Add":" Remove"));

            if(arrIndex==-1){
                // tick checkbox
                self.profileData.careDay.push(self.careDay[index])
            }

            if(arrIndex!=-1){
                // untick checkbox
                self.profileData.careDay.splice(arrIndex,1);
            }
        }
        self.checkDay = checkDay;

        function verifyForm(form){
            console.log("verifyForm");
            console.log(form);
            if (form.$invalid){
                $(window).scrollTop(0);
                    swal({
                    title: "Enrollment Form Incomplete",
                    text: "Required inputs are missing",
                    type: "warning"
                })
            }else if(form.$valid){
                var y = parseInt(self.profileData.birthY);
                var m = parseInt(self.profileData.birthM);
                var d = parseInt(self.profileData.birthD);
                var date = new Date(y,m,d,0);
                self.profileData.birth = date;
                $('#confirm-submit').modal('show');
            }
        }
        self.verifyForm = verifyForm;

        function submitForm(){

            console.log("Submit Form " + $scope.daycareId);

            console.log(self.profileData);

            var payload = {};

            angular.copy(self.profileData,payload);
            
            payload.medicalData = {allergy:[]};

            if(self.contact && self.contact.length>0){
                payload.contact = [];
                for(var c in self.contact){
                    payload.contact.push({
                        contactName: self.contact[c].contactName,
                        contactAddress: self.contact[c].contactAddress,
                        contactHomeNum: self.contact[c].contactHomeNum,
                        contactWorkNum: self.contact[c].contactWorkNum,
                    });
                }
            }
            
            if(self.doctor && self.doctor.length>0){
                payload.doctor = [];
                for(var d in self.doctor){
                    payload.doctor.push({
                        doctorName: self.doctor[d].doctorName,
                        doctorAddress:self.doctor[d].doctorAddress,
                        doctorPhone:self.doctor[d].doctorAddress
                    });
                }
            }
            
            if(self.medicalData && self.medicalData.allergy && self.medicalData.allergy.length>0){
                payload.medicalData.allergy = [];
                for(var m in self.medicalData.allergy){
                    payload.medicalData.allergy.push(self.medicalData.allergy[m].name);
                }
            }
          
            
            // console.log(payload);

            if(self.editMode){
                $(window).scrollTop(0);
                $scope.documentLoading = true;
                //console.log("$scope.documentLoading:"+$scope.documentLoading);
                payload.userId = $stateParams.userId;
                payload._id = $stateParams.docId;

                documentService.updateEnrollment(payload,
                    function(res){
                        $scope.documentLoading = false;

                        swal({
                            title: "Enrollment Form Submitted",
                            text:"Click OK to go back to document list",
                            type: "success"
                        },function(){
                            $state.go('document_form_summary', {daycareId:self.daycareId });
                        });
                    },
                    function(err){
                        $(window).scrollTop(0);
                            swal({
                            title: "Server Error",
                            text: "We are having technical issues. Sorry for the inconvenience.",
                            type: "warning"
                        });
                        console.log(err);
                    }

                );
            }

            if(!self.editMode){
                $(window).scrollTop(0);

                $scope.documentLoading = true;
                console.log("$scope.documentLoading:"+$scope.documentLoading);

                documentService.saveEnrollment(payload,
                    function(res){
                        $scope.documentLoading = false;
                        swal({
                            title: "Enrollment Form Submitted",
                            text:"Click OK to go back to document list",
                            type: "success"
                        },function(){
                            $state.go('document_form_summary', {daycareId:self.daycareId });
                        });
                    },function(err){
                        $(window).scrollTop(0);
                            swal({
                            title: "Server Error",
                            text: "We are having technical issues. Sorry for the inconvenience.",
                            type: "warning"
                        });
                        console.log(err);
                    }
                );
            }           
        }
        self.submitForm = submitForm;

        function downloadPdf(filename){
            
            var d = documentService.downloadPdf(
                {filename:filename}
            );
    
            d.$promise.then(function(data){
                $scope.documentLoading = false;
                console.log("$scope.documentLoading:"+$scope.documentLoading);
                var a = document.createElement("a");
                document.body.appendChild(a);
        
                var fileURL = window.URL.createObjectURL(data.response);
                a.href = fileURL;
                a.download = filename;
                a.click();
            });
        }
    }

    // Emergency Form Controller
    module.controller('emFormCtrl',emFormCtrl);

    emFormCtrl.$inject = [
        '$state',
        '$scope',
        '$stateParams',
        'AuthService',
        'documentService',
        'clientService',
        'StaticDataService',
        'stateService',
        'docHelperService'
    ];

    function emFormCtrl($state,$scope,$stateParams,AuthService,documentService, clientService, StaticDataService,stateService,docHelperService){

        var self = this;

        var userId = $stateParams.userId;
        var docId = $stateParams.docId;
        self.daycareId = $stateParams.daycareId;


        self.user = angular.copy(AuthService.getUser());
        self.childData = {
            firstName:'',
            middleName:'',
            lastName:'',
            birth: null,
            birthY: null,
            birthM: null,
            birthD: null,
            pobox:'',
            street:'',
            zip:'',
            city:'',
            state:'',
            note: '',
            contact:[
                {
                    name:'',
                    relationship:'',
                    phoneNum:''
                },
                {
                    name:'',
                    relationship:'',
                    phoneNum:''
                }
            ]

        };
        self.motherData = {
            name:'',
            address:'',
            city:'',
            state:'',
            phoneNum:'',
            homeNum:'',
            workNum:''
        };
        self.fatherData = {
            name:'',
            address:'',
            city:'',
            state:'',
            phoneNum:'',
            homeNum:'',
            workNum:''
        };
        self.medicalData = {
            allergy:[
                {
                    inputName:'allergyName0',
                    name:'',
                }
            ],
            medication:[
                {
                    inputName:'medicationName0',
                    name:'',
                }
            ]
        };
        self.datePick = {
            m : StaticDataService.getListOfMonths(),
            d : StaticDataService.getListOfDays(),
            y : StaticDataService.getListOfYears(1970)
        };

        self.states = null;

        stateService.getListOfStates().then(function(response){
            self.states = response.data;
        });

        self.editMode = false;
        
        $scope.errorLoading = false;
        $scope.documentLoading = false;

        onLoad();

        function onLoad(){
            if($state.current.name == 'document_edit_emergency'){
                docHelperService.goToLogIn($stateParams.email, $state.current.name, userId, docId, initialize);
            }
        }

        function initialize() {
            self.editMode = true;
            
            console.log("Edit Emergency ("+userId+"):("+docId+")");

            documentService.getEmergencyCard({userId:userId,docId:docId},function(doc){

                if(doc.data){

                    if(doc.data.firstName) { // document has been filled up before
                        console.log(" DocumentFound " );
                        var docData = doc.data;
                        var tmpBirth = null;
                        if(doc.data.birth){
                            tmpBirth = new Date(doc.data.birth);
                        }

                        self.childData = {
                            firstName: (docData.firstName)?docData.firstName:null,
                            middleName: (docData.middleName)?docData.middleName:null,
                            lastName: (docData.lastName)?docData.lastName:null,
                            birth: (tmpBirth)?tmpBirth:null,
                            birthY: (tmpBirth)?tmpBirth.getFullYear():null,
                            birthM: (tmpBirth)?tmpBirth.getMonth():null,
                            birthD: (tmpBirth)?tmpBirth.getDate():null,
                            pobox: (docData.pobox)?docData.pobox:null,
                            street: (docData.street)?docData.street:null,
                            zip: (docData.zip)?docData.zip:null,
                            city: (docData.city)?docData.city:null,
                            state: (docData.state)?docData.state:null,
                            note:  (docData.note)?docData.note:null,
                            contact:[
                                {
                                    name:'',
                                    relationship:'',
                                    phoneNum:''
                                },
                                {
                                    name:'',
                                    relationship:'',
                                    phoneNum:''
                                }
                            ]
                        };

                        if(docData.contact && docData.contact.length>0){
                            self.childData.contact = [];
                            for(var i in docData.contact){
                                var c = docData.contact[i];
                                self.childData.contact.push(c);
                            }
                        }

                        self.fatherData = {
                            name: docData.fatherName,
                            address: docData.fatherAddress,
                            city: docData.fatherCity,
                            state: docData.fatherState,
                            phoneNum: docData.fatherMobileNum,
                            homeNum: docData.fatherHomeNum,
                            workNum: docData.fatherWorkNum
                        };

                        self.motherData = {
                            name: docData.motherName,
                            address: docData.motherAddress,
                            city: docData.motherCity,
                            state: docData.motherState,
                            phoneNum: docData.motherMobileNum,
                            homeNum: docData.motherHomeNum,
                            workNum: docData.motherWorkNum
                        };

                        if(docData.medicalData && docData.medicalData.allergy.length>0){
                            self.medicalData.allergy = [];

                            var docAllergy = docData.medicalData.allergy;

                            for(var i in docAllergy){

                                self.medicalData.allergy.push({
                                    inputName: 'allergyName'+self.medicalData.allergy.length,
                                    name: docAllergy[i]
                                })

                            }

                        }

                        if(doc.data.medicalData && doc.data.medicalData.medication.length>0){
                            self.medicalData.medication = [];

                            var docMedication= doc.data.medicalData.medication;

                            for(var i in docMedication){

                                self.medicalData.medication.push({
                                    inputName: 'medicationName'+self.medicalData.medication.length,
                                    name: docMedication[i]
                                })

                            }
                        }
                    } else {

                        console.log("Getting Client Data to prepopulate form: " +  userId);
                        clientService.getClientData({clientId: userId},
                            function (res) {
                                if (res) {

                                    var tmpBirth = null;
                                    if(res.student.birth){
                                        tmpBirth = new Date(res.student.birth);
                                    }

                                    self.childData = {
                                        firstName: (res.student.firstName) ? res.student.firstName : null,
                                        middleName: (res.student.middleInitial) ? res.student.middleInitial : null,
                                        lastName: (res.student.lastName) ? res.student.lastName : null,
                                        birth: (tmpBirth) ? tmpBirth : null,
                                        birthY: (tmpBirth) ? tmpBirth.getFullYear() : null,
                                        birthM: (tmpBirth) ? tmpBirth.getMonth() : null,
                                        birthD: (tmpBirth) ? tmpBirth.getDate() : null,
                                        pobox: (res.student.mailing_address.pobox) ? res.student.mailing_address.pobox : null,
                                        street: (res.student.mailing_address.street) ? res.student.mailing_address.street : null,
                                        zip: (res.student.mailing_address.zip) ? res.student.mailing_address.zip : null,
                                        city: (res.student.mailing_address.city) ? res.student.mailing_address.city : null,
                                        state: (res.student.mailing_address.state) ? res.student.mailing_address.state : null,
                                        contact:[
                                            {
                                                name:'',
                                                relationship:'',
                                                phoneNum:''
                                            },
                                            {
                                                name:'',
                                                relationship:'',
                                                phoneNum:''
                                            }
                                        ]
                                    };

                                    if(res.primaryGuardian){
                                        if(res.primaryGuardian.relationship == "father"){
                                            self.fatherData = {
                                                name: res.primaryGuardian.firstName + " " + res.primaryGuardian.lastName,
                                                address: res.primaryGuardian.mailing_address.street,
                                                city: res.primaryGuardian.mailing_address.city,
                                                state: res.primaryGuardian.mailing_address.state,
                                                phoneNum: res.primaryGuardian.mobileNum,
                                                homeNum: res.primaryGuardian.contactNum,
                                                workNum: res.primaryGuardian.workNum
                                            };
                                        } else {
                                            self.motherData = {
                                                name: res.primaryGuardian.firstName + " " + res.primaryGuardian.lastName,
                                                address: res.primaryGuardian.mailing_address.street,
                                                city: res.primaryGuardian.mailing_address.city,
                                                state: res.primaryGuardian.mailing_address.state,
                                                phoneNum: res.primaryGuardian.mobileNum,
                                                homeNum: res.primaryGuardian.contactNum,
                                                workNum: res.primaryGuardian.workNum
                                            };
                                        }
                                    }
                                }
                            }
                        );
                    }

                }else if(doc.data == null){
                    console.log("NoDocumentFound");
                    $scope.errorLoading = true;
                }

            });
        }

        function addMedInfo(type){
            var d = {
                inputName:'',
                name:''
            };
            if(type=='allergy'){
                d.inputName = 'allergyName' + self.medicalData.allergy.length+1;
                self.medicalData.allergy.push(d);

            }else if(type=='medication'){
                d.inputName = 'medicationName' + self.medicalData.medication.length+1;
                self.medicalData.medication.push(d);
            }
        }
        function removeMedInfo(type){
           
            if(type=='allergy'){
                setTimeout(function () {
                    $scope.$apply(
                        function(){
                            var length = self.medicalData.allergy.length-1;
                            self.medicalData.allergy.splice(length);
                        }
                    );
                }, 1);

            }else if(type=='medication'){
                setTimeout(function () {
                    $scope.$apply(
                        function(){
                            var length = self.medicalData.medication.length-1;
                            self.medicalData.medication.splice(length);
                        }
                    );
                }, 1);
            }
        }
        self.addMedInfo = addMedInfo;
        self.removeMedInfo = removeMedInfo;


        function addContact(){
            var c = {
                inputName:'contactName'+self.contact.length+1,
                inputAddress:'contactRelationship'+self.contact.length+1,
                inputPhoneNum:'inputPhoneNum'+self.contact.length+1,
                contactName:'',
                contactRelationship:'',
                contactPhoneNum:''
            };

            self.contact.push(c);
        }
        self.addContact = addContact;

        function removeContact(){
            swal({
                title: "Confirm Remove Contact",
                text: "Your input data will permanently deleted",
                type: "warning",
                showConfirmButton: true,
                showCancelButton: true,
            },
            function(isConfirm){
                if(isConfirm){
                    setTimeout(function () {
                        $scope.$apply(
                            function(){
                                var length = self.contact.length-1;
                                self.contact.splice(length);
                            }
                        );
                    }, 1);
                }
            });
        }
        self.removeContact = removeContact;

        function verifyForm(form){
            console.log("verifyForm");
            console.log(form);
            if (form.$invalid){
                $(window).scrollTop(0);
                    swal({
                    title: "Emergency Form Incomplete",
                    text: "Required inputs are missing",
                    type: "warning"
                })
            }else if(form.$valid){
                var y = parseInt(self.childData.birthY);
                var m = parseInt(self.childData.birthM);
                var d = parseInt(self.childData.birthD);
                var date = new Date(y,m,d,0);
                self.childData.birth = date;
                $('#confirm-submit').modal('show');
            }
            //$('#confirm-submit').modal('show');
            
        }
        self.verifyForm = verifyForm;

        function submitForm(){
            $scope.documentLoading = true;
            // console.log("submitForm");
            
            var payload = {
                type: 'emergencycard',
                firstName: self.childData.firstName,
                middleName: self.childData.middleName,
                lastName: self.childData.lastName,
                birth: self.childData.birth,
                pobox: self.childData.pobox,
                street: self.childData.street,
                zip: self.childData.zip,
                city: self.childData.city,
                state: self.childData.state,
                contact: self.childData.contact,
                motherName: self.motherData.name,
                motherAddress: self.motherData.address,
                motherCity: self.motherData.city,
                motherState: self.motherData.state,
                motherHomeNum: self.motherData.homeNum,
                motherWorkNum: self.motherData.workNum,
                motherMobileNum: self.motherData.phoneNum,
                fatherName: self.fatherData.name,
                fatherAddress: self.fatherData.address,
                fatherCity: self.fatherData.city,
                fatherState: self.fatherData.state,
                fatherHomeNum: self.fatherData.homeNum,
                fatherWorkNum: self.fatherData.workNum,
                fatherMobileNum: self.fatherData.phoneNum,
                note: self.childData.note,

                medicalData: {
                    allergy:[],
                    medication:[]
                }
            };

            

            for(var a in self.medicalData.allergy){
                payload.medicalData.allergy.push(self.medicalData.allergy[a].name);
            }
            
            for(var m in self.medicalData.medication){
                payload.medicalData.medication.push(self.medicalData.medication[m].name);
            }

            console.log("Submitting EmergencyCard");


            if(self.editMode){
                $(window).scrollTop(0);
                $scope.documentLoading = true;

                payload.userId = $stateParams.userId;
                payload._id = $stateParams.docId;
                documentService.updateEmergencyCard(payload,
                function(res){

                    $scope.documentLoading = false;
                    swal({
                        title: "Emergency Card Form Submitted",
                        text:"Click OK to go back to document list",
                        type: "success"
                    },function(){
                       $state.go('document_form_summary', {daycareId:self.daycareId });
                    });

                },function(err){
                    $(window).scrollTop(0);
                        swal({
                        title: "Server Error",
                        text: "We are having technical issues. Sorry for the inconvenience.",
                        type: "warning"
                    });
                    console.log(err);
                });
            }

            if(!self.editMode){
                $(window).scrollTop(0);
                payload.userId = self.user._id;
                documentService.saveEmergencyCard(payload,
                function(res){
                    $scope.documentLoading = false;
                    swal({
                        title: "Emergency Card Form Submitted",
                        text:"Click OK to go back to document list",
                        type: "success"
                    },function(){
                        $state.go('document_form_summary', {daycareId:self.daycareId });

                    });
                    //console.log(res);
                },function(err){
                    $(window).scrollTop(0);
                        swal({
                        title: "Server Error",
                        text: "We are having technical issues. Sorry for the inconvenience.",
                        type: "warning"
                    });
                    console.log(err);
                });
            }
            
            
        }
        self.submitForm = submitForm;

        function downloadPdf(filename){
            
            var d = documentService.downloadPdf(
                {filename:filename}
            );

            d.$promise.then(function(data){
                $scope.documentLoading = false;
                console.log("$scope.documentLoading:"+$scope.documentLoading);
                var a = document.createElement("a");
                document.body.appendChild(a);

                var fileURL = window.URL.createObjectURL(data.response);
                a.href = fileURL;
                a.download = filename;
                a.click();
            });
        }
    }

    // Emergency Form Controller
    module.controller('medAuthCtrl',medAuthCtrl);

    medAuthCtrl.$inject = [
        '$state',
        '$scope',
        '$stateParams',
        'AuthService',
        'documentService',
        'clientService',
        'StaticDataService',
        'stateService',
        'docHelperService'
    ];

    function medAuthCtrl($state,$scope,$stateParams,AuthService,documentService, clientService, StaticDataService,stateService,docHelperService){

        var self = this;

        var userId = $stateParams.userId;
        var docId = $stateParams.docId;

        self.daycareId = $stateParams.daycareId;
        self.editMode = false;

        self.user = angular.copy(AuthService.getUser());

        self.childData = {
            firstName:'',
            middleName:'',
            lastName:'',
            birth:null,
            birthY:null,
            birthM:null,
            birthD:null
        };

        self.medicalData = [
            {
                inputName:'medicationName0',
                name:null,
                inputTime:'medicationTime0',
                time:null,
                inputAmt:'medicationAmt0',
                amt:null,

                record:[]
            }
        ];
        
        self.recordInput = {
            inputRecTime:'recordTime',
            inputRecAmt:'recordAmt',
            inputRecEmp:'recordEmp',
            recTime:null,
            recAmt:null,
            recEmp:null
        };

        self.datePick = {
            m : StaticDataService.getListOfMonths(),
            d : StaticDataService.getListOfDays(),
            y : StaticDataService.getListOfYears(1970)
        };

        self.hour = [];
        generateHours(6,17);
        //console.log(self.hour);

        $scope.documentLoading = false;
        $scope.errorLoading = false;

        onLoad();

        function onLoad(){
            if($state.current.name == 'document_edit_medauth'){
                docHelperService.goToLogIn($stateParams.email, $state.current.name, userId, docId, initialize);
            }
        }

        function initialize() {
            console.log("Edit Authorization for Medication ("+userId+"):("+docId+")");

            self.editMode = true;

            documentService.getMedAuth({userId:userId,docId:docId},function(response){


                if(response.data){
                    console.log("DocFound");
                    console.log(response.data);
                    var resDoc = {};
                    angular.copy(response.data,resDoc);

                    if(resDoc.firstName){

                        var tmpBirth = null;
                        if( resDoc.birth ){
                            tmpBirth = new Date(resDoc.birth);
                        }

                        self.childData = {
                            firstName: (resDoc.firstName)?resDoc.firstName:null,
                            middleName: (resDoc.middleName)?resDoc.middleName:null,
                            lastName: (resDoc.lastName)?resDoc.lastName:null,
                            birth: (tmpBirth)?tmpBirth:null,
                            birthY: (tmpBirth)?tmpBirth.getFullYear():null,
                            birthM: (tmpBirth)?tmpBirth.getMonth():null,
                            birthD: (tmpBirth)?tmpBirth.getDate():null
                        };

                        if(resDoc.medicalData && resDoc.medicalData.medication && resDoc.medicalData.medication.length > 0){
                            self.medicalData = [];
                            addMedicalData(resDoc.medicalData.medication);
                        }


                        // console.log(self.childData);
                        if(!$scope.$$phase) {
                            $scope.$apply();
                        }

                    } else {
                        console.log("Getting Client Data to prepopulate form: " +  userId);
                        clientService.getClientData({clientId: userId},
                            function (res) {
                                if (res) {

                                    var tmpBirth = null;
                                    if(res.student.birth){
                                        tmpBirth = new Date(res.student.birth);
                                    }

                                    self.childData = {
                                        firstName: (res.student.firstName) ? res.student.firstName : null,
                                        middleName: (res.student.middleInitial) ? res.student.middleInitial : null,
                                        lastName: (res.student.lastName) ? res.student.lastName : null,
                                        birth: (tmpBirth) ? tmpBirth : null,
                                        birthY: (tmpBirth) ? tmpBirth.getFullYear() : null,
                                        birthM: (tmpBirth) ? tmpBirth.getMonth() : null,
                                        birthD: (tmpBirth) ? tmpBirth.getDate() : null
                                    };
                                }
                            }
                        );
                    }

                } else if( response.data = null){
                    console.log("NoDocumentFound");
                    $scope.errorLoading = true;
                }

            });
        }
        

        // Write all functions after this line for proper $scope variables initialization

        function generateHours(startHour,totalHours){
            for (var t = 0; t <= totalHours; t+=1) {
                if((startHour+t)%12!=0){
                    self.hour.push( {
                        text: (startHour+t>12?((startHour+t)%12)+":00 PM":(startHour+t)+":00 AM" ),
                        data: startHour+t
                    } );
                }else{
                    self.hour.push( {
                        text: "12:00 PM",
                        data: startHour+t
                    } );
                } 
            }
        }

        function addMedicalData(data){
            if(data && data.length>0){
                for(var i in data){
                    var d = {
                        inputName:'medicationName',
                        inputTime:'medicationTime',
                        inputAmt:'medicationAmt',
                        name: data[i].name,
                        time: data[i].time,
                        amt: data[i].amount,
                        record: []                        
                    };
                    
                    angular.copy(data[i].record, d.record);

                    var increment = self.medicalData.length+1;

                    d.inputName += increment;
                    d.inputTime += increment;
                    d.inputAmt += increment;

                    self.medicalData.push(d);
                }

            }

            if(!data){

                var d = {
                    inputName:'medicationName',
                    name:null,
                    inputTime:'medicationTime',
                    time:null,
                    inputAmt:'medicationAmt',
                    amt:null,
                    record:[]
                };

                var increment = self.medicalData.length+1;

                d.inputName += increment;
                d.inputTime += increment;
                d.inputAmt += increment;

                self.medicalData.push(d);

            }
            
        }

        function removeMedicalData(index){
            setTimeout(function () {
                $scope.$apply(
                    function(){
                        //var length = self.medicalData.length-1;
                        self.medicalData.splice(index,1);
                    }
                );
            }, 1);
        }
        self.addMedicalData = addMedicalData;
        self.removeMedicalData = removeMedicalData;

        function addMedicalRecord(index){
            // add record to record array in self.medicalData
            if(self.recordInput.recTime && self.recordInput.recAmt && self.recordInput.recEmp){
                var record = {
                    time: self.recordInput.recTime,
                    amount: self.recordInput.recAmt,
                    employee: self.recordInput.recEmp
                };
                self.medicalData[index].record.push(record);

                self.recordInput = {
                    recTime: null,
                    recAmt: null,
                    recEmp: null
                };
            }
           
        }

        function removeMedicalRecord(dataIndex,index){
            console.log("Delete: "+dataIndex+" : "+index);
            setTimeout(function () {
                $scope.$apply(
                    function(){
                        //var length = self.medicalData[index].record.length-1;
                        self.medicalData[dataIndex].record.splice(index,1);
                    }
                );
            }, 1);
        }
        self.addMedicalRecord = addMedicalRecord;
        self.removeMedicalRecord = removeMedicalRecord;  

        function verifyForm(form){
            console.log("verifyForm");
            console.log(form);
            if (form.$invalid){
                $(window).scrollTop(0);
                    swal({
                    title: "Emergency Form Incomplete",
                    text: "Required inputs are missing",
                    type: "warning"
                })
            }else if(form.$valid){
                var y = parseInt(self.childData.birthY);
                var m = parseInt(self.childData.birthM);
                var d = parseInt(self.childData.birthD);
                var date = new Date(y,m,d,0);
                self.childData.birth = date;
                $('#confirm-submit').modal('show');
            }
            //$('#confirm-submit').modal('show');
            
        }
        self.verifyForm = verifyForm;

        function submitForm(){
            console.log("submitForm");

            var payload = {
                type: 'medauth',
                userId: self.user._id,
                firstName: self.childData.firstName,
                middleName: self.childData.middleName,
                lastName: self.childData.lastName,
                birth: self.childData.birth,
                medicalData: {
                    medication:[]
                }
            };

            for(var med in self.medicalData){
                var data = {
                    name : self.medicalData[med].name,
                    time : self.medicalData[med].time,
                    amount : self.medicalData[med].amt,
                    record : []
                }

                for(var rec in self.medicalData[med].record){
                    var recData = {
                        employee : self.medicalData[med].record[rec].employee,
                        amount: self.medicalData[med].record[rec].amount,
                        time: self.medicalData[med].record[rec].time
                    };
                    data.record.push(recData);
                }

                payload.medicalData.medication.push(data);
            }

            console.log("Submitting MedAuth");
            console.log(payload);
            
            // TODO: update request
            if(self.editMode){
                $(window).scrollTop(0);
                $scope.documentLoading = true;
                payload.userId = $stateParams.userId;
                payload._id = $stateParams.docId;
                
                documentService.updateMedAuth(payload,
                function(res){
                    $scope.documentLoading = false;
                    swal({
                        title: "Authorization for Medication Form Submitted",
                        text:"Click OK to go back to document list",
                        type: "success"
                    },function(){
                        $state.go('document_form_summary', {daycareId:self.daycareId });
                    });
                    console.log(res);
                },function(err){
                    
                    swal({
                        title: "Server Error",
                        text: "We are having technical issues. Sorry for the inconvenience.",
                        type: "warning"
                    });
                    console.log(err);

                });
            }

            if(!self.editMode){
                $(window).scrollTop(0);
                $scope.documentLoading = true;

                documentService.saveMedAuth(payload,
                function(res){
                    $scope.documentLoading = false;
                    swal({
                        title: "Authorization for Medication Form Submitted",
                        text:"Click OK to go back to document list",
                        type: "success"
                    },function(){
                        $state.go('document_form_summary', {daycareId:self.daycareId });
                    });
                    console.log(res);
                },function(err){
                    $(window).scrollTop(0);
                        swal({
                        title: "Server Error",
                        text: "We are having technical issues. Sorry for the inconvenience.",
                        type: "warning"
                    });
                    console.log(err);
                });

            }
            
        }
        self.submitForm = submitForm;

        function downloadPdf(filename){
            
            var d = documentService.downloadPdf(
                {filename:filename}
            );

            d.$promise.then(function(data){
                $scope.documentLoading = false;
                console.log("$scope.documentLoading:"+$scope.documentLoading);
                var a = document.createElement("a");
                document.body.appendChild(a);

                var fileURL = window.URL.createObjectURL(data.response);
                a.href = fileURL;
                a.download = filename;
                a.click();
            });
        }
    }


    // shared functions local to this closure



})();