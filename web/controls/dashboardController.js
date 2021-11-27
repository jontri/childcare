var dashboardModule = angular.module('dashboardController', ['ngAnimate','ngSanitize']);

dashboardModule.controller('dashboardCtrl', ['$scope','$q','$cookies','$filter','AuthService', '$http', '$state', 'userService',
    'securityQuestionsService', 'allUserService', 'localStorageService', 'clientService', 'reviewService', 'listingService',
    'ownershipService', 'stateService', 'messageService', '$location', '$stateParams', '$rootScope','articleService','hackService','orderByFilter',
    'AutoLogoutService', 'searchService', 'appointmentService', '$timeout',
    function ($scope,$q, $cookies, $filter, AuthService, $http, $state, userService, securityQuestionsService, allUserService,
              localStorageService, clientService, reviewService, listingService, ownershipService, stateService, messageService, $location, $stateParams, $rootScope, articleService,
              hackService, orderBy, AutoLogoutService, searchService, appointmentService, $timeout) {

        var self = this,
            used_sec_questions = [],
            sec_quest_place_holder = 'Select a Question',
            curr_anim;


        $scope.showPasswordFields = true;
        $scope.showPasswords = false;
        $scope.regexPassword = "(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!,%,&,@,#,$,^,*,?,_,~]).{8,25}"
        self.submitted = false;
		$scope.totalFaveDayCareCount = 0;

        $scope.user = angular.copy(AuthService.getUser());
        // console.log("User logged in: " + JSON.stringify($scope.user));

        $scope.isParent = AuthService.isParent();
        $scope.isAdmin = AuthService.isAdmin();
        $scope.isProvider = AuthService.isProvider();
		$scope.totalFaveDayCareCount = 0;

        if (angular.isUndefined($scope.user)) {
            $scope.user = {};
        }
        if (angular.isUndefined($scope.user.security_question)) {
            $scope.user.security_question = {};
        }

        $scope.editUser = angular.copy($scope.user);
        //$scope.role = "staff";

        // Moved to staffController
        $scope.Staff = {
            "firstName": "",
            "lastName": "",
            "email": "",
            "mobileNumber": "",
            "phoneNumber": "",
            "workNumber": "",
        };
        // Moved to staffController
        $scope.role = {
            "type": "select",
            "name": "Role",
            "value": "Staff",
            "values": ["Staff", "Teacher"]
        };

        $scope.StaffListingId = $stateParams.listingId;
        $scope.usermessage = [];
        $scope.selected_user = localStorageService.get("selected_user");
        $scope.securityQuestion = [];
        $scope.all_users = [];
        $scope.reviews = [];
        $scope.daycares = [];
        $scope.items = [];
        $scope.no_items = [];
        $scope.mydaycares = [];
        $scope.selectedState = null;
        $scope.stateList = stateService.getListOfStates().then(
            function (response) {
                $scope.stateList = ['State'];
                var data = response.data;
                for (key in data) {
                    $scope.stateList.push(key);
                }
            },
            function (err) {
                console.log(err);
            }
        );
        $scope.editUser.address = $scope.editUser.address ? $scope.editUser.address : {};
        $scope.editUser.address.state = $scope.editUser.address.state ? $scope.editUser.address.state : 'State';
        $scope.editUser.work_address = $scope.editUser.work_address ? $scope.editUser.work_address : {};
        $scope.editUser.work_address.state = $scope.editUser.work_address.state ? $scope.editUser.work_address.state : 'State';
        $scope.titleList = ['Title', 'Mr.', 'Mrs.', 'Ms.'];
        $scope.editUser.title = $scope.editUser.title ? $scope.editUser.title : 'Title';
        $scope.suffixList = ['Suffix', 'Jr.', 'Sr.', 'Other'];
        if ($scope.editUser.suffix) {
            if ($scope.suffixList.indexOf($scope.editUser.suffix) == -1) {
                $scope.editUser.otherSuffix = $scope.editUser.suffix;
                $scope.editUser.suffix = 'Other';
            }
        } else {
            $scope.editUser.suffix = 'Suffix';
        };

        self.staffEditMode = false;

        getSecurityQuestions();

        function logout() {
            var logoutUser = AuthService.getUser();
            AuthService.logout();
            AuthService.deleteSession( logoutUser );
            AutoLogoutService.stop();
            $rootScope.$broadcast('user-logged-out');
            localStorage.removeItem('userId');
            $state.go('home');
        }

        $scope.updateAppointment = function (formData, option) {            
            var data = {
                listing: formData.listing._id,
                listingName: formData.listing.s_name,
                user: formData.user,
                date: formData.date,
                emailDate: $filter('date')(formData.date, "EEEE, MMM dd, yyyy 'at' h:mm a"),
                status: option
            }
            appointmentService.put({appointmentId: formData.id}, data);
        }

        if ($state.current.name == 'dashboard_home' || $state.current.name == 'dashboard_appointments') {
            $scope.appointments = appointmentService.query({userId: $scope.user._id}, function() {
                $scope.appointments = $filter('filter')($scope.appointments, {status:'!cancelled'});
            });
        }
        // adjust image sources for avatar in edit profile state
        else if ($state.current.name == 'dashboard_edit_profile') {

            if (!$scope.editUser.photo) {
                if ($scope.editUser.sex == 'Female') {
                    $scope.editUser.photo = 'assets/theme/images/people/avatar_blank_female.jpg';
                } else {
                    $scope.editUser.photo = 'assets/theme/images/people/avatar_blank_male.jpg';
                }
            }

            $http.get($scope.editUser.photo,{responseType:'arraybuffer'}).then(function(response) {
                var imgFile = b64ToFile(new Uint8Array(response.data), 'image/png', '.png', true);
                $scope.imgSelected(imgFile);
            });

            $scope.emailRegex = AuthService.emailRegex;
            $scope.gpComponents = {
                locality: 'long_name',
                sublocality: 'long_name',
                administrative_area_level_1: 'short_name',
                neighborhood: 'long_name',
                postal_code: 'short_name'
            };
        } else if ($state.current.name == 'dashboard_profile') {
            
        } else if ($state.current.name == 'dashboard_security_information') {
            AuthService.getUserFromDB(function (user) {
                if (user) {
                    AuthService.setUser(user);
                    $scope.user = user;
                    $scope.editUser = angular.copy($scope.user);
                }
            });
        } else if ($state.current.name == 'dashboard_all_reviews') {

            reviewService.getAllReviews()
                .then(function (reviews) {
                    $scope.reviews = reviews;
                    $scope.range();
                    angular.forEach($scope.reviews, function (value, key) {
                        $scope.reviews[key].dateOrder = new Date($scope.dateToMilli(value.dateSaved)).getTime();
                        listingService.get({listingId: $scope.reviews[key].daycare_id}, function (response) {
                            $scope.reviews[key].daycare = response.listing;
                        });
                    });
                }, function (err) {
                    console.warn(err);
                });

        } else if ($state.current.name == 'dashboard_all_daycares') {

            listingService.get({}, function (response) {
                $scope.daycares = response.searchResult;
                $scope.range();
                $(".wrapper").css('background-image', 'none');
                $(".wrapper").css('background-color', '#ffffff');
            });

        }
        else if ($state.current.name == 'dashboard_all_owner_requests') {
            $scope.reqLoadingHash = {};

            var docProps = ['id_doc', 'proof_owner_doc', 'power_attorney_doc'];
            ownershipService.get({}, function (response) {
                $scope.all_owner_requests = response.searchResult;
                angular.forEach($scope.all_owner_requests, function(val, key) {
                    var numDocs = 0;
                    docProps.forEach(function(prop) {
                        if (val[prop]) {
                            numDocs++;
                        }
                    });
                    $scope.all_owner_requests[key].numDocs = numDocs;
                });
                $scope.range();
            });
        }
        else if ($state.current.name == 'dashboard_all_feedbacks') {
            $scope.allFeedback = [];
            // TODO: get all feedbacks
            AuthService.getAllFeedback().then(
                function(feedbacks){
                    //console.log("Requested all feedbacks: " + JSON.stringify(feedbacks));
                    feedbacks.forEach(function(fb){
                        if(fb.status==null||fb.status!='complete'){
                            $scope.allFeedback.push(fb);
                        }

                    })
                    //$scope.allFeedback = feedbacks;
                    //console.log("Requested all feedbacks: " + JSON.stringify($scope.allFeedback));
                    //console.log($scope.allFeedback);
                });
        }
        else if ($state.current.name == 'dashboard_users') {
            allUserService.get({}, function (response) {
                $scope.all_users = response.users;
                $scope.range();
                console.log(response.users);
            });

        }
        else if ($state.current.name == 'dashboard_reviews' || $state.current.name == 'dashboard_ratings_listing') {

            var userId = $scope.user._id;
            $scope.pendingReviews = [];
            $scope.approvedReviews = [];
            $scope.rejectedReviews = [];

            var listingId = $stateParams.listingId;
            console.log("Getting reviews for Provider");

            if (listingId && AuthService.isProvider()) {
                reviewService.getMyReviewsOwned(userId, listingId)
                    .then(processReviews, function (err) {
                        console.warn(err);
                    });
                listingService.get({listingId: listingId}, function(response) {
                    $scope.listing = response.listing;
                });
            } else {
                reviewService.getMyReviews(userId)
                .then(processReviews, function (err) {
                    console.warn(err);
                });
            }

            var messageArea = 'textarea[name="message"]';

            function processReviews(reviews) {
                $scope.replies = {};
                console.log(reviews.length);
                $scope.reviews = reviews;
                if ($scope.reviews.length <= 0) {
                    $('.pagination').hide();
                }
                $scope.range();
                angular.forEach($scope.reviews, function (value, key) {
                    $scope.reviews[key].dateOrder = new Date($scope.dateToMilli(value.dateSaved)).getTime();
                    //console.log("### SNOOPING2: "+$scope.reviews[key].approved+" ###");
                    filterReview($scope.reviews[key]);
                    if ($state.current.name != 'dashboard_ratings_listing') {
                        listingService.get({listingId: $scope.reviews[key].daycare_id}, function (response) {
                            $scope.reviews[key].daycare = response.listing;
                        });
                    }
                    $scope.reviews[key].replyParams = {limit: 10, sortBy: '_id', sortOrder: -1};
                    getReplies($scope.reviews[key], function(response) {
                        $scope.replies[value._id] = response.data;
                        $scope.reviews[key].replyParams.skip = response.data.length;
                        // $scope.reviews[key].repliesLastRefresh = new Date().toLocaleString();
                    });
                });
            }

            function filterReview(review) {
                //console.log("### SNOOPY: "+review.approved+" ###");

                if (typeof(review.approved) === "undefined") {
                    // TODO: if approval of the review is null or not existing, do nothing
                    //$scope.pendingReviews.push(review);
                } else if (review.approved == "false") {
                    $scope.pendingReviews.push(review);
                } else if (review.approved == "true") {
                    $scope.approvedReviews.push(review);
                } else if (review.approved == "rejected") {
                    $scope.rejectedReviews.push(review);
                }
                //console.log("### p:"+$scope.pendingReviews.length+" a:"+$scope.approvedReviews.length+" ###");
            }
            $scope.editReview = function (paramObj) {
                $cookies.put("tmpUrl","dashboard_reviews");
                $state.go('writeReview', {daycareId:paramObj.daycareId, reviewId:paramObj.reviewId});
            }

            $scope.deleteReview = function (reviewId) {
                // console.log("REVIEW ID:"+reviewId);
                // console.log("USER ID:"+$scope.user._id);
                //console.log("USERTYPE:"+JSON.stringify($scope.user.userType) + " " + $scope.user.userType.includes("parent") + " and " +$scope.user.userType.includes("provider"));
                if ($scope.user.userType.indexOf("parent")!==-1 || $scope.user.userType.indexOf("provider")!==-1) {

                    swal({
                        title: "Confirm Deletion",
                        text: "Are you sure you want to delete this review?",
                        type: 'warning',
                        showCancelButton: true,
                        showConfirmButton: true,
                        confirmButtonText: "Delete",
                        showLoaderOnConfirm: true
                    }, function () {
                        hackService.waitForElem('div.sweet-alert.hideSweetAlert').then(function() {
                            reviewService.deleteReview(reviewId)
                                .then(function (response) {
                                    $state.reload();
                                }, function (error) {
                                    swal("Error", error, "error");
                                });
                        });
                    });
                    hackService.scrollAnim('div.sweet-alert button.cancel', true);
                }
            }

            function getReplies(review, callback) {
                reviewService.getReplies(review._id, review.replyParams)
                    .then(callback, function(err) {
                        console.warn(err);
                    });
            }

            $scope.createReply = function(review) {
                review.newReply = {};
                hackService.tryFocusToElem("#replyForm" + review._id + " " + messageArea, true);
            };

            $scope.editReply = function(reply) {
                reply.isEditMode = true;
                hackService.tryFocusToElem("#replyForm" + reply._id + " " + messageArea, true);
            };

            $scope.getOldReplies = function(reviewId) {
                if (!$scope.old_replies_is_loading) {
                    $scope.replyParams.limit = 10;
                    $scope.old_replies_is_loading = true;
                    getReplies(reviewId, function(response) {
                        $scope.old_replies_is_loading = false;
                        if (!response.data.length) {
                            $scope.no_more_replies = true;
                            return;
                        }
                        $scope.replies[reviewId] = $scope.replies[reviewId].concat(response.data);
                        $scope.replyParams.skip += response.data.length;
                    });
                }
            };

            $scope.onSend = function(form, reply, review) {
                if (!form.$valid) {
                    setTimeout(function () {
                        var firstErrorElement = angular.element("#replyForm" + (!reply._id ? review._id : reply._id))
                            .find(messageArea+'[class*="ng-invalid"]:visible:first');
                            firstErrorElement.focus();
                        $("html, body").animate({scrollTop: firstErrorElement.offset().top - 300}, 1000);
                    }, 1);
                    return;
                }

                reply.sender_id = $scope.user._id;
                review.user_id ? (reply.recipient_id = review.user_id._id) : true;
                reply.listing_id = review.daycare_id;
                reply.email = $scope.user.email;
                reply.review_id = review._id;

                reply.is_loading = true;
                if (!reply._id) {
                    reviewService.sendReply(review._id, reply)
                        .then(function(response) {
                            reply.is_loading = false;
                            review.replyParams.skip = 0;
                            review.newReply = null;
                            getReplies(review, function(replies) {
                                $scope.replies[review._id] = replies.data;
                                hackService.tryFocusToElem('#'+response.data._id);
                            });
                            // reviewService.getReplies(review._id, {startDate: review.repliesLastRefresh})
                            //     .then(function(response) {
                            //         $scope.replies[review._id].concat(response.data);
                            //         hackService.tryFocusToElem('#'+response.data._id);
                            //     }, function(err) {
                            //         console.warn(err);
                            //     });
                        }, function(err) {
                            console.warn(err);
                        });
                } else {
                    reviewService.updateReply(reply._id, reply)
                        .then(function(response) {
                            reply.is_loading = reply.isEditMode = false;
                            angular.forEach($scope.replies[review._id], function(value, key) {
                                if (value._id === response.data._id) {
                                    $scope.replies[review._id][key] = response.data;
                                    hackService.scrollAnim('#'+value._id);
                                }
                            });
                        }, function(err) {
                            console.warn(err);
                        });
                }
            }

        }
        else if ($state.current.name == 'dashboard_daycares' || $state.current.name == 'dashboard_ratings') {
            var userId = $scope.user._id;
            reviewService.getMyDaycares(userId)
                .then(function (mydaycare) {
                    $scope.mydaycares = mydaycare;
                    console.log("--------------------------------------------->");
                    console.log(mydaycare);
                    if ($scope.mydaycares.length <= 0) {
                        $('.pagination').hide();
                    }
                    $scope.range();
                    angular.forEach($scope.mydaycares, function (value, key) {
                        listingService.get({listingId: $scope.mydaycares[key].daycare_id}, function (response) {
                            $scope.mydaycares[key].daycare = response.listing;
                        });
                    });
                }, function (err) {
                    console.warn(err);
                });
        }
        else if ($state.current.name == 'dashboard_daycares_owner_request') {
            $scope.searchLimit = 100;
            $scope.searchSkip = 0;
            $scope.daycareResults = [];
            $scope.ownershipRequests = [];
            $scope.cancellingOwnershipHash = {};
            $scope.numReturned = 1;

            ownershipService.get({userId: $scope.user._id, status: 'pending'}, function(response) {
                if (response.searchResult) {
                    $scope.ownershipRequests = response.searchResult;
                } else {
                    console.warn(response);
                }
            });

            $scope.daycareSearch = function(loadMore, params) {
                if ($scope.daycareSearchForm)
                    $scope.daycareSearchForm.$submitted = $scope.daycareSearchForm.$submitted || true;
                if ($scope.searching) return;

                $scope.searching = true;
                $scope.searchError = false;
                var params = params || {
                    location: $scope.daycareLoc,
                    city: $scope.daycareCity,
                    state: $scope.daycareState,
                    zip: $scope.daycareZip,
                    keyword: $scope.daycareKeyword,
                    limit: $scope.searchLimit,
                    skip: $scope.searchSkip,
                    fullAddress: ''
                };

                // if city or state is missing, extract from location
                if ((!params.state || !params.city) && params.location) {
                    var locationArr = params.location.split(',');
                    params.city = locationArr[0].trim();
                    // remove zipcode
                    params.state = locationArr[1].replace(/[0-9]/g, '').trim();
                }

                console.log(params);

                if (!loadMore) {
                    if ($scope.ownerRequestForm)
                        $scope.ownerRequestForm.$setPristine();
                    params.skip = $scope.searchSkip = 0;
                    $scope.daycareResults = [];
                    $scope.daycareCity = $scope.daycareState = '';
                    if ((!$scope.daycareLoc && !$scope.daycareZip) || ($scope.daycareZip && $scope.daycareZip.length != 5)) {
                        if ($scope.daycareZip && $scope.daycareZip.length != 5) {
                            $('#txtZip').focus();
                        } else {
                            $('#txtCity').focus();
                        }
                        $scope.searching = false;
                        return;
                    }
                } else {
                    params = $scope.params;
                    params.skip = $scope.searchSkip;
                }

                searchService.filter(params, function(result) {
                    $scope.params = params;
                    $scope.searchSkip += ($scope.numReturned = result.searchResult.length);
                    $scope.daycareResults = $scope.daycareResults.concat(result.searchResult);
                    $scope.searching = false;
                    localStorage.setItem('DashboardSearchItem', JSON.stringify(params));
                }, function(err) {
                    console.log(err);
                    $scope.searchError = true;
                    $scope.searching = false;
                });
            };

            $scope.gpDaycareSearchCb = function(result, place) {
                $scope.daycareCity = result.city;
                $scope.daycareState = result.administrative_area_level_1;
                $scope.daycareSearch();
            };

            $scope.clearSearch = function() {
                $scope.searchLimit = 100;
                $scope.searchSkip = 0;
                $scope.daycareResults = [];
                $scope.numReturned = 1;
                $scope.daycareLoc = '';
                $scope.daycareCity = '';
                $scope.daycareState = '';
                $scope.daycareZip = '';
                $scope.daycareKeyword = '';
                $scope.ownerRequestForm.$setPristine();
                $scope.daycareSearchForm.$setPristine();
                localStorage.removeItem('DashboardSearchItem');
            };

            var params = JSON.parse(localStorage.getItem('DashboardSearchItem'));
            if (params) {
                $scope.daycareLoc = params.location;
                $scope.daycareCity = params.city;
                $scope.daycareState = params.state;
                $scope.daycareZip = params.zip;
                $scope.daycareKeyword = params.keyword;
                $scope.daycareSearch(false, params);
            }

            $scope.requestOwnership = function(ownerRequestForm, ownerReq) {
                $scope.daycaresReqExists = [];
                if ((!ownerReq && !ownerRequestForm.$valid) || $scope.requestingOwnership) {
                    return;
                }
                $scope.requestingOwnership = true;
                $scope.ownerReqError = false;

                if (!ownerReq) {
                    var ownerReqPromises = $scope.selectedDaycares.map(function(val) {
                        return ownershipService.save({owner: $scope.user._id, listing: val._id}, function(response) {
                            $scope.ownershipRequests.push(response.owner_requested);
                        }, function(err) {
                            if (err.data && err.data.errmsg.indexOf('duplicate key') !== -1) {
                                var found = $scope.ownershipRequests.filter(function(reqs) {
                                    return val.name === reqs.listing.name;
                                }).length;
                                var reqExist = {
                                    daycareName: val.name,
                                    isApproved: !found
                                };
                                $scope.daycaresReqExists.push(reqExist);
                            }
                        }).$promise;
                    });
                    $q.all(ownerReqPromises).then(function(responses) {
                        // all ownership requests saved
                        $scope.requestingOwnership = false;
                    }, function(err) {
                        console.warn(err);
                        $scope.requestingOwnership = false;
                        $scope.ownerReqError = (err.status === 500 || err.status === -1);
                    });
                } else {
                    ownershipService.update({ownerRequestId: ownerReq._id}, {status: 'pending', owner: {_id:$scope.user._id}, listing: {_id:ownerReq.listing._id}, from: 'provider'}, function(response) {
                        ownerReq.status = 'pending';
                        $scope.requestingOwnership = false;
                    }, function(err) {
                        $scope.requestingOwnership = false;
                        $scope.ownerReqError = true;
                    });
                }
            };

            $scope.cancelOwnership = function(req) {
                $scope.cancellingOwnershipHash[req._id] = true;
                ownershipService.delete({ownerRequestId: req._id, from: 'provider'}, function(response) {
                    delete $scope.cancellingOwnershipHash[req._id];
                    angular.forEach($scope.ownershipRequests, function(val, key) {
                        if (val._id === req._id) {
                            return $scope.ownershipRequests.splice(key, 1);
                        }
                    });
                }, function(response) {
                    console.warn(response);
                    $scope.cancellingOwnershipHash[req._id] = false;
                });
            };

            $scope.uploadDocuments = function(ownership_id) {
                $cookies.put("tmpUrl","dashboard_daycares_owner_request");
                $state.go('ownershipUploads', {ownershipId: ownership_id});
            };
        }
        else if ($state.current.name == 'dashboard_inbox') {

            //read message
            loadInbox();
            function loadInbox() {
                messageService.get({id: $scope.user._id, type: "inbox"}, function (response) {
                    self.userMessageResult = response.searchResult;
                    console.log(self.userMessageResult);
                    $scope.messageInboxCount = response.searchResult.length;
                    for (var x = 0; x < self.userMessageResult.length; x++) {
                        (function (x) {
                            getSenderName(self.userMessageResult, x);
                        })(x);
                    }
                });
            }

            function getSenderName(data, index) {
                userService.get({userId: data[index]['sender_id']}, function (responseUser) {
                    addDataUserMessageResult(responseUser.firstName, index);
                });
            }

            function addDataUserMessageResult(value, index) {
                self.userMessageResult[index]["sender_name"] = value;
            }


            loadSentMessages();
            function loadSentMessages() {
                messageService.get({id: $scope.user._id, type: "sent"}, function (response) {
                    self.userMessageResultSent = response.searchResult;
                    //console.log(self.userMessageResultSent);
                    for (var x = 0; x < self.userMessageResultSent.length; x++) {
                        (function (x) {
                            getSenderNameSent(self.userMessageResultSent, x);
                        })(x);
                    }
                });
            }


            function getSenderNameSent(data, index) {
                userService.get({userId: data[index]['recipient_id']}, function (responseUser) {
                    addDataUserMessageResultSent(responseUser.firstName, responseUser.email, index);
                });
            }

            function addDataUserMessageResultSent(value, email, index) {
                self.userMessageResultSent[index]["recipient_name"] = value;
                self.userMessageResultSent[index]["recipient_email"] = email;
            }

            $scope.setReadMessage = function (message, subject, sender_id, sender_name, email, message_id) {
                $scope.readmessage_message = message;
                $scope.readmessage_subject = subject;
                $scope.readmessage_sender_id = sender_id;
                $scope.readmessage_sender_name = sender_name;
                $scope.readmessage_email = email;
                $scope.readmessage_message_id = message_id;
                console.log($scope.readmessage_message_id);

            }


            loadDraftMessages();
            function loadDraftMessages() {
                messageService.get({id: $scope.user._id, type: "draft"}, function (response) {
                    self.userMessageResultDraft = response.searchResult;
                    console.log(self.userMessageResultDraft);
                    for (var x = 0; x < self.userMessageResultDraft.length; x++) {
                        (function (x) {
                            getSenderNameDraft(self.userMessageResultDraft, x);
                        })(x);
                    }
                });
            }

            function getSenderNameDraft(data, index) {
                userService.get({userId: data[index]['recipient_id']}, function (responseUser) {
                    addDataUserMessageResultDraft(responseUser.firstName, responseUser.email, index);
                });
            }

            function addDataUserMessageResultDraft(value, email, index) {
                self.userMessageResultDraft[index]["recipient_name"] = value;
                self.userMessageResultDraft[index]["recipient_email"] = email;
            }

            //reply
            var reply_model = {};
            self.sendMessage = sendMessage;
            self.new_message = angular.extend({}, reply_model);
            var user_details = angular.copy(AuthService.getUser());

            function sendMessage(message) {

                // console.log(self.new_message);

                self.new_message.sender_id = user_details._id;
                self.new_message.sender_email = user_details.email;
                self.new_message.recipient_id = $scope.readmessage_sender_id;
                self.new_message.status = $scope.readmessage_status;
                messageService.send(message, function (response) {
                    if (self.new_message.status == "sent") {
                        alertSent();
                    }
                    if (self.new_message.status == "draft") {
                        alertDraft();
                    }
                    self.new_message = {};

                });
            }

            $scope.setDraftMessage = function (bodymessage) {
                self.new_message_draft.message = bodymessage;
            }
            //draft
            var draft_model = {};
            self.sendDraftMessage = sendDraftMessage;
            self.new_message_draft = angular.extend({}, draft_model);

            function sendDraftMessage(message) {
                console.log(self.new_message_draft);
                self.new_message_draft.subject = $scope.readmessage_subject;
                self.new_message_draft.sender_id = user_details._id;
                self.new_message_draft.sender_email = user_details.email;
                // console.log(self.new_message.sender_email);
                self.new_message_draft.recipient_id = $scope.readmessage_sender_id;
                self.new_message_draft.message_id = $scope.readmessage_message_id;
                self.new_message_draft.status = "sent";

                messageService.update(message, function (response) {
                });
                alertSent();
                self.new_message_draft = {};
                self.new_message_draft.subject = "";
            }

            function alertSent() {
                swal({
                    title: "Message Sent!",
                    text: "Successfull send message"
                }, function () {
                    loadSentMessages();
                    loadDraftMessages();
                });
            }

            function alertDraft() {
                swal({
                    title: "Saved to Draft!",
                    text: "Successfully saved to draft"
                }, function () {
                    loadSentMessages();
                    loadDraftMessages();
                });
            }


            $scope.savedraft = function () {
                $scope.readmessage_status = "draft";
            }

            $scope.messageSent = function () {
                $scope.readmessage_status = "sent";
            }


        }
        else if ($state.current.name == 'dashboard_staff') {
            var userId = $scope.user._id;
            reviewService.getMyDaycares(userId)
                .then(function (mydaycare) {
                    $scope.mydaycares = mydaycare;
                    if ($scope.mydaycares.length <= 0) {
                        $('.pagination').hide();
                    }
                    $scope.range();
                    angular.forEach($scope.mydaycares, function (value, key) {
                        listingService.get({listingId: $scope.mydaycares[key].daycare_id}, function (response) {
                            $scope.mydaycares[key].daycare = response.listing;
                        });
                    });
                }, function (err) {
                    console.warn(err);
                });
        }
        else if ($state.current.name == 'dashboard_client') {
            console.log("Clients of: "+$scope.user._id);
            var userId = $scope.user._id;
            reviewService.getMyDaycares(userId)
                .then(function (mydaycare) {
                    $scope.mydaycares = mydaycare;
                    if ($scope.mydaycares.length <= 0) {
                        $('.pagination').hide();
                    }
                    $scope.range();
                    angular.forEach($scope.mydaycares, function (value, key) {
                        listingService.get({listingId: $scope.mydaycares[key].daycare_id}, function (response) {
                            $scope.mydaycares[key].daycare = response.listing;
                        });
                    });
                    if(!$scope.$$phase){
                        $scope.$apply();
                    }
                }, function (err) {
                    console.warn(err);
                });
            
            

        }
        else if ($state.current.name == 'dashboard_client_list') {
            var userId = $scope.user._id;
            

            
        }
        else if ($state.current.name == 'addStaff') {
            $scope.StaffListingId = $stateParams.listingId;

            self.staffEditMode = false;
            self.staffInfoObj = $stateParams.staffInfoObj;
            console.log(self.staffInfoObj);
            if(self.staffInfoObj!=null){
                /*console.log("$scope.staffObj._id NOT NULL");
                console.log($scope.StaffListingId);
                console.log($scope.staffInfoObj._id);*/
                self.staffEditMode = true;
                $scope.Staff = self.staffInfoObj;
                $scope.role.value = self.staffInfoObj.role;
            }
            
        }else if ($state.current.name  == 'dashboard_subscription') {
            console.log("dashboard_subscription");
            $scope.userSubscription = AuthService.getSubscription();
        }

        $scope.status = 'Save';
        $scope.result = '';
        var file = null;


        //console.log($scope.user);

        function scrollToElem() {
            if ($state.current.name == 'dashboard_edit_profile') {
                curr_anim = hackService.scrollAnim('select[name="title"]');
            } else if ($state.current.name == 'dashboard_edit_security_information') {
                curr_anim = hackService.scrollAnim('form[name="editQuestionForm"] select:first');
            }
        }

        function getSecurityQuestions() {
            securityQuestionsService.getListOfQuestions().then(
                function (response) {

                    var questions_arr = [];

                    angular.forEach(response.data, function (data) {
                        questions_arr.push(data);
                    });

                    questions_arr.sort();
                    questions_arr.unshift(sec_quest_place_holder);
                    $scope.securityQuestion[0] = questions_arr;
                    $scope.securityQuestion[1] = angular.copy(questions_arr);
                    $scope.securityQuestion[2] = angular.copy(questions_arr);

                    if ($scope.editUser.security_question.question1 != sec_quest_place_holder) {
                        $scope.secQuestSelected($scope.user.security_question.question1, 0);
                    }
                    if ($scope.editUser.security_question.question2 != sec_quest_place_holder) {
                        $scope.secQuestSelected($scope.user.security_question.question2, 1);
                    }
                    if ($scope.editUser.security_question.question3 != sec_quest_place_holder) {
                        $scope.secQuestSelected($scope.user.security_question.question3, 2);
                    }
                },
                function (err) {
                    console.log(err);
                }
            );
        }

        function b64ToFile(b64, mimeType, extName, skipDecode) {
            var binaryImg,
                ua;
            if (!skipDecode) {
                binaryImg = window.atob(b64.split(',')[1]);
                ua = new Uint8Array(new ArrayBuffer(binaryImg.length));
                for (var i = 0; i < ua.length; i++) {
                    ua[i] = binaryImg.charCodeAt(i);
                }
            } else {
                ua = b64;
            }
            return new Blob([ua], {type: mimeType, encoding: 'utf-8'});
        }

        function dateToMilli(date){
            var d = Date.parse(date.replace(/\u200E/g,''));
            d = new Date(d);
            return d;
        };

        
        self.dateToMilli = dateToMilli;
        $scope.dateToMilli = dateToMilli;

        function sendRevApprovalEmail(userId,daycare,review,msgType){
            //console.log("### SENDING EMAIL TO:"+JSON.stringify(userId)+" DAYCARE:"+JSON.stringify(daycareId)+" REVIEW:"+JSON.stringify(review)+" MSGTYPE:"+msgType+" ###");

            userService.get({userId:userId},function(_res){
            if(_res){
                var user = _res;
                console.log("USERREQ DONE");
                //console.log("### SENDING EMAIL TO:"+JSON.stringify(user)+" DAYCARE:"+JSON.stringify(daycare)+" REVIEW:"+JSON.stringify(review)+" MSGTYPE:"+msgType+" ###");
                var reqBody = {daycare:daycare,user:user,review:review,msgType:msgType};
                console.log(reqBody);

                userService.sendRevApprovalEmail(reqBody,function(__res){
                    //console.log("### EMAIL SENT RESPONSE ###");
                    //console.log(__res);
                    self.emailSent = __res;
                });

            } else {
                console.log("email:UserErr"+JSON.stringify(_res));
            }});
            /*listingService.get({listingId:daycareId},function(res){
                if(res.status==200){
                    var daycare = res.listing;

                    userService.get({userId:userId},function(_res){
                        if(_res.status==200){
                            var user = _res;
                            console.log("REQUESTS DONE");
                            var reqBody = {daycare:daycare,user:user,review:review,msgType:msgType};
                            console.log(reqBody);
                            userService.sendRevApprovalEmail(reqBody,function(__res){
                                console.log(__res);
                            });
                        } else {
                            console.log("email:UserErr"+JSON.stringify(_res));
                        }
                    });

                } else {
                    console.log("email:DaycareErr"+JSON.stringify(res));
                }
            });*/
            
            
        };

        self.sendRevApprovalEmail = sendRevApprovalEmail;

        $scope.onLoad = function () {
            $scope.getArticles();
            $scope.editUser.security_question = {
                question1: ($scope.user.security_question.question1 ? $scope.user.security_question.question1 : sec_quest_place_holder),
                question2: ($scope.user.security_question.question2 ? $scope.user.security_question.question2 : sec_quest_place_holder),
                question3: ($scope.user.security_question.question3 ? $scope.user.security_question.question3 : sec_quest_place_holder),
                answer1: ($scope.user.security_question.answer1 ? $scope.user.security_question.answer1 : ""),
                answer2: ($scope.user.security_question.answer2 ? $scope.user.security_question.answer2 : ""),
                answer3: ($scope.user.security_question.answer3 ? $scope.user.security_question.answer3 : "")
            }

            if ($scope.editUser.security_question.question1 == sec_quest_place_holder) {
                $scope.ans1Disabled = true;
            }
            if ($scope.editUser.security_question.question2 == sec_quest_place_holder) {
                $scope.ans2Disabled = true;
            }
            if ($scope.editUser.security_question.question3 == sec_quest_place_holder) {
                $scope.ans3Disabled = true;
            }

            console.log($scope.editUser);

            if (angular.isDefined($scope.user._id) && !$rootScope.email_changed) {
                swal.close();
            }
            
            scrollToElem();

            if (!curr_anim) {
                setTimeout(function () {
                    $("html, body").animate({scrollTop: 0}, 200);
                }, 1);
            } else {
                curr_anim = undefined;
            }

            if ($rootScope.email_changed) {
                $rootScope.email_changed = false;
                swal({
                    title: "Email Change Successful",
                    html: true,
                    text: "<p>You will now be logged out. Change in email address requires verification of your new address. " +
                    "We will send you an email with a link to verify that you own the new email address you provided. " +
                    "Email verification is an important and required step to keep your account secure.</p><br />" +
                    "<p>Please click Contact Us on top of this page to inquire about the status of your verification link if you do not receive it shortly. " +
                    "You will now be redirected to the Home Page. If you are not redirected in 20 seconds, please click OK below.</p>",
                    type: "success",
                    timer: 20000
                }, function () {
                    logout();
                });
            } else if ($rootScope.show_sms_modal) {
                $rootScope.show_sms_modal = false;
                setTimeout(function () {
                    var events;
                    $('#need-sms-verify').off('shown.bs.modal').on('shown.bs.modal', function () {
                        events = hackService.bindEscapeModalSeq(this);
                        hackService.allowSecondModalFocus();
                        $('#verifySMSInput').focus();
                    })
                    .off('hide.bs.modal').on('hide.bs.modal', function(e) {
                        hackService.unbindCustomEvents(events);
                    });
                    $('#sms-verify-btn').click();
                }, 1);
            }
        }

        $scope.togglePasswordsVisibility = function () {
            $scope.showPasswords = !$scope.showPasswords;
        }

        $scope.saveSecurityInformation = function (updated_info, editUserForm) {
            console.log(updated_info);
            if (!editUserForm.$valid) {
                setTimeout(function () {
                    var firstErrorElement = angular.element("[name='" + editUserForm.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    firstErrorElement.focus();
                    $("html, body").animate({scrollTop: firstErrorElement.offset().top - 300}, 1000);
                }, 1);

                return;
            }
            userService.saveSecurityInformation(updated_info).$promise.then(
                function (response) {
                    console.log(response);
                    // if(angular.isDefined(response.password_changed) && response.password_changed) {
                    $scope.status = 'Save';
                    $scope.result = '';
                    $scope.result_old_password = '';
                    $scope.editUser = angular.copy($scope.user);
                    $scope.showPasswordFields = true;
                    $scope.showPasswords = false;
                    $scope.submitted = false;
                    $scope.editUserForm.$setPristine();
                    swal({
                        title: 'Password Reset Successful',
                        text: 'This window will disappear in 10 seconds.  If it does not, click OK to close the window.',
                        type: 'success',
                        confirmButtonText: 'OK',
                        closeOnConfirm: true,
                        timer: 10000
                    });
                },
                function (err) {
                    if (err.status === 422) {
                        $scope.status = 'Save';
                        if (err.data.error.indexOf('Current password') > -1) {
                            $scope.result = '';
                            $scope.result_old_password = err.data.error;
                            var oldPasswInput = $('input[name="old_password"]').focus();
                            $("html, body").animate({scrollTop: oldPasswInput.offset().top - 300}, 1000);
                        } else {
                            $scope.result_old_password = '';
                            $scope.result = err.data.error;
                            $('input[name="new_password"]').focus();
                            $("html, body").animate({scrollTop: 0}, 1000);
                        }
                    }
                }
            );

        }

        $scope.updateSecurityQuestions = function (info, editQuestionForm) {
            var ans1Empty, ans2Empty, ans3Empty;

            $scope.submitted = false;

            var infoCopy = angular.copy(info);

            if (infoCopy.security_question.question1 != sec_quest_place_holder) {
                if (!infoCopy.security_question.answer1) ans1Empty = true;
            } else {
                infoCopy.security_question.question1 = '';
            }
            if (infoCopy.security_question.question2 != sec_quest_place_holder) {
                if (!infoCopy.security_question.answer2) ans2Empty = true;
            } else {
                infoCopy.security_question.question2 = '';
            }
            if (infoCopy.security_question.question3 != sec_quest_place_holder) {
                if (!infoCopy.security_question.answer3) ans3Empty = true;
            } else {
                infoCopy.security_question.question3 = '';
            }

            if (ans1Empty || ans2Empty || ans3Empty) {
                swal({
                    title: "Security Q&A Alert",
                    text: "You have selected one or more questions without corresponding responses. Please note that saving changes will result in deselection of questions without responses. Would you like to continue?",
                    type: 'warning',
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                    showLoaderOnConfirm: true
                }, function (isConfirm) {
                    if (isConfirm) {
                        if (ans1Empty) {
                            infoCopy.security_question.question1 = '';
                            info.security_question.question1 = sec_quest_place_holder;
                        }
                        if (ans2Empty) {
                            infoCopy.security_question.question2 = '';
                            info.security_question.question2 = sec_quest_place_holder;
                        }
                        if (ans3Empty) {
                            infoCopy.security_question.question3 = '';
                            info.security_question.question3 = sec_quest_place_holder;
                        }
                        updateSecInfo();
                    } else {
                        $('form[name="' + editQuestionForm.$name + '"]').find('input:enabled').each(function () {
                            if (!$(this).val()) {
                                hackService.scrollAnim(this);
                                return false;
                            }
                        });
                    }
                });
                hackService.scrollAnim('div.sweet-alert button.cancel');
            } else {
                updateSecInfo();
            }

            function updateSecInfo() {
                userService.update({
                    userId: $scope.user._id
                }, {security_question: infoCopy.security_question}, function () {
                    $scope.user = angular.copy(infoCopy);
                    AuthService.setUser($scope.user);

                    console.log('Update Success');
                    $scope.status = 'Save';
                    $scope.result = 'Success! Security Information Updated.';
                    $state.go('dashboard_security_information');
                }, function (err) {
                    $scope.result = 'Failure! Error ' + err.status;
                });
            }
        }

        $scope.secQuestSelected = function (question, pos) {
            if (question != sec_quest_place_holder) {
                switch (pos) {
                    case 0:
                        $scope.ans1Disabled = false;
                        break;
                    case 1:
                        $scope.ans2Disabled = false;
                        break;
                    case 2:
                        $scope.ans3Disabled = false;
                        break;
                }
                modifySecQuests(question, pos, true);
                used_sec_questions[pos] = question;
            } else {
                switch (pos) {
                    case 0:
                        $scope.editUser.security_question.answer1 = '';
                        $scope.ans1Disabled = true;
                        break;
                    case 1:
                        $scope.editUser.security_question.answer2 = '';
                        $scope.ans2Disabled = true;
                        break;
                    case 2:
                        $scope.editUser.security_question.answer3 = '';
                        $scope.ans3Disabled = true;
                        break;
                }
                modifySecQuests(question, pos);
            }

            function modifySecQuests(question, pos, delMode) {
                for (var i = 0; i < $scope.securityQuestion.length; i++) {
                    if (i != pos) {
                        if (used_sec_questions[pos]) {
                            $scope.securityQuestion[i].shift();
                            $scope.securityQuestion[i].push(used_sec_questions[pos]);
                            $scope.securityQuestion[i].sort();
                            $scope.securityQuestion[i].unshift(sec_quest_place_holder);
                        }

                        var index = $scope.securityQuestion[i].indexOf(question);
                        if (index > -1 && delMode) {
                            $scope.securityQuestion[i].splice(index, 1);
                        }
                    }
                }
                used_sec_questions[pos] = undefined;
            }
        }

        $scope.setSelectedUser = function (user) {
            console.log(user);
            localStorageService.set("selected_user", user);
        }

        $scope.checkNumber = function (){
            let data = {
                phoneNumber: $scope.editUser.contactNum,
                workNumber: $scope.editUser.workNum
            };
            $http.post('/api/edit_account_check_numbers', data, {
                headers: {'Content-Type': undefined},
                transformRequest: angular.identity
            }).then(function onSuccess(response) {
                console.log(response);
                return true;
            })
            .catch(function onError(response) {
                console.log(response);
                if (response.status === 508) {
                    swal({
                        html: true,
                        title: 'Home/Work number is already registered!',
                        text: "This number belongs to another user. Please provide another number.",
                        type: 'warning',
                        showconfirmbutton: true,
                    }, function (isconfirm) {
                        if (isconfirm) {
                            //$state.go('login');
                        }
                        hackService.scrollAnim("#txtEditMobileNum");
                    });
                }

                $scope.status = 'Save';
                $scope.result = 'Failure! Error ' + response.status;
                return;
            });
        }

        $scope.submitEditUser = function (editUserForm) {
            if (!editUserForm.$valid) {
                setTimeout(function () {
                    var firstErrorElement = angular.element("[name='" + editUserForm.$name + "']").find('[class*="ng-invalid"]:first');
                    firstErrorElement.focus();
                    firstErrorElement.trigger('phoneFocus');
                    $("html, body").animate({scrollTop: firstErrorElement.offset().top - 300}, 1000);
                }, 1);

                return;
            }

            $scope.status = 'Saving...';
            var uploadData = new FormData();
            if ($scope.imgChanged) {
                var blob = b64ToFile($scope.croppedDataUrl, 'image/png', '.png');
                console.log(blob);
                uploadData.append("photo", blob);
            }

            console.log($scope.editUser);
            uploadData.append("_id", $scope.editUser._id);
            uploadData.append("title", $scope.editUser.title != "Title" ? $scope.editUser.title : "");
            uploadData.append("firstName", $scope.editUser.firstName);
            uploadData.append("middleName", $scope.editUser.middleName ? $scope.editUser.middleName : "");
            uploadData.append("aliasName", $scope.editUser.aliasName ? $scope.editUser.aliasName : "");
            uploadData.append("lastName", $scope.editUser.lastName);
            uploadData.append("suffix", $scope.editUser.suffix != "Suffix" ? ($scope.editUser.suffix == "Other" ? $scope.editUser.otherSuffix : $scope.editUser.suffix) : "");
            uploadData.append("email", $scope.editUser.email);
            uploadData.append("contactNum", $scope.editUser.contactNum ? $scope.editUser.contactNum : "");
            uploadData.append("mobileNum", $scope.editUser.mobileNum);
            uploadData.append("workNum", $scope.editUser.workNum ? $scope.editUser.workNum : "");
            uploadData.append("sameAsHome", $scope.editUser.sameAsHome);
            var homeState = $scope.editUser.address.state != "State" ? $scope.editUser.address.state : "",
                homeCity = $scope.editUser.address.city ? $scope.editUser.address.city : "",
                homeStreet = $scope.editUser.address.street ? $scope.editUser.address.street : "",
                homeZip = $scope.editUser.address.zip ? $scope.editUser.address.zip : "",
                homePobox = $scope.editUser.address.pobox ? $scope.editUser.address.pobox : "",
                homeApt = $scope.editUser.address.apt ? $scope.editUser.address.apt : "";
            uploadData.append("address.state", homeState);
            uploadData.append("address.city", homeCity);
            uploadData.append("address.street", homeStreet);
            uploadData.append("address.zip", homeZip);
            uploadData.append("address.pobox", homePobox);
            uploadData.append("address.apt", homeApt);
            uploadData.append("username", $scope.editUser.email);
            uploadData.append("work_address.state", $scope.editUser.sameAsHome ? homeState : ($scope.editUser.work_address.state != "State" ? $scope.editUser.work_address.state : ""));
            uploadData.append("work_address.city", $scope.editUser.sameAsHome ? homeCity : ($scope.editUser.work_address.city ? $scope.editUser.work_address.city : ""));
            uploadData.append("work_address.street", $scope.editUser.sameAsHome ? homeStreet : ($scope.editUser.work_address.street ? $scope.editUser.work_address.street : ""));
            uploadData.append("work_address.zip", $scope.editUser.sameAsHome ? homeZip : ($scope.editUser.work_address.zip ? $scope.editUser.work_address.zip : ""));
            uploadData.append("work_address.pobox", $scope.editUser.sameAsHome ? homePobox : ($scope.editUser.work_address.pobox ? $scope.editUser.work_address.pobox : ""));
            uploadData.append("work_address.suite", $scope.editUser.sameAsHome ? homeApt : ($scope.editUser.work_address.suite ? $scope.editUser.work_address.suite : ""));
            uploadData.append("contactByEmail", $scope.editUser.contactByEmail);
            uploadData.append("contactBySms", $scope.editUser.contactBySms);

            $http.post('/api/upload-with-photo', uploadData, {
                headers: {'Content-Type': undefined},
                transformRequest: angular.identity
            }).then(function onSuccess(response) {
                if ($scope.imgChanged) {
                    console.log(response.data.user);
                    $scope.editUser.photo = 'assets/uploads/' + response.data.user.photo;
                }
                $rootScope.show_sms_modal = $scope.editUser.mobileNum != $scope.user.mobileNum;
                $rootScope.email_changed = $scope.editUser.email.toUpperCase() !== $scope.user.email.toUpperCase();
                if ($rootScope.show_sms_modal) {
                    $scope.editUser.phone_number_verified = 'false';
                }
                if ($rootScope.email_changed) {
                    $scope.editUser.status = 'pending';
                }
                AuthService.setUser($scope.editUser);
                if ($scope.imgChanged) {
                    $scope.imgChanged = false;
                    $rootScope.$broadcast('reload-user');
                }
                $scope.status = 'Save';
                $scope.result = 'Successfully saved!';
                $location.path('/dashboard/profile');
                return;
            })
                .catch(function onError(response) {
                    if (response.status === 508) {
                        swal({
                            html: true,
                            title: 'Cell number is already registered!',
                            text: "The cell number you provided belongs to another user. Please provide another number.",
                            type: 'warning',
                            showconfirmbutton: true,
                        }, function (isconfirm) {
                            if (isconfirm) {
                                //$state.go('login');
                            }

                            hackService.scrollAnim("#txtEditMobileNum");
                        });
                    } else if (response.status === 503) {
                        swal({
                            html: true,
                            title: 'Email is already registered!',
                            text: "The email you provided belongs to another user. Please provide another email.",
                            type: 'warning',
                            showconfirmbutton: true,
                        }, function (isconfirm) {
                            hackService.scrollAnim("#txtEditEmail");
                        });
                    } else if (response.status === 501) {
                        swal({
                            html: true,
                            title: 'Alias is already registered!',
                            text: "This alias has already been selected by another user. Please choose another alias.",
                            type: 'warning',
                            showconfirmbutton: true,
                        }, function (isconfirm) {
                            hackService.scrollAnim("#txtEditAlias");
                        });
                    } else if (response.status === 509) {
                        swal({
                            html: true,
                            title: 'Home/Work Number is already taken!',
                            text: "Home/Work Number belongs to another user! Please enter another number",
                            type: 'warning',
                            showconfirmbutton: true,
                        }, function (isconfirm) {
                            hackService.scrollAnim("#txtEditContactNum");
                        });
                    }
                    $scope.status = 'Save';
                    $scope.result = 'Failure! Error ' + response.status;
                    return;
                });
        }

        $scope.deleteUser = function (user) {
            console.log(user._id);

            swal({
                title: "Confirmation",
                text: "Are you sure you want to save this user?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }, function () {

                allUserService.deleteUser({_id: user._id}, function (response) {

                    var users = $scope.all_users;
                    $.each(users, function (i, obj) {
                        if (obj._id === user._id) {
                            $scope.all_users.splice(i, 1);
                            return false;
                        }
                    });

                    console.log(response);
                    swal("Deleted!", "User has been deleted.", "success");
                });

            });
        }

        $scope.imgSelected = function (img) {
            console.log(img);
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function ($scope) {
                    $scope.imgToCrop = evt.target.result;
                });
            };
            reader.readAsDataURL(img);
        }

        $scope.deleteOwnerRequest = function (ownerRequest) {
            console.log(ownerRequest._id);

            $scope.reqLoadingHash[ownerRequest._id+'delete'] = $scope.reqLoading = true;

            swal({
                title: "Confirm Deletion",
                text: "Are you sure you want to delete this ownership request?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                closeOnConfirm: true
            }, function (isConfirm) {
                if (isConfirm) {
                    ownershipService.delete({ownerRequestId: ownerRequest._id}, function (response) {

                        var ownerRequests = $scope.all_owner_requests;
                        $.each(ownerRequests, function (i, obj) {
                            if (obj._id === ownerRequest._id) {
                                $scope.all_owner_requests.splice(i, 1);
                                return false;
                            }
                        });

                        $scope.reqLoadingHash[ownerRequest._id+'delete'] = $scope.reqLoading = false;

                        console.log(response);
                        swal("Deleted!", "Ownership request has been deleted.", "success");
                    });
                } else {
                    $timeout(function(){
                        $scope.reqLoadingHash[ownerRequest._id+'delete'] = $scope.reqLoading = false;
                    });
                }
            });
        }

        $scope.approveReview = function (data, option,msgType) {
            console.log("OPTION : " + option);
            if(option===true){
                console.log("APPROVED REVIEW");
                data.approved = "true";
                delete data["daycare"];
            }
            if(option===false){
                console.log("REJECTED REVIEW");
                data.approved = "rejected";
                if(typeof(msgType)=='undefined'||msgType==null){
                    msgType = 0;
                }
                var daycare = angular.merge({},data.daycare);
                delete data["daycare"];
                console.log("sendData:" + JSON.stringify({userId:data.user_id,daycare:daycare,review:data,msgType:1}));
                sendRevApprovalEmail(data.user_id,daycare,data,msgType);
            }
            //delete data["daycare"];
            console.log(data);

            reviewService.updateReview(data)
                .then(
                    function (ret) {
                        console.log(ret);
                        swal({
                            title: "",
                            text: "Review successfully " + ((option === true) ? 'approved' : 'rejected') + "!"
                        }, function () {
                            $state.reload();
                        });
                    }
                );
        }

        $scope.activateUser = function (data, option) {
            data.status = option;

            var response = userService.activateUser(data,
                function () {
                    console.log(response);
                });
        }

        $scope.activateOwnerRequest = function (data, option) {
            $scope.reqLoadingHash[data._id+option] = $scope.reqLoading = true;

            var response = ownershipService.update({
                ownerRequestId: data._id
            }, {
                status: option,
                owner: {
                    _id: data.owner._id
                },
                listing: {
                    _id: data.listing._id
                }
            }, function () {
                data.status = option;
                if (option == 'approved') {
                    data.listing.owner_id = data.owner;
                } else {
                    data.listing.owner_id = null;
                }
                for (var i = 0; i < $scope.all_owner_requests.length; i++) {
                    var ownerReq = $scope.all_owner_requests[i];
                    if (ownerReq.listing._id === data.listing._id && ownerReq.owner._id !== data.owner._id) {
                        $scope.all_owner_requests.splice(i--, 1);
                    }
                }
                $scope.reqLoadingHash[data._id+option] = $scope.reqLoading = false;
            }, function (error) {
                swal("Error", error, "error");
            });
        }

        $scope.updateOwnerReqSufficient = function(ownerReq, key) {
            $scope.reqLoading = $scope.reqLoadingHash[ownerReq._id] = true;
            var data = {};
            data[key] = ownerReq[key];
            ownershipService.update({ownerRequestId:ownerReq._id}, data, function(resp) {
                $scope.reqLoading = $scope.reqLoadingHash[ownerReq._id] = false;
            }, function(err) {
                $scope.reqLoading = $scope.reqLoadingHash[ownerReq._id] = false;
                // revert to previous state as server errored out
                ownerReq[key] = !ownerReq[key];
                swal("Error", error, "error");
            });
        };

        $scope.getStaffList = function (listingId) {
            var staffList = [];
            console.log("Get Staff of: " + userId);
            userService.getStaff({listingId: listingId},
                function (_res) {
                    if (_res && _res.length > 0) {
                        console.log("Received Staff:" + JSON.stringify(_res));
                        _res.forEach(function (staff) {
                            staffList.push(staff);
                        })
                        console.log("Returning List: " + staffList.staffList);
                    }
                });

            return staffList;
        }

        // Moved to staffController
        $scope.submitAddStaff = function () {
            $scope.status = 'Saving...';
            $scope.Staff.role = $scope.role.value;
            $scope.Staff.listing_id = $stateParams.listingId;

            console.log("Adding Staff: " + $scope.Staff + " for " + $scope.Staff.listing_id);
            var data = {
                userId: AuthService.getUser()._id,
                staff: $scope.Staff
            }
            userService.addStaff(data, function (_res) {
                console.log("Staff Added");
                $state.go('dashboard_staff',{});
            });

            // clear entries
            $scope.Staff = {};


            /* IGNORE THIS FOR THE MOMENT
             if($("#selRole").val() != "" || $("#selRole").val() != undefined)
             {
             Staff.role = $("#selRole").val();
             }

             // $http.post('/api/upload-with-photo',uploadData, {
             // headers: {'Content-Type': undefined },
             // transformRequest: angular.identity
             // }).then(function onSuccess(response){
             // //$scope.editUser.photo = "";
             // AuthService.setUser($scope.editUser);
             // $scope.status = 'Save';
             // $scope.result = 'Successfully saved!';
             // $location.path('/dashboard/profile');
             // return;
             // })
             // .catch(function onError(response){
             // if(response.status === 508){
             // swal({
             // html:true,
             // title: 'Mobile number is already registered!',
             // text: "Input another mobile number.",
             // type: 'warning',
             // showconfirmbutton: true,
             // }, function(isconfirm) {
             // if (isconfirm) {
             // //$state.go('login');
             // }

             // setTimeout(function () {
             // $("#txtEditMobileNum").focus();
             // }, 1);
             // });
             // }
             // $scope.status = 'Save';
             // $scope.result = 'Failure! Error ' + response.status;
             // return;
             // });*/
        }

        $scope.removeStaff = function (listingId,staffObj) {
            var staffId = staffObj._id;
            swal({
                title: "Confirm Staff Removal",
                text: "Are you sure you want to remove " +staffObj.firstName + " " + staffObj.lastName + " ?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                //showLoaderOnConfirm: true
            }, function () {
                setTimeout(function () {
                    updateStaffList();
                    $state.reload();
                }, function (error) {
                    swal("Error", error, "error");
                });
            });
            

            var updateStaffList = function (){

                $scope.staffList = [];
            
                var userId = AuthService.getUser()._id;
                
                console.log("Removing Staff " + staffId + " from: " + userId);

                userService.removeStaff({userId: userId, listingId: listingId,staffId:staffId},
                    function(res){
                        console.log("ServerRemoveStaff");
                        console.log(res);
                    });
                
                userService.getStaff({listingId: listingId},
                    function (_res) {
                        if (_res) {
                            console.log("Received Staff:" + JSON.stringify(_res));
                            _res[0].staff.forEach(function (staff) {
                                $scope.staffList.push(staff);
                            })
                            //console.log("Updated List: " + JSON.stringify( $scope.staffList));
                        }
                    });

            }
            
            
        }


        // Moved to staffController
        $scope.updateStaff = function (staffObj,role) {
            console.log("updateStaff");
            staffObj.role = role.value;
            console.log(staffObj);
            console.log(role);
            var staffId = staffObj._id;
            var userId = AuthService.getUser()._id;
            swal({
                title: "Confirm Staff Update",
                text: "Are you sure you want to update " +staffObj.firstName + " " + staffObj.lastName + " ?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                showLoaderOnConfirm: true
            }, function () {
                setTimeout(function () {
                    update();
                    //$state.reload();
                    $state.go('dashboard_staff',{});
                }, function (error) {
                    swal("Error", error, "error");
                });
            });

            var update = function(){
                userService.updateStaff({userId: userId,staffObj:staffObj},
                    function(res){
                        console.log("ServerUpdateStaff");
                        console.log(res);
                    });
            }
        }

        $scope.populateWorkAddr = function () {

            if ($scope.editUser.sameAsHome) {
                $scope.editUser.work_address.pobox = $scope.editUser.address.pobox;
                $scope.editUser.work_address.street = $scope.editUser.address.street;
                $scope.editUser.work_address.suite = $scope.editUser.address.apt;
                $scope.editUser.work_address.city = $scope.editUser.address.city;
                $scope.editUser.work_address.state = $scope.editUser.address.state;
                $scope.editUser.work_address.zip = $scope.editUser.address.zip;
            }
        }

        $scope.zipCheck = function(data){
            data.mailing_address.zip = $scope.validateZip(data.mailing_address.zip);
            if(data.sameAsHome){
                data.work_address.zip=data.mailing_address.zip;
            }
        }

        $scope.uploadFile = function (files) {
            file = files[0];
        }

        $scope.clickBtn = function (id) {
            angular.element(id).click();
        }

        $scope.filter1 = function (item) {
            return (!($scope.editUser.security_question.question1 && $scope.editUser.security_question.question1) || item != $scope.editUser.security_question.question1);
        };

        $scope.filter2 = function (item) {
            return (!($scope.editUser.security_question.question2 && $scope.editUser.security_question.question2) || item != $scope.editUser.security_question.question2);
        };
        $scope.filter3 = function (item) {
            return (!($scope.editUser.security_question.question3 && $scope.editUser.security_question.question3) || item != $scope.editUser.security_question.question3);
        };

        $scope.itemsPerPage = 20;
        $scope.currentPage = 0;
        $scope.offsetValue = $scope.currentPage * $scope.itemsPerPage;

        $scope.range = function () {
            var rangeSize = 1;
            var ret = [];
            var start;

            if ($scope.all_users) {
                if ($scope.all_users.length > 20) {
                    rangeSize = Math.round($scope.all_users.length / 20);
                }
            } else if ($scope.daycares) {
                if ($scope.daycares.length > 20) {
                    rangeSize = Math.round($scope.daycares.length / 20);
                }
            } else if ($scope.reviews) {
                if ($scope.reviews.length > 20) {
                    rangeSize = Math.round($scope.reviews.length / 20);
                }
            }

            start = $scope.currentPage;

            if (start > $scope.pageCount() - rangeSize) {
                start = $scope.pageCount() - rangeSize + 1;
            }

            for (var i = start; i < start + rangeSize; i++) {
                ret.push(i);
            }

            $scope.no_items = ret;

        };

        $scope.pageCount = function () {
            var num = 0;

            if ($state.current.name == 'dashboard_users') {
                if ($scope.all_users) {
                    num = Math.ceil($scope.all_users.length / $scope.itemsPerPage) - 1;
                }
            } else if ($state.current.name == 'dashboard_all_daycares') {
                if ($scope.daycares) {
                    num = Math.ceil($scope.daycares.length / $scope.itemsPerPage) - 1;
                }
            } else if ($state.current.name == 'dashboard_all_reviews') {
                if ($scope.reviews) {
                    num = Math.ceil($scope.reviews.length / $scope.itemsPerPage) - 1;
                }
            }

            return num;
        };

        $scope.prevPage = function () {
            if ($scope.currentPage > 0) {
                $scope.currentPage--;
                $scope.offsetValue = $scope.currentPage * $scope.itemsPerPage;
            }
        };

        $scope.nextPage = function () {
            if ($scope.currentPage < $scope.pageCount()) {
                $scope.currentPage++;
                $scope.offsetValue = $scope.currentPage * $scope.itemsPerPage;
            }
        };

        $scope.prevPageDisabled = function () {
            return $scope.currentPage === 0 ? "disabled" : "";
        };

        $scope.nextPageDisabled = function () {
            return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
        };

        $scope.setPage = function (n) {
            $scope.currentPage = n;
        };

        $scope.validateZip = function (zip) {
            return zip.replace(/[^0-9]/g, '');
        }

        $scope.getFavorites = function () {
            var user = AuthService.getUser();
            if (user) {
                //console.log("Request Favorite");
                userService.getFavorites({userId: user._id}, function (_res) {
                    if (_res) {
                        console.log("Get Favorite: " + JSON.stringify(_res));
                        $scope.favorites = [];

                        _res[0].favorites.forEach(function (item, index) {
                            //$scope.favorites.push(item);
                            listingService.get({listingId: item.listingId}, function (listingRes) {
                                //console.log("Add Favorite: " + JSON.stringify(listingRes));
                                listingRes.listing.tmpIndex = index;
                                $scope.favorites.push(listingRes.listing);
								$scope.totalFaveDayCareCount = $scope.favorites.length;
                            });

                        });
						if(_res[0].favorites.length == 0)
						{
							$scope.totalFaveDayCareCount = 0;
						}
                        
                    }
                });
            }
        }

        $scope.removeFavorite = function(favorite){
           var user = AuthService.getUser();
            console.log("Remove Favorite " + JSON.stringify(favorite) );
			var txtMessage = "Are you sure you want to remove "+ favorite.name +" from your Favorites list?";
            swal({
              title: "Confirm Deletion",
              text: txtMessage,
              type: "warning",
              showCancelButton: true,
              confirmButtonText: "Delete",
              closeOnConfirm: true
            },
            function(){
                if (user) {
                    userService.removeFavorites({userId: user._id, favorites:favorite }, function (_res) {
                        $scope.getFavorites();
                    });
                }
            });
        }
        $scope.cancel = function (state) {
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
                    $state.go(state);
                } else {
                    // scrollToElem();
                }
            });
            hackService.scrollAnim('div.sweet-alert button.cancel');
        }
        $scope.getRating = function(avgRating){
            //console.log("RatingCalculated: "+avgRating);
            return Math.round(avgRating);
        }

        //display articles
        $scope.articles;
        $scope.getArticles = function(){
            articleService.get({userid:$scope.user._id}, function (response) {
                  $scope.articles = response.searchResult;
            });

        }
        $scope.removeHtmlTagsTitle = function(title){
            var length = 17;
            if(title.length > 15){
                var pre_title = title.substring(0, length);
                pre_title += "...";
                return pre_title;
            }else{
                return title;
            }
        }
        $scope.removeHtmlTagsContent = function(content){
            var content =  content.replace(/<(\/)?p[^>]*>/g,"");
            var length = 25;
            return content.substring(0, length);
        }
        $scope.removeArticle = function(id){
            var data = {
                id:id
            }
            swal({
              title: "Are you sure?",
              text: "You will not be able to recover this article!",
              type: "warning",
              showCancelButton: true,
              confirmButtonText: "Delete",
              closeOnConfirm: false
            },
            function(){
              articleService.remove(data);
              $scope.getArticles();
              swal("Removed!", "This article is removed!", "success");
            });
        }
        $scope.rankFavorite = function(listingId,addRank){
            var user = AuthService.getUser();
            //console.log("rankFavoriteParams: (" + listingId + ") User:"+angular.isDefined(user));
            userService.get({userId: user._id}, function(_res){
                if(_res){
                    //console.log("getUserFav:"+ JSON.stringify(_res.favorites));
                    var index = -1;
                    for(var i=0;i<_res.favorites.length;i++){
                        if(_res.favorites[i].listingId == listingId){
                            index = i;
                            break;
                        }
                    }
                    //console.log("Fav@:"+ index + " addRank:" + addRank);

                    if( ((addRank>0 && index<_res.favorites.length-1 ) || (addRank<0 && index>0)) &&index!=-1){
                        var arrCopy = [];
                        var tmp0 = {};
                        angular.copy(_res.favorites,arrCopy);
                        angular.copy(arrCopy[index],tmp0);
                        angular.copy(arrCopy[index+addRank],arrCopy[index]);
                        angular.copy(tmp0,arrCopy[index+addRank]);
                        angular.copy(arrCopy,_res.favorites);
                        $scope.favorites.length=0;
                        userService.update({userId: user._id},
                        _res,
                        function(__res){
                            //console.log("favUpdateRes: "+JSON.stringify(__res));
                            userService.getFavorites({userId: user._id}, function (_res) {
                                if (_res) {
                                    //$scope.favorites=[];
                                    var wait = function(){
                                        var defer = $q.defer();
                                        var tmpFav = [];
                                        for(var x=0; x<_res[0].favorites.length;x++){
                                            var xb = function(index){
                                                var cb = function(listingRes){
                                                    listingRes.listing.tmpIndex = index;
                                                    tmpFav.push(listingRes.listing);
                                                    if(_res[0].favorites.length == tmpFav.length){
                                                        defer.resolve(tmpFav);
                                                    }
                                                };
                                                return cb;
                                            };
                                            listingService.get({listingId: _res[0].favorites[x].listingId},xb(x));
                                        }
                                        return defer.promise;
                                    };

                                    wait()
                                    .then(function(tmpFav){
                                        console.log("getFavOK");
                                        $scope.favorites.length = 0;
                                        for(var x=0; x<tmpFav.length;x++){
                                            $scope.favorites.push(tmpFav[x]);
                                        }
                                    })
                                    .catch(function() {
                                        console.log("getFavNotDone");
                                    });
                                }

                            });
                        },
                        function(__err){
                            if(__err){
                                console.log("favUpdateErr: "+JSON.stringify(__err));
                            }
                        });
                    }else{
                        console.log("favRankInvalid");
                    }

                    
                }
            } );

            if(!$scope.$$phase){
                console.log("ReloadState");
                $state.reload();
                $scope.$apply();
            }


            
        }
		
		$scope.CheckTotalReviews = function(result){
			var ret = 1;
			if($scope.user == undefined && result.totalReviews == undefined)
			{
				ret = 1;
			}
			else if($scope.user == undefined && result.totalReviews !== undefined)
			{    
				ret = 1;
			}
			else if($scope.user == undefined && AuthService.isParentOrProvider())
			{
				ret = 1;
				$scope.reviewPath = window.location.origin+window.location.pathname+"#/listing/detail/";
			}
			else if(result.totalReviews == undefined && AuthService.isParentOrProvider())
			{
				ret = 1;
			}
			
			return ret;
		};

        function getClientList(daycareId){
            console.log("getClientList: "+daycareId);
            $state.go('dashboard_client_list',{daycareId:daycareId});
        }
        $scope.getClientList = getClientList;

        $scope.add_previous_page = function() {
            sessionStorage.setItem('prevChilCareListState', $state.current.name);
        }

        var markFeedbackComplete = function(feedbackId){
            //console.log("markFeedbackCompleteREQUEST");
            swal({
                title: "Mark Feedback Complete",
                text: "Mark Complete?",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                showLoaderOnConfirm: true
            }, function () {
                setTimeout(function () {
                    mark();
                    $state.reload();
                    //$state.go('dashboard_staff',{});
                }, function (error) {
                    swal("Error", error, "error");
                });
            });
            
            function mark(){
                AuthService.markFeedback(feedbackId,'complete')
                .then(function(res){
                    console.log("markFeedbackCompleteSUCCESS");
                    //console.log(res);
                },function(err){
                    console.log("markFeedbackCompleteERROR");
                    //console.log(err);
                });
            };           
        };
        self.markFeedbackComplete = markFeedbackComplete;

        $scope.onLoad();

    }]);


dashboardModule.filter('offset', function () {
    return function (input, start) {
        start = parseInt(start, 10);
        if (input) {
            return input.slice(start);
        }
    };
});


