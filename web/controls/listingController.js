'use strict';
var listingController = angular.module('listingController', ['nvd3']);

listingController.controller('listingCtrl', ['$scope', '$cookies', '$filter', '$q', '$sce', '$timeout', 'listingService', 'reviewService', '$state', '$stateParams', 'AuthService', 'ownershipService', 'API_ENDPOINT', 'notAvailableFilter', 'phoneFormatterFilter', 'dateFormatterFilter',
    'addressFormatterFilter', 'hoursOfOpFilter', 'capitalizeFilter', 'yesNoFilter', 'dateToMilliFilter', 'linebreakToBrTagFilter', 'COMMON', 'jsPDFService', 'hackService', 'stateService', 'accreditationService', 'curriculumService', 'imageService', 'Upload',
    function ($scope, $cookies, $filter, $q, $sce, $timeout, listingService, reviewService, $state, $stateParams, AuthService, ownershipService, API_ENDPOINT, notAvailableFilter, phoneFormatterFilter, dateFormatterFilter,
              addressFormatterFilter, hoursOfOpFilter, capitalizeFilter, yesNoFilter, dateToMilliFilter, linebreakToBrTagFilter, COMMON, jsPDFService, hackService, stateService, accreditationService, curriculumService, imageService, Upload) {
        var self = this;
        var state = $state.current.name;

        var ownerBtn = $('#ownership-btn'),
            ownerBtnIcon = ownerBtn.find('i');

        self.user = angular.copy(AuthService.getUser());
        self.downloadPdf = downloadPdf;
        self.requestOwnership = requestOwnership;
        self.ownerBtnDisplay = 'Loading';
        self.isProvider = false;
        self.isAdmin = false;
        self.isParent = false;
        self.disableOwnerBtn = true;
        self.ratings = [];
        self.isReviewsLoaded = false;
        self.getReviewsByUser = getReviewsByUser;
        self.userHasReview = userHasReview;
        self.reviews = {};

        /*Generate Chart Values*/
        var minRevDisplay = 10;

        self.ratingGroup = {};
        $scope.overAllData = [];
        $scope.safetyData = [];
        $scope.facilitiesData = [];
        $scope.staffData = [];
        $scope.educationData = [];
        $scope.filteredReviews = [];
        $scope.pickedAttrib = "overall";

        $scope.emailRegex = AuthService.emailRegex;

        $scope.user = self.user;
        // console.log($scope.user);
        $scope.reviewTagsNumber;


        onLoad();
        function onLoad() {

            if (state == 'listingDetail') {

                setTimeout(function () {
                    $('#aboutTabLink').focus();
                }, 5);

            }

            if (state === 'listingDetail' || state === 'manageDaycare') {
                $scope.stateList = stateService.getListOfStates().then(
                    function (response) {
                        $scope.stateList = ['State'].concat(Object.keys(response.data));
                    },
                    function (err) {
                        console.log(err);
                    }
                );

                getListingDetail($stateParams.listingId);


            }

            if (state === 'manageDaycare') {
                $scope.floaterInit = {initTop: 190, topOffset: 89};
                $scope.rightOffset = 15;
                $scope.headerHeight = 126;

                // Look up for form objects.
                $scope.formHash = {};

                $scope.progress = {
                    formIndex: 1
                };

                // Logo upload options and restrictions.
                $scope.filePattern = 'image/*,.pdf';
                $scope.maxFileSize = '50MB';
                $scope.modelOptions = {updateOn:'change'};

                // Stores previously selected hours.
                $scope.openHoursHash = {};
                $scope.closeHoursHash = {};
            }

            if (state === 'downloadListingPdf') {
                getListingDetail($stateParams.listingId);
            }

            if (self.user) {

                self.userHasReview($stateParams.listingId);

                if (self.isProvider = AuthService.isProvider()) {
                    getOwnershipStatus($stateParams.listingId, self.user.id);
                }

                self.isParent = AuthService.isParent();
                self.isAdmin = AuthService.isAdmin();
                self.isAuthenticated = AuthService.isAuthenticated();
                //console.log(self.isAuthenticated);
            }

            focusToReviews(); // focus to review panel if url is from Write review

            self.COMMON = $scope.COMMON = COMMON;

        }

        function getListingDetail(id) {

            listingService.get({listingId: id}, function (response) {
                self.listing = response.listing;
                $scope.listing = response.listing;

                // console.log("Listing ID - " + id + " - " + JSON.stringify($scope.listing));

                // skip data manipulation on manage daycare state
                if (state !== 'manageDaycare') {
                    if (self.listing.dateFounded) {
                        self.listing.dateFounded = $filter('date')(self.listing.dateFounded, 'MM/dd/yyyy', '+0');
                    }
                    if (self.listing.license && self.listing.license.endDate) {
                        self.listing.license.endDate = $filter('date')(self.listing.license.endDate, 'MM/dd/yyyy', '+0');
                    }
                    // this is the list of ratings
                    if (self.ratings.length == 0) {
                        self.ratings.push({label: 'Safety', rating: self.listing.avgSafetyRatings});
                        self.ratings.push({label: 'Facilities', rating: self.listing.avgFacilitiesRatings});
                        self.ratings.push({label: 'Staff', rating: self.listing.avgStaffRatings});
                        self.ratings.push({label: 'Education', rating: self.listing.avgEducationRatings});
                        self.ratings.push({label: 'Overall', rating: self.listing.avgOverAllRatings});
                    }

                    if (response.listing) {
                        $scope.replies = {};
                        $scope.currRevHash = {};

                        reviewService.getReviews($stateParams.listingId, self.user ? self.user._id : null)
                            .then(function (reviews) {
                                self.reviews = reviews;
                                self.isReviewsLoaded = true;
                                console.log("Total Approved Reviews: " + reviews.length);
                                groupRatings(self.reviews);
                                self.reviews.forEach(function(rev){
                                    rev.dateOrder = new Date(dateToMilliFilter(rev.dateSaved)).getTime();
                                    //tagCounter(rev);
                                });
                                if(typeof(dataFilter) !=='undefined' && typeof(keywordFilter)  !=='undefined'){
                                    // console.log("Filtering Reviews");
                                    filterReview(dataFilter, keywordFilter);
                                }else{
                                    // console.log("Do Not Filter Reviews but Update Tags");
                                    filterReview(null,null);
                                }
                                $scope.filteredReviews.forEach(function(rev){
                                    $scope.currRevHash[rev._id] = rev;
                                    initReplies(rev);
                                });
                            }, function (err) {
                                console.warn(err);
                            });
                    }

                    $scope.listing.director = notAvailableFilter($scope.listing.director);
                    $scope.listing.formattedAddress = addressFormatterFilter($scope.listing.address, $scope.listing.displayAddress);
                    $scope.listing.phone = phoneFormatterFilter(notAvailableFilter($scope.listing.phone));
                    $scope.listing.fax = phoneFormatterFilter(notAvailableFilter($scope.listing.fax));
                    $scope.listing.email = notAvailableFilter($scope.listing.email);
                    $scope.listing.website = notAvailableFilter($scope.listing.website);
                    $scope.listing.description = linebreakToBrTagFilter(notAvailableFilter($scope.listing.description));
                    // $scope.listing.description = linebreakToBrTagFilter(notAvailableFilter("Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo "));
                    $scope.listing.program = notAvailableFilter($scope.listing.program);
                    $scope.listing.dateFounded = notAvailableFilter($scope.listing.dateFounded);
                    $scope.listing.capacity = notAvailableFilter($scope.listing.capacity);
                    $scope.listing.uid = notAvailableFilter($scope.listing.uid);
                    $scope.listing.license = notAvailableFilter($scope.listing.license);
                    if (!angular.isString($scope.listing.license)) {
                        $scope.listing.license.endDate = dateFormatterFilter(notAvailableFilter($scope.listing.license.endDate));
                    }
                    $scope.listing.formattedHours = notAvailableFilter(hoursOfOpFilter({
                        openHours: $scope.listing.openHours,
                        closeHours: $scope.listing.closeHours
                    }));

                    $scope.listing.formattedAccreditations = yesNoFilter($scope.listing.accreditations);
                    if ($scope.listing.formattedAccreditations === COMMON.yes) {
                        var length = $scope.listing.accreditations.length;
                        $scope.listing.accreditations.sort(function(a, b) {
                            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                        });
                        $scope.listing.accreditations.forEach(function(val, index) {
                            $scope.listing.formattedAccreditations += ((index === 0 ? ' (' : ', ') + val.name + (index === length-1 ? ')' : ''));
                        });
                    } else if (($scope.listing.formattedAccreditations = yesNoFilter($scope.listing.accredited)) === COMMON.yes) {
                        $scope.listing.formattedAccreditations += (' (' + $scope.listing.accrediting_agency + ')');
                    }
                    $scope.listing.formattedGoldSeal = yesNoFilter($scope.listing.goldSeal);
                    // if ($scope.listing.formattedGoldSeal === COMMON.yes) {
                    //     var agency = $scope.listing.goldSealAccreditation.agency;
                    //     $scope.listing.formattedGoldSeal += (agency ? ('(' + agency + ')') : '');
                    // }
                    $scope.listing.formattedCurriculum = notAvailableFilter($scope.listing.curriculum);
                    if ($scope.listing.formattedCurriculum !== COMMON.notAvailable) {
                        $scope.listing.formattedCurriculum = '';
                        $scope.listing.curriculum.forEach(function(val, index) {
                            $scope.listing.formattedCurriculum += ((index === 0 ? '' : ', ') + val.description);
                        });
                    }


                }

                if (state === 'manageDaycare') {
                    if (!$scope.listing.accreditations)
                        $scope.listing.accreditations = [];
                    if (!$scope.listing.accreditations.length)
                        $scope.listing.accreditations.push({});
                    if ($scope.listing.curriculum.length && typeof $scope.listing.curriculum[0] === 'string') {
                        // if curriculum array are strings then convert to object
                        $scope.listing.curriculum.forEach(function(curriculum, index) {
                            $scope.listing.curriculum[index] = {description: curriculum};
                        });
                    }
                    $scope.listing.logo = (
                        $scope.listing.logo ? 'assets/uploads/'+$scope.listing.logo : 'assets/theme/images/company-logo/1.jpg'
                    );
                    imageService.srcToBase64($scope.listing.logo).then(function(b64) {
                        $scope.logoToCrop = b64;
                    });

                    self.listingGoldSealAccred = {
                        name: '',
                        goldSeal: true
                    };

                    accreditationService.query({goldSeal: false}, function(accreds) {
                        $scope.accreditations = accreds.concat([{name: 'Other'}]);

                        self.listingGoldSealAccred = $scope.listing.accreditations.find(function(accred) {
                            return accred.goldSeal === true || accred.goldSeal === 'true';
                        });
                        !self.listingGoldSealAccred && (
                            $scope.listing.accreditations.concat(self.listingGoldSealAccred = {name: '', goldSeal: true})
                        );
                        self.listingAccreds = $scope.listing.accreditations.filter(function(accred) {
                            return accred.goldSeal === undefined || accred.goldSeal === false || accred.goldSeal === 'false';
                        });

                        var otherIndex;
                        self.listingAccreds.forEach(function(listingAccred, listingIndex) {
                            if (otherIndex === undefined) {
                                if ($scope.accreditations.findIndex(function(accred) {
                                        return (accred.name === listingAccred.name && (accred.goldSeal === false || accred.goldSeal === 'false'));
                                    }) === -1 && listingAccred.name) {
                                    otherIndex = listingIndex;
                                }
                            }
                        });
                        if (otherIndex !== undefined) {
                            self.otherAccred = self.listingAccreds[otherIndex].name;
                            self.listingAccreds[otherIndex].name = 'Other';
                        }
                    });

                    $scope.curriculums = curriculumService.query(function() {
                        var otherIndex = $scope.listing.curriculum.findIndex(function(listingCurriculum) {
                            return $scope.curriculums.findIndex(function(curriculum) {
                                return curriculum.description === listingCurriculum.description;
                            }) === -1;
                        });
                        if (otherIndex !== -1) {
                            self.otherCurriculum = $scope.listing.curriculum[otherIndex].description;
                            $scope.listing.curriculum[otherIndex].description = 'Other';
                        }
                        $scope.curriculums.push({description: ''}, {description: 'Other'});
                    });

                    $scope.$watch('listing.curriculum', function(newval) {
                        if (newval && newval.length) {
                            // clear out curriculums if user selects empty option
                            var emptyCurriculum = $scope.listing.curriculum.filter(function(curriculum) {
                                return curriculum.description === '';
                            });
                            if (emptyCurriculum.length) {
                                $scope.listing.curriculum = emptyCurriculum;
                            }
                        }
                    }, true);

                    if($scope.listing.operatingHours == null || $scope.listing.operatingHours.length == 0){
                        console.log("Empty operating hours - adding default " );
                        $scope.listing.operatingHours =  [
                            {
                                "day" : "monday",
                                "closed" : false,
                                "sched" : [
                                    {
                                        "open" : "1:00 AM",
                                        "close" : "1:00 AM"
                                    }
                                ]
                            },
                            {
                                "day" : "tuesday",
                                "closed" : false,
                                "sched" : [
                                    {
                                        "open" : "1:00 AM",
                                        "close" : "1:00 AM"
                                    }
                                ]
                            },
                            {
                                "day" : "wednesday",
                                "closed" : false,
                                "sched" : [
                                    {
                                        "open" : "1:00 AM",
                                        "close" : "1:00 AM"
                                    }
                                ]
                            },
                            {
                                "day" : "thursday",
                                "closed" : false,
                                "sched" : [
                                    {
                                        "open" : "1:00 AM",
                                        "close" : "1:00 AM"
                                    }
                                ]
                            },
                            {
                                "day" : "friday",
                                "closed" : false,
                                "sched" : [
                                    {
                                        "open" : "1:00 AM",
                                        "close" : "1:00 AM"
                                    }
                                ]
                            },
                            {
                                "day" : "saturday",
                                "closed" : false,
                                "sched" : [
                                    {
                                        "open" : "1:00 AM",
                                        "close" : "1:00 AM"
                                    }
                                ]
                            },
                            {
                                "day" : "sunday",
                                "closed" : false,
                                "sched" : [
                                    {
                                        "open" : "1:00 AM",
                                        "close" : "1:00 AM"
                                    }
                                ]
                            }
                        ]
                    } else {


                        console.log("Listing operating hours is not empty or null");
                        console.log(JSON.stringify($scope.listing.operatingHours));
                    }
                }
            });

        }

        function initReplies(rev) {
            if (rev) {
                $scope.replies[rev._id] = {};
                $scope.replies[rev._id].params = {limit: 10, sortBy: '_id', sortOrder: -1};
                getReplies(rev._id, $scope.replies[rev._id].params, function(response) {
                    $scope.replies[rev._id].replies = response.data;
                    $scope.replies[rev._id].show_replies = false;
                    $scope.replies[rev._id].params.skip = response.data.length;
                });
                initReplies(rev.oldReview);
            }
        }

        function getReplies(reviewId, params, callback) {
            reviewService.getReplies(reviewId, params)
                .then(callback, function(err) {
                    console.warn(err);
                });
        }

        $scope.getOldReplies = function(reviewId) {
            $scope.replies[reviewId].old_replies_is_loading = true;
            getReplies(reviewId, $scope.replies[reviewId].params, function(response) {
                if (response.data.length) {
                    $scope.replies[reviewId].replies = $scope.replies[reviewId].replies.concat(response.data);
                    $scope.replies[reviewId].params.skip += response.data.length;
                } else {
                    $scope.replies[reviewId].no_more_replies = true;
                }
                $scope.replies[reviewId].old_replies_is_loading = false;
            });
        };

        function downloadPdf() {
            // alert("Download PDF")
            // console.log(self.listing._id);
            // var path = API_ENDPOINT + '/download-listing?listingId=' + self.listing._id;
            // window.location.href = path;

            var doc = jsPDFService.newDoc();

            doc.text(self.listing.name, { size: doc.LARGE, style: doc.BOLD })
                .newLine(doc.SMALL).horizontalLine().newLine(doc.LARGE);

            console.log("State Location: "  + self.listing.address.state);
            var state = self.listing.address.state;
            var qualSuffix = "";
            if(state == "NJ"){
                qualSuffix =  " (Grow NJ Kids)";
            } else if(state == "VA"){
                qualSuffix =" (Virginia Quality)";
            } else if(state == "NY"){
                qualSuffix =  " (QUALITYstarsNY)";
            } else if(state == "FL"){
                qualSuffix = " (Gold Seal)";
            }

            var about = {
                director: COMMON.leadAdmin,
                formattedAddress: COMMON.address,
                phone: COMMON.phone,
                fax: COMMON.fax,
                email: COMMON.email,
                website: COMMON.website,
                description: COMMON.description,
                program: COMMON.facilityType,
                dateFounded: COMMON.facilityOpened,
                capacity: COMMON.capacity,
                formattedHours: COMMON.hoursOfOp,
                uid: COMMON.licenseNum,
                'license|endDate': COMMON.licenseExp,
                formattedAccreditations: COMMON.accredited,
                formattedGoldSeal: COMMON.goldSeal + qualSuffix ,
                formattedCurriculum: COMMON.curriculum
            };

            console.log(about);

            Object.keys(about).forEach(function(key) {
                if (key === 'formattedHours' && !angular.isString($scope.listing[key])) {
                    var columns = [''].concat(COMMON.shortDays.map(function(val) {
                        return capitalizeFilter(val);
                    }));
                    var rows = [['Open'],['Close']].map(function(val, idx) {
                        var hoursKey = (idx === 0 ? 'openHours' : 'closeHours');
                        COMMON.longDays.forEach(function(day) {
                            val.push($scope.listing[key][hoursKey][day]);
                        });
                        return val;
                    });

                    doc.text(about[key]+':', {style:doc.BOLD,indentSize:doc.NORMAL}).newLine(doc.SMALL)
                        .createTable(columns, rows, {indentSize:doc.NORMAL})
                        .newLine();
                } else if (key === 'description'){
                    var val = extractVal($scope.listing, key.split(COMMON.delimeter));
                    console.log("Val Data for Description: " + val);
                    var lines = wordwrap(val.toString().substring(0,800), 50);

                    //loop thru each line and output while increasing the vertical space
                    for(var c = 0; c < lines.length ; c++){

                        console.log("Line " + c + ":" + lines[c]);

                        if(c==0){
                            if( c== (lines.length - 1)){
                                doc.columns([{ text:about[key]+':',writeOpts:{style:doc.BOLD,indentSize:doc.NORMAL} }, { text:lines[c],writeOpts:{color:doc.GRAY,xOffset:-50}}])
                                    .newLine();
                            } else {
                                doc.columns([{ text:about[key]+':',writeOpts:{style:doc.BOLD,indentSize:doc.NORMAL} }, { text:lines[c],writeOpts:{color:doc.GRAY,xOffset:-50}}])
                                    .newLine(doc.SMALL);
                            }

                        } else if( c== (lines.length - 1)){
                            doc.columns([{ text:'',writeOpts:{style:doc.BOLD,indentSize:doc.NORMAL} }, { text:lines[c],writeOpts:{color:doc.GRAY,xOffset:-40}}])
                                .newLine();
                        } else {
                            doc.columns([{ text:'',writeOpts:{style:doc.BOLD,indentSize:doc.NORMAL} }, { text:lines[c],writeOpts:{color:doc.GRAY,xOffset:-50}}])
                                .newLine(doc.SMALL);
                        }
                    }

                } else if (key === 'formattedGoldSeal' || key === 'formattedAccreditations' || key === '' || key === 'formattedCurriculum'
                    || key === 'uid' || key === 'license|endDate') {
                    var val = extractVal($scope.listing, key.split(COMMON.delimeter));
                    doc.columns([{ text:about[key]+':',writeOpts:{style:doc.BOLD,indentSize:doc.NORMAL} }, { text:val,writeOpts:{color:doc.GRAY,xOffset:-30}}])
                        .newLine();
                } else  {
                    var val = extractVal($scope.listing, key.split(COMMON.delimeter));
                    doc.columns([{ text:about[key]+':',writeOpts:{style:doc.BOLD,indentSize:doc.NORMAL} }, { text:val,writeOpts:{color:doc.GRAY,xOffset:-50}}])
                        .newLine();
                }
            });

            doc.save(self.listing.name+'.pdf');

            function extractVal(obj, keys) {
                if (angular.isDefined(obj) && !angular.isString(obj) && keys.length) {
                    return extractVal(obj[keys.shift()], keys);
                }

                return obj;
            }
        }

        self.downloadPdfApplications = function (pdfType) {
            if (pdfType == "emergencycard") {
                var path = API_ENDPOINT + '/downloadpdf/emergencycard';
                window.location.href = path;
            }
            else if (pdfType == "AccidentIncidentreport") {
                var path = API_ENDPOINT + '/downloadpdf/AccidentIncidentreport';
                window.location.href = path;
            }
            else if (pdfType == "ApplicationforEnrollment") {
                var path = API_ENDPOINT + '/downloadpdf/ApplicationforEnrollment';
                window.location.href = path;
            }
            else if (pdfType == "AuthorizationForMedication") {
                var path = API_ENDPOINT + '/downloadpdf/AuthorizationForMedication';
                window.location.href = path;
            }
            else if (pdfType == "FreeandReducedPriceMeal") {
                var path = API_ENDPOINT + '/downloadpdf/FreeandReducedPriceMeal';
                window.location.href = path;
            }
            else if (pdfType == "Infantfeeding") {
                var path = API_ENDPOINT + '/downloadpdf/Infantfeeding';
                window.location.href = path;
            }
            else if (pdfType == "MedicalStatementandDietaryConditions") {
                var path = API_ENDPOINT + '/downloadpdf/MedicalStatementandDietaryConditions';
                window.location.href = path;
            }
        }
        self.submitDocument = function () {
            console.log("Uploading");
        }
        function getOwnershipStatus(listingId, userId) {
            //console.log(listingId);
            ownershipService.getRequest({userId: userId, listingId: listingId}, function (ownerRequest) {
                console.log(ownerRequest);
                self.ownerRequest = ownerRequest;
                ownerBtnIcon.removeClass('fa-spinner fa-spin');

                switch (ownerRequest.status) {
                    case 'pending':
                        self.ownerBtnDisplay = 'Cancel Request';
                        self.disableOwnerBtn = false;
                        break;
                    case 'approved':
                        self.ownerBtnDisplay = 'You Own This Daycare';
                        ownerBtn.addClass('full-opacity');
                        ownerBtnIcon.addClass('fa-check');
                        break;
                    default:
                        self.ownerBtnDisplay = 'Request Ownership';
                        self.disableOwnerBtn = false;
                        ownerBtnIcon.addClass('hide');
                        break;
                }
            });
        }

        function getReviewsByUser(userId) {

        };

        function wordwrap(long_string, max_char){

            var sum_length_of_words = function(word_array){
                var out = 0;
                if (word_array.length!=0){
                    for (var i=0; i<word_array.length; i++){
                        var word = word_array[i];
                        out = out + word.length;
                    }
                };
                return out;
            };


            var chunkString = function (str, length){
                return str.match(new RegExp('.{1,' + length + '}', 'g'));
            };

            var splitLongWord = function (word, maxChar){
                var out = [];
                if( maxChar >= 1){
                    var wordArray = chunkString(word, maxChar-1);// just one under maxChar in order to add the innerword separator '-'
                    if(wordArray.length >= 1){
                        // Add every piece of word but the last, concatenated with '-' at the end
                        for(var i=0; i<(wordArray.length-1); i++){
                            var piece = wordArray[i] + "-";
                            out.push(piece);
                        }
                        // finally, add the last piece
                        out.push(wordArray[wordArray.length-1]);
                    }
                }
                // If nothing done, just use the same word
                if(out.length == 0) {
                    out.push(word);
                }
                return out;
            }

            console.log("String: " + long_string);

            var split_out = [[]];
            var split_string = long_string.toString().split(" ");

            for(var i=0; i<split_string.length; i++){
                var word = split_string[i];

                // If the word itself exceed the max length, split it,
                if(word.length > max_char){
                    var wordPieces = splitLongWord(word, max_char);
                    for(var i=0;i<wordPieces.length;i++){
                        var wordPiece = wordPieces[i];
                        split_out = split_out.concat([[]]);
                        split_out[split_out.length-1] = split_out[split_out.length-1].concat(wordPiece);
                    }

                } else {
                    // otherwise add it if possible
                    if ((sum_length_of_words(split_out[split_out.length-1]) + word.length) > max_char){
                        split_out = split_out.concat([[]]);
                    }

                    split_out[split_out.length-1] = split_out[split_out.length-1].concat(word);
                }
            }

            for (var i=0; i<split_out.length; i++){
                split_out[i] = split_out[i].join(" ");
            }

            return split_out;
        };


        function userHasReview(daycareId) {

            reviewService.getMyReviews(self.user._id).then(function (res) {
                if (res !== null) {
                    self.reviewsByUser = [];

                    console.log("reviewServiceResLength: " + res.length);

                    res.forEach(function (item) {
                        // console.log("userReview: " + JSON.stringify(item));
                        self.reviewsByUser.push(item);
                    });

                    self.userAlreadyReviewed = false
                    if (self.reviewsByUser !== null || typeof(self.reviewsByUser) !== 'undefined') {
                        self.userAlreadyReviewed = self.reviewsByUser.some(function (review) {
                            console.log("Comparing : " + review.daycare_id + " " + daycareId);
                            return review.daycare_id === daycareId;
                        });
                    }
                }

            });

        };

        function requestOwnership() {
            ownerBtnIcon.removeClass('hide');

            if (self.ownerBtnDisplay === 'Cancel Request') {
                ownershipService.delete({ownerRequestId: self.ownerRequest._id}, function(response) {
                    if (response.message) {
                        self.ownerBtnDisplay = 'Request Ownership';
                    } else {
                        console.warn(response);
                    }
                });
            } else if (self.ownerBtnDisplay === 'Request Ownership') {
                if (self.ownerRequest && self.ownerRequest.status == 'rejected') {
                    ownershipService.update({ownerRequestId: self.ownerRequest._id}, {status: 'pending', owner: {_id:self.user._id}, listing: {_id:$stateParams.listingId}, from: 'provider'}, function(response) {
                        if (response._id) {
                            self.ownerBtnDisplay = 'Cancel Request';
                            ownerBtnIcon.removeClass('fa-spinner fa-spin');
                            self.ownerRequest.status = 'pending';
                            $state.go('ownershipUploads', {ownershipId: self.ownerRequest._id});
                        } else {
                            ownerBtnIcon.addClass('hide');
                            console.warn(response);
                        }
                    });
                } else {
                    ownershipService.save({owner: self.user.id, listing: $stateParams.listingId}, function (response) {
                        console.log(response);

                        if (response.owner_requested) {
                            self.ownerBtnDisplay = 'Cancel Request';
                            ownerBtnIcon.removeClass('fa-spinner fa-spin');
                            self.ownerRequest = response.owner_requested;
                            $state.go('ownershipUploads', {ownershipId: response.owner_requested._id});
                        } else {
                            ownerBtnIcon.addClass('hide');
                            console.warn(response);
                        }
                    });
                }
            }
        }

        var listingForm = {
            name: '',
            // description : '',
            administrator: '',
            address: '',
            phone: '',
            fax: '',
            email: '',
            website: '',
            license: ''
        }

        $scope.formData = {};

        self.updateReview = function () {
            reviewService.listingData = self.listing;

            if (typeof(self.reviewsByUser) !== "undefined" || self.reviewsByUser !== null) {

                var userReview = self.reviewsByUser.some(function (review) {
                    if (review.daycare_id == self.listing._id) {
                        $cookies.put("tmpUrl", "daycare_detail");
                        console.log("User Review: " + JSON.stringify(review));

                        $state.go('writeReview', {daycareId: self.listing._id, reviewId: review._id});
                    }
                });
            } else {
                $state.go('writeReview', {daycareId: self.listing._id});
            }
        };

        self.writeReview = function () {
            reviewService.listingData = self.listing;

            $state.go('writeReview', {daycareId: self.listing._id});

        };

        $scope.switchForm = function(index) {
            var indexDiff = index - $scope.progress.formIndex;
            // don't switch to tabs more than one place current tab
            if (Math.abs(indexDiff) !== 1) return;

            // only check form when going to next tab
            if (indexDiff > 0) {
                var form = $scope.formHash[$scope.progress.formIndex];
                form.$setSubmitted();
                if (!form.$valid) {
                    var firstErrorElement = angular.element("[name='" + form.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    hackService.scrollAnim(firstErrorElement);
                    return;
                }

                if (!AuthService.isAdmin()) {
                    $scope.listing.email = self.user.email;
                }

                switch($scope.progress.formIndex) {
                    case 1:
                        $scope.progress.contactInfoCompleted = true;
                        break;
                    case 2:
                        $scope.progress.operatingCompleted = true;
                        break;
                    case 3:
                        $scope.progress.coveragesCompleted = true;
                        break;

                }
            }

            $timeout(function() {
                switch (index) {
                    case 1:
                        $('#crumbContactInfo a').tab('show');
                        break;
                    case 2:
                        $('#crumbOperating a').tab('show');
                        // put back 'Other' to show in curriculums select
                        if (self.otherCurriculum) {
                            var otherCurriculumIdx = $scope.listing.curriculum.findIndex(function(curriculum) {
                                return curriculum.description === self.otherCurriculum;
                            });
                            if (otherCurriculumIdx !== -1)
                                $scope.listing.curriculum[otherCurriculumIdx].description = 'Other';
                        }
                        break;
                    case 3:
                        $('#crumbCoverages a').tab('show');
                        // replace 'Other' in curriculum with user input to show in review tab
                        if (self.otherCurriculum) {
                            var otherCurriculumIdx = $scope.listing.curriculum.findIndex(function(curriculum) {
                                return curriculum.description === 'Other';
                            });
                            if (otherCurriculumIdx !== -1)
                                $scope.listing.curriculum[otherCurriculumIdx].description = self.otherCurriculum;
                        }
                        break;
                    case 4:
                        $('#crumbComplete a').tab('show');
                        break;
                }

                var form = $scope.formHash[$scope.progress.formIndex];
                if (form)
                    form.$setPristine();
                $scope.progress.formIndex = index;
                hackService.scrollToTop();
            });
        };

        $scope.update = function () {
            if ($scope.listing.accreditations) {
                var otherIndex;
                if (!$scope.listing.accredited || $scope.listing.accredited === COMMON.N)
                    $scope.listing.accreditations.length = 0;
                else {
                    if ((otherIndex = $scope.findOtherAccred()) !== -1) {
                        // check if user chose 'Other' on accreditations dropdown and replace 'Other' with user's input
                        self.listingAccreds[otherIndex].name = self.otherAccred;
                        self.listingAccreds[otherIndex].goldSeal = false;
                    }
                    $scope.listing.accreditations = self.listingAccreds;
                }
            }
            if ($scope.listing.curriculum) {
                if ($scope.listing.curriculum.length === 1 && !$scope.listing.curriculum[0].description)
                    $scope.listing.curriculum.length = 0;
            }
            if ($scope.listing.logo instanceof File)
                $scope.listing.logo = imageService.base64ToFile(self.croppedDataUrl, $scope.listing.logo.name.split('.')[0]);
            else
                delete $scope.listing.logo;

            $scope.listing.managed = "Y";

            if($scope.listing.operatingHours != null){
                $scope.listing.operatingHours = JSON.parse(angular.toJson($scope.listing.operatingHours));
            }


            Upload.upload({
                url: '/api/listing',
                data: $scope.listing
            }).then(function() {
                $state.go('dashboard_daycares');
            }, function(err) {
                console.warn(err);
            });
        };

        $scope.alertRegister = function(){
            swal({
                title: "Log In Required",
                text: "This action requires you to be logged in. If you are not a registered user, please take a few minutes to become one by clicking 'Register' on top of the page.  There is no fee to become a registered user.",
                type: "warning"
            }, function() {
                swal.close();
            });
        }

        $scope.cancelUpdate = function() {
            swal({
                title: "Cancel Changes?",
                text: "Are you sure you want to cancel your changes?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                showLoaderOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    $state.go('dashboard_daycares');
                }
            });
            hackService.scrollAnim('div.sweet-alert button.cancel', true);
        };

        $scope.getHoursTable = function() {
            if ($scope.listing) {
                var hoursTable = {
                    headings: ['Day', 'Open', 'Closed'],
                    rows: []
                };

                $scope.listing.operatingHours.forEach(function(day, index) {
                    day.sched.forEach(function(sched, schedIdx){
                        if(schedIdx == 0) {
                            hoursTable.rows.push([capitalizeFilter(day.day),sched.open,sched.close])
                        } else {
                            hoursTable.rows.push(["",sched.open,sched.close]);
                        }
                    })
                });
                return JSON.stringify(hoursTable);
            }
            return '';
        };

        $scope.getCoverage = function() {
            if ($scope.listing) {
                return JSON.stringify({
                    rows: [
                        [ynToFA($scope.listing.fullday),'Full day'],
                        [ynToFA($scope.listing.halfday),'Half day'],
                        [ynToFA($scope.listing.infantcare),'Infant'],
                        [ynToFA($scope.listing.nightcare),'Night'],
                        [ynToFA($scope.listing.parttime),'Part time'],
                        [ynToFA($scope.listing.schoolyearonly),'School year only'],
                        [ynToFA($scope.listing.weekend),'Weekend']
                    ]
                });
            }
            return '';
        };

        $scope.getServiceOpts = function() {
            if ($scope.listing) {
                return JSON.stringify({
                    rows: [
                        [ynToFA($scope.listing.afterschool),'After school'],
                        [ynToFA($scope.listing.beforeschool),'Before school'],
                        [ynToFA($scope.listing.dropins),'Drop-ins'],
                        [ynToFA($scope.listing.meals),'Food Served'],
                        [ynToFA($scope.listing.transportation),'Transportation']
                    ]
                });
            }
            return '';
        };

        $scope.getOtherFeats = function() {
            if ($scope.listing) {
                var accredsArr = [];
                if ($scope.listing.accredited === COMMON.Y) {
                    accredsArr = (self.listingAccreds) ?
                        self.listingAccreds.reduce(function(result, accred) {
                            if (accred.name === 'Other') {
                                self.otherAccred && result.push(self.otherAccred.toUpperCase());
                            } else {
                                result.push(accred.name);
                            }
                            return result;
                        }, accredsArr) : accredsArr;
                    accredsArr = accredsArr.sort();
                }
                var goldSealAccred = ($scope.listing.goldSeal === COMMON.Y) ? self.listingGoldSealAccred.name : '';

                var state = $scope.listing.address.state;
                var qualSuffix = "";
                if(state == "NJ"){
                    qualSuffix =  " (Grow NJ Kids)";
                } else if(state == "VA"){
                    qualSuffix =" (Virginia Quality)";
                } else if(state == "NY"){
                    qualSuffix =  " (QUALITYstarsNY)";
                } else if(state == "FL"){
                    qualSuffix = " (Gold Seal)";
                }

                return JSON.stringify({
                    rows: [
                        [ynToFA($scope.listing.accredited),'Accredited',accredsArr.join(', ')],
                        [ynToFA($scope.listing.faithbased),'Faith based'],
                        [ynToFA($scope.listing.goldSeal),'State Quality Program' + qualSuffix],
                        [ynToFA($scope.listing.headstart),'Head Start'],
                        [ynToFA($scope.listing.schoolReadiness),'School Readiness'],
                        [ynToFA($scope.listing.vpk),'Voluntary Pre-K']
                    ]
                });
            }
            return '';
        };

        function ynToFA(val) {
            return '<i class="fa ' + (val === COMMON.Y ? 'fa-check' : 'fa-times') + '"></i>';
        }

        $scope.onFileSelected = function($file) {
            if ($file) {
                var reader = new FileReader();
                if ($file.type === 'application/pdf') {
                    reader.readAsArrayBuffer($file);
                    reader.onload = function() {
                        imageService.pdfToImgBase64(
                            jsPDFService.jsPDF.API.binaryStringToUint8Array(jsPDFService.jsPDF.API.arrayBufferToBinaryString(reader.result))
                        ).then(function(imgBase64) {
                            $timeout(function() {
                                $scope.logoToCrop = imgBase64;
                            });
                        });
                    };
                } else {
                    reader.readAsDataURL($file);
                    reader.onload = function() {
                        $timeout(function() {
                            $scope.logoToCrop = reader.result;
                        });
                    };
                }
            } else {
                $scope.logoToCrop = '';
            }
        };

        $scope.findOtherAccred = function() {
            if (self.listingAccreds) {
                return self.listingAccreds.findIndex(function(accred) {
                    return accred.name === 'Other';
                });
            }
            return -1;
        };

        $scope.toggleHoursOp = function(longDay) {
            if (!$scope.listing.openHours[longDay] && !$scope.listing.closeHours[longDay]) {
                $scope.listing.openHours[longDay] = $scope.openHoursHash[longDay] || '6:00 AM';
                $scope.listing.closeHours[longDay] = $scope.closeHoursHash[longDay] || '6:00 PM';
            } else {
                $scope.openHoursHash[longDay] = $scope.listing.openHours[longDay];
                $scope.closeHoursHash[longDay] = $scope.listing.closeHours[longDay];
                $scope.listing.openHours[longDay] = $scope.listing.closeHours[longDay] = '';
            }
        };

        $scope.isOtherCurriculum = function() {
            if ($scope.listing && $scope.listing.curriculum && $scope.listing.curriculum.length) {
                return $scope.listing.curriculum.filter(function(curriculum) {
                    return curriculum.description === 'Other';
                }).length;
            }
            return false;
        };

        // $scope.goldSealChecked = function() {
        //     if ($scope.listing.goldSeal === COMMON.Y)
        //         $scope.listing.accredited = COMMON.Y;
        // };

        $scope.approveDaycare = function (data, option) {
            data.status = option;
            console.log(data);
            var response = listingService.approveListing(data,
                function () {
                    console.log(response);
                    self.listing.status = option;
                });
        }

        $scope.GetReviewsDetail = function (id) {
            getListingDetail(id);
        }
        $scope.showHighestTag = function (tags) {
            //console.log(tags.length);
            if (tags.length >= 1) {
                var like = 0;
                var unlike = 0;
                var flag = 0;
                var status = "People find this balanced";
                for (var x = 0; x < tags.length; x++) {
                    if (tags[x].tag == "like") {
                        like += 1;
                    }
                    if (tags[x].tag == "unlike") {
                        unlike += 1;
                    }
                    if (tags[x].tag == "flag") {
                        flag += 1;
                    }
                }
                if (like > unlike && like > flag) {
                    status = "people find this helpful";
                }
                if (unlike > like && unlike > flag) {
                    status = "people find this not helpful";
                }
                if (flag > like && flag > unlike) {
                    status = "people find this a flag";
                }
                if (Math.max(like, unlike, flag) == 1) {
                    return status;
                }
                else {
                    return Math.max(like, unlike, flag) + " " + status;
                }

            }
            else {
                // return "No tags Yet!";
                return "";
            }

        }

        $scope.openModalAllTags = function (tags, total) {
            $scope.modalTagHeader = total;
            $scope.alltags = tags;
        }

        $scope.goBackToList = function() {
            // return state where daycare detail was clicked from
            console.log("Previous page: " + sessionStorage.getItem('prevChilCareListState'));

            if(sessionStorage.getItem('prevChilCareListState')){
                return sessionStorage.getItem('prevChilCareListState');
            } else {
                return "search";
            }

        }

        $scope.addSched = function(parentIdx, schedIdx) {
            console.log("Index " + parentIdx + " - " + schedIdx)
            $scope.listing.operatingHours[parentIdx].sched.push({open:"1:00 AM", close:"10:00 AM"});
            console.log($scope.listing.operatingHours);
        }

        $scope.removeSched = function(parentIdx, schedIdx) {
            $scope.listing.operatingHours[parentIdx].sched.splice(schedIdx, 1);
        }

        $scope.toggleClosedDay = function(parentIdx) {

            console.log("Before Closed: " + parentIdx + " " +  $scope.listing.operatingHours[parentIdx].day + " " + $scope.listing.operatingHours[parentIdx].closed + " " + !$scope.listing.operatingHours[parentIdx].closed);
            $scope.listing.operatingHours[parentIdx].closed = !$scope.listing.operatingHours[parentIdx].closed;
            console.log("After Closed: " + parentIdx + " " +  $scope.listing.operatingHours[parentIdx].day + " " + $scope.listing.operatingHours[parentIdx].closed);

            //$scope.listing.operatingHours[parent].sched = [{}];
        }

        function focusToReviews() {

            var target = "review";
            if ($cookies.get("tmpUrl") === "review") {
                getListingDetail($stateParams.listingId);
                //truncateReviews(minRevDisplay);
                $('a[data-target="#reviews"]').tab('show');
                $cookies.put("tmpUrl", "daycare_detail");
            }
            else if ($cookies.get("tmpUrl") === "forms_document") {
                $('a[data-target="#formsdocument"]').tab('show');
                $cookies.put("tmpUrl", "daycare_detail");
            }
            else {
                $cookies.put("tmpUrl", "daycare_detail");
                $('a[data-target="#about"]').tab('show');
            }

        }

        $('a[data-target="#reviews"]').on('show.bs.tab', function (e) {
            getListingDetail($stateParams.listingId);
            //groupRatings(self.reviews);
            truncateReviews(minRevDisplay);

        });

        // Graph Generate Codes

        var optionGeneric = {
            title: {
                enable: true,
                css: {
                    //width: "nullpx",
                    //textAlign:"left",
                }
            },
            //rightAlignYAxis: true
        };

        var chartGeneric = {
            //type: 'discreteBarChart',
            type: 'multiBarHorizontalChart',
            width: 180,
            height: 170,
            x: function (d) {
                return d.label;
            },
            y: function (d) {
                return d.value + (1e-10);
            },
            duration: 500,
            showYAxis: false,
            showValues: true,
            groupSpacing: 0.3,
            valueFormat: function (d) {
                var x = d3.format(',.0f')(d);
                if (x > 0) return x;
            },
            tooltip: {
                valueFormatter: function (d, i) {
                    var y = d3.format(',.0f')(d);
                    return y + ((y > 1) ? " Reviews" : " Review");
                }
            },
            showLegend: false,
            showControls: false,
            multibar: {
                dispatch: {
                    elementClick: function (t, u) {
                    }
                }

            },
            forceY: [0.1],
            margin: {
                top: 0,
                //left:0
            }
        };

        $scope.showOldReview = showOldReview;
        $scope.addTag = addTag;
        $scope.isReviewOwner = isReviewOwner;

        var chartOverAll = angular.merge({}, chartGeneric);
        var chartSafety = angular.merge({}, chartGeneric);
        var chartFacilities = angular.merge({}, chartGeneric);
        var chartStaff = angular.merge({}, chartGeneric);
        var chartEducation = angular.merge({}, chartGeneric);

        // Click Events Init
        chartSafety.multibar.dispatch.elementClick = chartClickSafety;
        chartSafety.width = 210;
        chartFacilities.multibar.dispatch.elementClick = chartClickFacilities;
        chartFacilities.margin.left = 1;
        chartFacilities.width = 150;
        chartStaff.multibar.dispatch.elementClick = chartClickStaff;
        chartStaff.margin.left = 1;
        chartStaff.width = 150;
        chartEducation.multibar.dispatch.elementClick = chartClickEducation;
        chartEducation.margin.left = 1;
        chartEducation.width = 150;
        chartOverAll.multibar.dispatch.elementClick = chartClickOverall;
        chartOverAll.margin.left = 1;
        chartOverAll.width = 150;

        $scope.optionOverAll = angular.merge({}, optionGeneric);
        $scope.optionSafety = angular.merge({}, optionGeneric);
        $scope.optionFacilities = angular.merge({}, optionGeneric);
        $scope.optionStaff = angular.merge({}, optionGeneric);
        $scope.optionEducation = angular.merge({}, optionGeneric);

        $scope.optionSafety.chart = chartSafety;
        $scope.optionSafety.title.text = 'Safety';
        $scope.optionFacilities.chart = chartFacilities;
        $scope.optionFacilities.title.text = 'Facilities';
        $scope.optionFacilities.title.css.textAlign = 'left';
        $scope.optionStaff.chart = chartStaff;
        $scope.optionStaff.title.text = 'Staff';
        $scope.optionStaff.title.css.textAlign = 'left';
        $scope.optionEducation.chart = chartEducation;
        $scope.optionEducation.title.text = 'Education';
        $scope.optionEducation.title.css.textAlign = 'left';
        $scope.optionOverAll.chart = chartOverAll;
        $scope.optionOverAll.title.text = 'Overall';
        $scope.optionOverAll.title.css.textAlign = 'left';
        var dataFilter;
        var keywordFilter;
        function chartClickOverall(t, u) {
            //console.log("Dispatch Overall"+JSON.stringify(t));
            var kword = "overall";
            dataFilter = t.data;
            keywordFilter =  kword;
            filterReview(t.data, kword);
        }

        function chartClickSafety(t, u) {
            //console.log("Dispatch Safety"+JSON.stringify(t));
            var kword = "safety";
            dataFilter = t.data;
            keywordFilter =  kword;
            filterReview(t.data, kword);
        }

        function chartClickFacilities(t, u) {
            //console.log("Dispatch Facilities"+JSON.stringify(t));
            var kword = "facilities";
            dataFilter = t.data;
            keywordFilter =  kword;
            filterReview(t.data, kword);
        }

        function chartClickStaff(t, u) {
            //console.log("Dispatch Staff"+JSON.stringify(t));
            var kword = "staff";
            dataFilter = t.data;
            keywordFilter =  kword;
            filterReview(t.data, kword);
        }

        function chartClickEducation(t, u) {
            var kword = "education";
            //console.log("Dispatch Education"+JSON.stringify(t));
            filterReview(t.data, kword);
        }

        self.filterReview = filterReview;
        function filterReview(elementData, attrib) {
            if (elementData == null || attrib == null) {
                $scope.filteredReviews.length = 0;
                self.reviews.forEach(function (rev) {
                    $scope.filteredReviews.push(rev);
                });
                if (!$scope.$$phase)$scope.$apply();
                return 0;
            }

            //console.log("FilterReview: "+JSON.stringify(elementData.label) );
            $scope.pickedAttrib = attrib;
            var star = 0;
            if (elementData.value > 0) {

                switch (elementData.label) {
                    case "1 Star":
                        star = 1;
                        break;
                    case "2 Star":
                        star = 2;
                        break;
                    case "3 Star":
                        star = 3;
                        break;
                    case "4 Star":
                        star = 4;
                        break;
                    case "5 Star":
                        star = 5;
                        break;
                    default:
                        return null;
                        break;
                }

                getReviewsWith(star, attrib);
                //console.log("filteredReviews: "+JSON.stringify($scope.filteredReviews));
            }


        }

        function getReviewsWith(star, att) {
            //console.log("getReviewsWith: "+star+ "star in "+att);
            $scope.filteredReviews.length = 0;
            var found = false;
            for (var i = 0; i < self.reviews.length; i++) {

                found = false;
                switch (att) {
                    case "overall":
                        if (self.reviews[i].reviewInfo.overAllRate === star) {
                            found = true;
                        }
                        break;
                    case "safety":
                        if (self.reviews[i].reviewInfo.safetyRate === star) {
                            found = true;
                        }
                        break;
                    case "facilities":
                        if (self.reviews[i].reviewInfo.facilitiesRate === star) {
                            found = true;
                        }
                        break;
                    case "staff":
                        if (self.reviews[i].reviewInfo.staffRate === star) {
                            found = true;
                        }
                        break;
                    case "education":
                        if (self.reviews[i].reviewInfo.educationRate === star) {
                            found = true;
                        }
                        break;
                }
                if (found) {
                    //console.log("Found: "+JSON.stringify(self.reviews[i]));
                    $scope.filteredReviews.push(self.reviews[i]);
                }
            }
            if (!$scope.$$phase)$scope.$apply();
        }

        function initGraphData() {
            function init(dataSet, sourceSet) {
                var maxSetSize = 5;
                dataSet[0] = {
                    key: "",
                    values: []
                };
                // Ascending order
                for (var i = 0; i < maxSetSize; i++) {
                    //dataSet[0].color = '#'+Math.floor(Math.random()*16777215).toString(16);
                    dataSet[0].color = "#F5BE4E";
                    dataSet[0].values[i] = {
                        label: (i + 1) + " Star",
                        value: sourceSet[i]
                    };
                }

                // Descending order
                for (var i = 0; i < maxSetSize; i++) {
                    //dataSet[0].color = '#'+Math.floor(Math.random()*16777215).toString(16);
                    dataSet[0].color = "#F5BE4E";
                    dataSet[0].values[i] = {
                        label: (maxSetSize - i) + " Star",
                        value: sourceSet[(maxSetSize - 1) - i]
                    };
                }

            };
            init($scope.overAllData, self.ratingGroup.overall);
            init($scope.safetyData, self.ratingGroup.safety);
            init($scope.facilitiesData, self.ratingGroup.facilities);
            init($scope.staffData, self.ratingGroup.staff);
            init($scope.educationData, self.ratingGroup.education);
        }

        // Load graph data and grouped by category
        function groupRatings(reviews) {

            if (self.isReviewsLoaded) {
                //truncateReviews(minRevDisplay);
                self.ratingGroup = {
                    overall: [0, 0, 0, 0, 0],
                    safety: [0, 0, 0, 0, 0],
                    facilities: [0, 0, 0, 0, 0],
                    staff: [0, 0, 0, 0, 0],
                    education: [0, 0, 0, 0, 0]
                };
                //console.log("grouping: "+ JSON.stringify(reviews));
                reviews.forEach(function (review) {
                    if (review.reviewInfo.overAllRate != null && review.reviewInfo.overAllRate > 0) self.ratingGroup.overall[review.reviewInfo.overAllRate - 1] += 1;
                    if (review.reviewInfo.safetyRate != null && review.reviewInfo.safetyRate > 0) self.ratingGroup.safety[review.reviewInfo.safetyRate - 1] += 1;
                    if (review.reviewInfo.facilitiesRate != null && review.reviewInfo.facilitiesRate > 0) self.ratingGroup.facilities[review.reviewInfo.facilitiesRate - 1] += 1;
                    if (review.reviewInfo.staffRate != null && review.reviewInfo.staffRate > 0) self.ratingGroup.staff[review.reviewInfo.staffRate - 1] += 1;
                    if (review.reviewInfo.educationRate != null && review.reviewInfo.educationRate > 0) self.ratingGroup.education[review.reviewInfo.educationRate - 1] += 1;
                });
                initGraphData();
            } else {
                console.log("!!! ERROR LOADING OF REVIEWS !!!");
            }
        }

        function truncateReviews(max) {

            var revLen = self.reviews.length;

            if (revLen < max) {
                max = revLen
            }
            $scope.filteredReviews = [];
            for (var i = 0; i < max; i++) {
                $scope.filteredReviews.push(self.reviews[i]);
            }
            if (!$scope.$$phase)$scope.$apply();

        }

        function tagCounter(review){
            if(review.tags.length>0){
                review.likes = 0;
                review.unlikes = 0;
                review.haveLikes = false;
                review.haveUnlikes = false;
                review.userLiked = false;
                review.userUnliked = false;


                review.tags.forEach(function(tag){
                    if(tag.tag=="unlike"){
                        //console.log("UNLIKE TAG");
                        review.unlikes += 1;
                        review.haveUnlikes =true;

                        if(self.user && tag.userId == self.user._id){
                            review.userUnliked = true;
                        }

                    }else if(tag.tag=="like"){
                        //console.log("LIKE TAG");
                        review.likes += 1;
                        review.haveLikes =true;

                        if(self.user && tag.userId == self.user._id){
                            review.userLiked = true;
                        }

                    }else{
                        console.log("Undefined Tag");
                    }
                });
            }else{
                console.log("Failed to Tag Reviews");
            }
        }

        function isReviewOwner(review){

            // console.log("isReviewOwner " + JSON.stringify(review) + " User ID: " + self.user._id  );

            if(self.user && review && self.user._id == review.user_id._id){
                // console.log("Review owner cannot vote his own review - Changing title!")
                return true;
            } else {
                // console.log("Not Review owner can vote his own review ")
                return false;
            }
            return false;
        }


        function addTag(review, tag) {

            console.log("AddTag " + JSON.stringify(review.userVote) + " User ID: " + self.user._id  + " Reviewer: " + review.user_id._id);

            if(self.user && self.user._id == review.user_id._id){
                console.log("Review owner cannot vote his own review!")
            } else {

                if (!review.userVote) {
                    reviewService.addTagReview(review._id, self.user._id, tag)
                        .then(function (response) {
                            console.log("AddTagReview " + tag + " user: " + self.user._id)
                            // console.log(response);
                            getListingDetail($stateParams.listingId);
                        }, function (err) {
                            console.log(err);
                        });
                } else {
                    if(review.userVote.vote == tag){
                        reviewService.removeTagReview(review._id, self.user._id)
                            .then(function (response) {
                                console.log("RemoveTagReview " + tag + " user: " + self.user._id)
                                // console.log(response);
                                getListingDetail($stateParams.listingId);
                            }, function (err) {
                                console.log(err);
                            });
                    } else {
                        reviewService.addTagReview(review._id, self.user._id, tag)
                            .then(function (response) {
                                console.log("UpdateTagReview " + tag + " user: " + self.user._id)
                                // console.log(response);
                                getListingDetail($stateParams.listingId);
                            }, function (err) {
                                console.log(err);
                            });
                    }

                }
            }


        }

        function showOldReview(show, rev) {
            $scope.replies[$scope.currRevHash[rev._id]._id].show_replies = false;
            $scope.currRevHash[rev._id] = (rev.show_old_review = show) ? rev.oldReview : rev;
            hackService.scrollAnim('#review' + rev._id, false, 150);
        }
    }]);
