(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('saveSearchCtrl', saveSearchCtrl);

    saveSearchCtrl.$inject = [
        '$rootScope',
        '$scope',
        'AuthService',
        'searchService',
        'saveSearchService',
        'hackService'
    ];

    function saveSearchCtrl($rootScope, $scope, AuthService, searchService, saveSearchService, hackService) {
        var self = this;
        var filters = {
                coverage        : [{
                    data        : 'weekend',
                    description : 'Weekend'
                }, {
                    data        : 'nightcare',
                    description : 'Night'
                }, {
                    data        : 'halfday',
                    description : 'Half day'
                }, {
                    data        : 'fullday',
                    description : 'Full day'
                }, {
                    data        : 'schoolyearonly',
                    description : 'School year only'
                }, {
                    data        : 'infantcare',
                    description : 'Infant care'
                }],
                service         : [{
                    data        : 'dropins',
                    description : 'Drop-ins'
                }, {
                    data        : 'beforeschool',
                    description : 'Before school'
                }, {
                    data        : 'afterschool',
                    description : 'After school'
                }, {
                    data        : 'meals',
                    description : 'Meals'
                }, {
                    data        : 'transportation',
                    description : 'Transportation'
                }],
                cost            : [{
                    data        : '$',
                    description : '$'
                }, {
                    data        : '$$',
                    description : '$$'
                }, {
                    data        : '$$$',
                    description : '$$$'
                }, {
                    data        : '$$$$',
                    description : '$$$$'
                }, {
                    data        : '$$$$$',
                    description : '$$$$$'
                }],
                others          : [{
                    data        : 'faithbased',
                    description : 'Faith-based'
                }, {
                    data        : 'accredited',
                    description : 'Accredited'
                }, {
                    data        : 'headstart',
                    description : 'Early Head Start'
                }, {
                    data        : 'goldSeal',
                    description : 'State Quality Program'
                }, {
                    data        : 'vpk',
                    description : 'Voluntary Pre-K'
                }, {
                    data        : 'schoolReadiness',
                    description : 'School Readiness'
                }]
        };

        $scope.savedSearch = null;      // data req's from searches db
        $scope.unsavedSearch = null;    // data req's from searches db
        $scope.tblSavedSearch = [];     // jsonQuery converted to table
        $scope.tblUnsavedSearch = [];   // jsonQuery converted to table

        $scope.$on('open-tag-modal', function(event, args) {
            self.onLoad();
        });

        self.onLoad = function(){
            $('#tabPreviousSearch').click();
            var tst = function(){
                var user = AuthService.getUser();
                var userId = user._id;
                console.log("User: [" + userId + "] Recent criteria");

                populateRecentcriteria(userId);

                if(!$('#modalTagSearch').hasClass('in')){
                    var events;
                    $('#modalTagSearch').off('show.bs.modal').on('show.bs.modal', function(e) {
                        events = hackService.bindEscapeModalSeq(this);
                        hackService.allowSecondModalFocus();
                    })
                    .off('hide.bs.modal').on('hide.bs.modal', function(e) {
                        hackService.unbindCustomEvents(events);
                        $(document).off('focusin');
                        if($("#txtDayCareAdv").is( ":visible" )){
                            $("#txtDayCareAdv").focus();
                        } else if ($("#txtDayCare").is( ":visible" )){
                            $("#txtDayCare").focus();
                        }
                    })
                    .modal({keyboard:false});
                }
            };
            tst();


            $scope.selectedFilters = [];
            $scope.savedFilters = [{isChecked:false}];
            $scope.unsavedFilters = [{isChecked:false}];

        }
        

        function populateRecentcriteria(id){
            console.log("### Populating saved searches ###")
            if (AuthService.isAuthenticated()) {

                saveSearchService.get({userId:id},function(_res){
                    $scope.savedSearch = [];
                    $scope.unsavedSearch = [];
                    if(_res!=undefined||_res!==null){
                        _res.forEach(function(__res){
                            if(__res.is_saved){
                                $scope.savedSearch.push(__res);
                            }else{
                                $scope.unsavedSearch.push(__res);
                            }
                        });
                    }
                    //console.log("Lengths: S["+$scope.savedSearch.length + "] U[" + $scope.unsavedSearch.length+"]");
                    jsonToTable($scope.savedSearch,$scope.tblSavedSearch);
                    jsonToTable($scope.unsavedSearch,$scope.tblUnsavedSearch);
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }

                });
            }

        }

        $scope.applyQuery = function(queryId,arr,saved){
            console.log("ApplyQueryId"+queryId);
            var found = findObjInArr(arr,"id",queryId);
            if(found!=null){
                console.log(arr[found].queryJson);
                var obj = JSON.parse(arr[found].queryJson);
                if (!saved) {
                    //$scope.deleteSearch(arr[found]);
                }
                $scope.$emit('applySavedSearch', obj);
                if($('#modalTagSearch').hasClass('in')){
                    $('#modalTagSearch').modal('hide');
                }
            }
        }

        $scope.applySavedSearch = function(searchBody){
            var tmp = searchBody
            delete tmp.is_saved;
            delete tmp.searchDate;
            console.log("emittingApplySavedSearch"+JSON.stringify(tmp));
            $scope.$emit('applySavedSearch', tmp);
        }

        $scope.submitSave = function(filterObj,title){
            console.log("### UPDATING "+filterObj._id+" with "+ title +" ###")
            filterObj.is_saved = true;
            filterObj.saveTitle = title;
            saveSearchService.post(filterObj,function(_res){
                console.log(_res);
            });
        }

        $scope.deleteSearch = function(filterObj){
            console.log("### DELETING "+filterObj._id+" ###");
            saveSearchService.removeFilter({filterId:filterObj._id},function(_res){
                console.log(_res);
            })
        }

        $scope.getMax = function(arr){
            var max = null;
            if(arr.length>0){
                max = arr[0];
                arr.forEach(function(_arr){
                    var i = parseInt(_arr)
                    if( i > max ){
                        max = i
                    }
                });
            }
            return max;
        }

        $scope.getMin = function(arr){
            var min = null;
            if(arr.length>0){
                min = arr[0];
                arr.forEach(function(_arr){
                    var i = parseInt(_arr)
                    if( i < min ){
                        min = i
                    }
                });
            }
            return min;
        }

        $scope.isArrEmpty = isArrEmpty;
        $scope.isObjEmpty = isObjEmpty;
        $scope.isStrEmpty = isStrEmpty;

        function isStrEmpty(str){
            if(str == null ) return true;
            if(str.length === 0 ) return true;
            if(str.length === "") return true;
            if(str.length === '') return true;
            return false;
        }
        function isArrEmpty(arr){
            if(arr==null) return true;
            if(arr.length>0) return false;
            if(arr.length===0) return true;
            if(!Array.isArray(arr)) return true;
            return false;
        }
        function isObjEmpty(obj) {
            // Speed up calls to hasOwnProperty
            var hasOwnProperty = Object.prototype.hasOwnProperty;

            // null and undefined are "empty"
            if (obj == null) return true;

            // Assume if it has a length property with a non-zero value
            // that that property is correct.
            if (obj.length > 0)    return false;
            if (obj.length === 0)  return true;

            // If it isn't an object at this point
            // it is empty, but it can't be anything *but* empty
            // Is it empty?  Depends on your application.
            if (typeof obj !== "object") return true;

            // Otherwise, does it have any properties of its own?
            // Note that this doesn't handle
            // toString and valueOf enumeration bugs in IE < 9
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) return false;
            }

            return true;
        }

        function extractFilter(obj,key){
            var jsonObj = JSON.parse(obj.queryJson);
            //console.log("Extract ["+key+"] "+jsonObj[key]);
            return jsonObj[key];
        }
        // convert JSON Object properties to a table of properties
        function jsonToTable(arr,tblArr){
            tblArr.length = 0;

            for (var i = 0; i < arr.length; i++) {
                var data   = {
                    id       : arr[i].id,
                    saveTitle: arr[i].saveTitle.toUpperCase(),
                    keyword  : "",
                    location : "",
                    cost     : [],
                    rating   : [],
                    coverage : [],
                    service  : [],
                    others   : []
                };

                var extractKeyword = extractFilter(arr[i],"keyword");
                if(extractKeyword!=null&&extractKeyword!=""){
                    data.keyword = extractKeyword.toUpperCase();
                }

                var extractLocation = extractFilter(arr[i],"location");

                if(extractLocation!=null&&extractLocation!=""){
                    data.location = extractLocation.toUpperCase();
                }

                var extractCity = extractFilter(arr[i],"city");

                if(extractCity!=null&&extractCity!=""){
                    data.city = extractCity;
                }

                var extractZip = extractFilter(arr[i],"zip");

                if(extractZip!=null&&extractZip!=""){
                    data.zip = extractZip;
                }

                var fullAddress = extractFilter(arr[i],"fullAddress");

                if(fullAddress!=null&&fullAddress!=""){
                    data.fullAddress = fullAddress.toUpperCase();
                }

                var within = extractFilter(arr[i],"within");
                if(within!=null&&within!=""){
                    console.log("Save Search: Within " + within);
                    data.within = within;
                }

                var extractCounty = extractFilter(arr[i],"county");

                if(extractCounty!=null&&extractCounty!=""){
                    data.county = extractCounty.toUpperCase();
                }

                var extractCost = extractFilter(arr[i],"cost");
                if(extractCost!=null&&extractCost!=""){
                    data.cost = extractCost; //((arr[i].cost!=null)?arr[i].cost:[]);
                }

                var extractRating = extractFilter(arr[i],"rating");
                if(extractRating!=null&&extractRating!=""){
                    data.rating = extractRating; //((arr[i].ratings!=null)?arr[i].ratings:[]);
                }


                for(var _i = 0; _i < filters.coverage.length; _i++){
                    var propVal = extractFilter(arr[i],filters.coverage[_i].data);

                    if(propVal!=null&&propVal!=""){
                        data.coverage.push(filters.coverage[_i].description);
                    }
                }
                for(var _i = 0; _i < filters.service.length; _i++){
                    var propVal = extractFilter(arr[i],filters.service[_i].data);

                    if(propVal!=null&&propVal!=""){
                        data.service.push(filters.service[_i].description);

                    }
                }

                for(var _i = 0; _i < filters.others.length; _i++){
                    var propVal = extractFilter(arr[i],filters.others[_i].data);

                    if(propVal!=null&&propVal!=""){
                        data.others.push(filters.others[_i].description);

                    }
                }
                tblArr.push(data);
            }
            //return jsonObj[key];
        }

        $scope.saveAlert = function(queryId,inErr,inVal){
                var inputErr = false;
                var inputVal = "";

                if(typeof inErr == 'undefined' || typeof inVal == 'undefined'){
                    //console.log("Optionals");
                }else{
                    //console.log("WithOptionals : " + inErr + " , " + inVal);
                    inputErr = inErr;
                    inputVal = inVal;
                }
                

                var txt = "<p style='text-align: left;'>Name your Search</p>";
                var errTxt = "<p style='text-align: left;'>Name your Search <span class='border-error-text'><strong> \"" +inputVal+ "\" already exists. Please choose a different name.</strong></span></p>"
                var noNameErrTxt = "<p style='text-align: left;'>Name your Search <span class='border-error-text'><strong>A name is required to save your Search</strong></span></p>";
                var watchListener, elem;
                if(inputErr && inputVal!=""){
                    txt = errTxt;
                }else if(inputErr && inputVal==""){
                    txt = noNameErrTxt;
                }
                if (inputErr) {
                    $scope.inputErr = true;
                    var interval = setInterval(function() {
                        elem = $('div.sweet-alert input[type="text"]');
                        if (elem.length) {
                            clearInterval(interval);
                            var errElem = $('div.sweet-alert span.border-error-text');
                            watchListener = $scope.$watch(function() {
                                return elem.val();
                            }, function(newval) {
                                newval ? errElem.hide() : errElem.show();
                            });
                            elem.keyup(function() {
                                $scope.$digest();
                            });
                        }
                    }, 100);
                }

                swal({
                  title: "Saving Search",
                  //text: "Name your Search:",
                  text: txt,
                  html: true,
                  type: "input",
                  showCancelButton: true,
                  closeOnConfirm: false,
                  inputPlaceholder: "",
                  allowEscapeKey: false,
                  animation: false
                },
                function(inputValue){
                    if (watchListener) {
                        watchListener();
                    }
                    if (elem) {
                        elem.off('keyup');
                    }
                    if (inputValue === false) {
                        return false;
                    }

                    if (findObjInArr($scope.savedSearch, 'saveTitle', inputValue) != null) {
                        //swal.showInputError('\"' + inputValue + '\" already exists. Please choose a different name.');
                        setTimeout(function(){
                            $scope.saveAlert(queryId,true,inputValue);
                        },0);
                        
                        return false;
                    }

                    if (inputValue === "") {
                        //swal.showInputError("You should name your search.");
                        setTimeout(function(){
                            $scope.saveAlert(queryId,true,inputValue);
                        },0);
                        return false
                    }

                    var found = findObjInArr($scope.unsavedSearch,"id",queryId);
                    if(found!=null){
                        var doc = $scope.unsavedSearch[found];
                        doc.is_saved = true;
                        doc.saveTitle = inputValue;
                        saveSearchService.post(doc,function(_res){
                            if(_res!=null){
                                console.log(_res);
                                swal( { title: '\"'+inputValue+'\" Saved!',
                                        allowEscapeKey:false,
                                        type: 'success'},function(){
                                    $scope.$emit('open-modal');
                                    //$('#modalTagSearch').modal('show');

                                });
                                var user = AuthService.getUser();
                                var userId = user._id;

                                populateRecentcriteria(userId);

                                setTimeout(function () {
                                    $('#savedSearch').focus();
                                }, 5);
                            }

                        });

                    }else{
                        swal({title:" Error Saving !",allowEscapeKey:false});
                    }

                });

        };

        $scope.addOrRemoveFilter = function(filter) {
            if (filter.isChecked) {
                $scope.selectedFilters.push(filter);
            } else {
                deleteObjFromArrays('id',filter.id,[$scope.selectedFilters]);
                if (!$scope.selectedFilters.length) {
                    $scope.savedFilters[0].isChecked = false;
                    $scope.unsavedFilters[0].isChecked = false;
                }
            }
            console.log("Filter : " + JSON.stringify($scope.selectedFilters));
        };

        $scope.selectAllFilters = function(param) {
            if(param == 'unsaved'){
                if ($scope.unsavedFilters[0].isChecked  ) {
                    $scope.tblUnsavedSearch.forEach(function(filter, index) {
                        filter.isChecked = true;
                        $scope.selectedFilters.push(filter);
                    });
                } else {
                    while($scope.selectedFilters.length) {
                        $scope.selectedFilters.pop().isChecked = false;
                    }
                }
            } else {
                if ($scope.savedFilters[0].isChecked  ) {
                    $scope.tblSavedSearch.forEach(function(filter, index) {
                        filter.isChecked = true;
                        $scope.selectedFilters.push(filter);
                    });
                } else {
                    while($scope.selectedFilters.length) {
                        $scope.selectedFilters.pop().isChecked = false;
                    }
                }
            }


            console.log( "Selected Filters: " + JSON.stringify($scope.selectedFilters));

        };

        $scope.deleteSelectedFilters = function(param) {
            swal({
              title: "Confirm Deletion",
              text: "Are you sure you want to delete the selected searches?",
              type: "warning",
              showCancelButton: true,
              confirmButtonText: "Delete",
              cancelButtonText: "Cancel",
              allowEscapeKey: false
            },
            function(isConfirm){
                $scope.$apply(function($scope) {
                    while($scope.selectedFilters.length) {
                        var filter = $scope.selectedFilters.shift();
                        if (isConfirm) {
                            if(param == 'unsaved'){
                                $scope.deleteAlert(filter.id,'unsaved',true);
                            } else {
                                $scope.deleteAlert(filter.id,'saved',true);
                            }

                        } else {
                            filter.isChecked = false;
                        }
                    }
                    $scope.savedFilters[0].isChecked = false;
                    $scope.unsavedFilters[0].isChecked = false;
                });
            });
            $('div.sweet-alert').hide();
            setTimeout(function(){
                $('div.sweet-alert').show();
                hackService.scrollAnim('div.sweet-alert button.confirm');
            }, 500);
        };

        $scope.deleteAlert = function(queryId,saved,hideSwal){
            function delFilter(){
                var deleteSuccess = false;

                if(saved == 'saved'){
                    deleteSuccess = deleteObjFromArrays("id",queryId,[$scope.tblSavedSearch,$scope.savedSearch]);
                }else{
                    deleteSuccess = deleteObjFromArrays("id",queryId,[$scope.tblUnsavedSearch,$scope.unsavedSearch]);
                }

                if(deleteSuccess){
                    saveSearchService.removeFilter({filterId:queryId},function(_res){
                        if (!hideSwal) {
                            swal({title:"Gone!",type:"success",allowEscapeKey:false});
                        }
                        console.log('Filter: '+queryId+' removed from db');
                    });

                }else{
                    if (!hideSwal) {
                        swal({title:" Error Saving !",allowEscapeKey:false});
                    }
                }

            }

            if (!hideSwal) {
                swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, please.",
                closeOnConfirm: false,
                allowEscapeKey: false
                }, delFilter);
            } else {
                delFilter();
            }
        };

        function findObjInArr(arr,key,val){
            //console.log("find "+key+" in arrLen "+ arr.length);
            for (var i = 0; i < arr.length; i++) {
                var x = arr[i]
                //console.log("searching "+arr);
                if( x[key].toLowerCase() == val.toLowerCase() ){
                    return i;
                    //console.log("found in index "+i);
                    break;
                }
            }
            return null;
        }

        function deleteObjFromArrays(key,val,arr){

            var success=true;
            for (var i = 0; i < arr.length; i++) {
                //var _arr = arr[i];
                var delIndex = findObjInArr(arr[i],key,val);

                    if(delIndex!=null){
                        arr[i].splice(delIndex,1);
                    }else{
                        success=false;
                        break;
                    }
            }
            return success;
        }

    }
})();