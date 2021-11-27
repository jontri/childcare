var reviewController = angular.module('reviewController', []);

reviewController.controller('reviewCtrl', Review);

Review.$inject = ['AuthService', 'reviewService', '$state', '$stateParams', '$cookies','$scope','listingService','hackService'];

function Review(AuthService, reviewService, $state, $stateParams,$cookies, $scope,listingService, hackService) {
    var self = this;

    self.updateReviewMode = false;

    initForm();

    onLoad();

    // Load previously made review and update
    loadReview();

    function onLoad() {
        if (!AuthService.isAuthenticated()) {
            swal({
                title: "Please Login!",
                text: "Credentials needed inorder to write review!",
                type: 'info',
                closeOnConfirm: true,
                confirmButtonText: 'Login now'
            }, function() {
                setTimeout(function() {
                    $state.go('home');
                }, 1000);
            });
        }
        // add this url to cookies if user accessed this from daycare details
        //if($cookies.get("tmpUrl")=="daycare_detail")$cookies.put("tmpUrl","review");
    }

    function initForm(){
        self.reviewForm = {
            name : '',
            safetyRate: 0,
            safetyComment: '',
            facilitiesRate: 0,
            facilitiesComment: '',
            staffRate: 0,
            staffComment: '',
            educationRate: 0,
            educationComment: '',
            overAllRate: 0,
            overAllComment : ''

        };

        self.formValidate = {
            safety     :{rateRequired:true,commentRequired:true,errRate:"",errComment:""},
            facilities :{rateRequired:true,commentRequired:true,errRate:"",errComment:""},
            staff      :{rateRequired:true,commentRequired:true,errRate:"",errComment:""},
            education  :{rateRequired:true,commentRequired:true,errRate:"",errComment:""},
            overAll    :{rateRequired:true,commentRequired:true,errRate:"",errComment:""}
        };
    }

    self.reviewFormError = {};
    self.formData = {};

    self.hasError = function() {
        var errBool = false;

        // if(self.formValidate.overAll.rateRequired){
        //     if(self.reviewForm.overAllRate===0||self.reviewForm.overAllRate==null||typeof(self.reviewForm.overAllRate)==='undefined'){
        //         self.formValidate.overAll.errRate="Required";
        //         errBool = true;
        //     }
        // }

        if(self.formValidate.safety.rateRequired){
            if(typeof(self.reviewForm.safetyRate)==='undefined' || self.reviewForm.safetyRate===0 || self.reviewForm.safetyRate==null){
                self.formValidate.safety.errRate="Required";
                errBool = true;
            }
            
        }
        if(self.formValidate.safety.commentRequired){
            if(self.reviewForm.safetyComment.length===0||self.reviewForm.safetyComment==null){
                self.formValidate.safety.errComment="Required - to make the review meaningful to other users";
                errBool = true;
            }

        }

        if(self.formValidate.facilities.rateRequired){
            if(typeof(self.reviewForm.facilitiesRate)==='undefined' || self.reviewForm.facilitiesRate===0 || self.reviewForm.facilitiesRate==null){
                self.formValidate.facilities.errRate="Required";
                errBool = true;
            }
            
        }
        if(self.formValidate.facilities.commentRequired){
            if(self.reviewForm.facilitiesComment.length===0||self.reviewForm.facilitiesComment==null){
                self.formValidate.facilities.errComment="Required - to make the review meaningful to other users";
                errBool = true;
            }
            
        }

        if(self.formValidate.staff.rateRequired){
            if(typeof(self.reviewForm.staffRate)==='undefined' || self.reviewForm.staffRate===0 || self.reviewForm.staffRate==null){
                self.formValidate.staff.errRate="Required";
                errBool = true;
            }
            
        }
        if(self.formValidate.staff.commentRequired){
            if(self.reviewForm.staffComment.length===0||self.reviewForm.staffComment==null){
                self.formValidate.staff.errComment="Required - to make the review meaningful to other users";
                errBool = true;
            }
            
        }

        if(self.formValidate.education.rateRequired){
            if(typeof(self.reviewForm.educationRate)==='undefined' || self.reviewForm.educationRate===0 || self.reviewForm.educationRate==null){
                self.formValidate.education.errRate="Required";
                errBool = true;
            }
            
        }
        if(self.formValidate.education.commentRequired){
            if(self.reviewForm.educationComment.length===0||self.reviewForm.educationComment==null){
                self.formValidate.education.errComment="Required - to make the review meaningful to other users";
                errBool = true;
            }
            
        }

        if(self.formValidate.overAll.rateRequired){
            if(typeof(self.reviewForm.overAllRate)==='undefined' || self.reviewForm.overAllRate===0||self.reviewForm.overAllRate==null){
                self.formValidate.overAll.errRate="Required";
                errBool = true;
            }
            
        }
        if(self.formValidate.overAll.commentRequired){
            if(self.reviewForm.overAllComment===""||self.reviewForm.overAllComment==null){
                self.formValidate.overAll.errComment="Required - to make the review meaningful to other users";
                errBool = true;
            }
            
        }

        return errBool;
    };

    $('#safety-rating').rating(function(vote, event) {
        self.reviewForm.safetyRate = vote;
    });

    $('#facilities-rating').rating(function(vote, event) {
        self.reviewForm.facilitiesRate = vote;
    });

    $('#staff-rating').rating(function(vote, event) {
        self.reviewForm.staffRate = vote;
    });

    $('#education-rating').rating(function(vote, event) {
        self.reviewForm.educationRate = vote;
    });

    function isError(errObj) {
        if (Object.keys(errObj).length > 0) {
            return true;
        }
        return false;
    }

    /*@param  String - Draft or Complete */
    function constructData(type) {
        var divisor = 1;
        
        self.reviewForm.avgRating = 0;
        self.reviewForm.avgRating += self.reviewForm.overAllRate; 

        /*if(self.reviewForm.safetyRate>0) 
        {
            self.reviewForm.avgRating += self.reviewForm.safetyRate; 
            divisor+=1
        }
        if(self.reviewForm.facilitiesRate>0) 
        {
            self.reviewForm.avgRating += self.reviewForm.facilitiesRate; 
            divisor+=1
        }
        if(self.reviewForm.staffRate>0) 
        {
            self.reviewForm.avgRating += self.reviewForm.staffRate; 
            divisor+=1
        }
        if(self.reviewForm.educationRate>0) 
        {
            self.reviewForm.avgRating += self.reviewForm.educationRate; 
            divisor+=1
        }
        self.reviewForm.avgRating = (self.reviewForm.avgRating/divisor).toFixed(2);
        */

        console.log("Review form: " + JSON.stringify(self.reviewForm));
        return {
            user_id: self.userData._id,
            daycare_id: self.listingData._id,
            approved: (self.review) ? self.review.approved : false,
            reviewInfo: self.reviewForm,
            remarks: type,
            dateSaved: new Date()
        };
    }


    self.submitReview = function() {

        console.log("AttemptSubmit: "+JSON.stringify(self.reviewForm));
        //self.reviewFormError = self.hasError();

        if (self.hasError()) {
            // swal({
            //     title: "Missing Fields",
            //     text: "You can provide meaningful feedback for others.",
            //     timer: 5000,
            //     showConfirmButton: true,
            //     confirmButtonText: "Close",
            //     allowOutsideClick: true,
            //     animation: 'slide-from-bottom',
            //     closeOnConfirm: true,
            // }, function() {
            //     setTimeout(function() {
            //
            //         if( (self.reviewForm.safetyRate == 0 ||  !self.reviewForm.safetyComment) && self.formValidate.safety.rateRequired){
            //             $("#safetyText").focus();
            //         } else if( (self.reviewForm.facilitiesRate == 0 || !self.reviewForm.facilitiesComment)  && self.formValidate.facilities.rateRequired){
            //             $("#facilitiesText").focus();
            //         } else if( (self.reviewForm.staffRate == 0 ||!self.reviewForm.staffComment) && self.formValidate.staff.rateRequired){
            //             $("#staffText").focus();
            //         } else if( (self.reviewForm.educationRate == 0 ||!self.reviewForm.educationComment) && self.formValidate.education.rateRequired){
            //             $("#educationText").focus();
            //         } else if( self.reviewForm.overAllRate == 0 || !self.reviewForm.overAllComment){
            //             $("#overAllText").focus();
            //         }
            //     }, 100);
            // });

            if (self.formValidate.safety.rateRequired) {
                if (self.reviewForm.safetyRate == 0) {
                    return hackService.scrollAnim('#safetyRate');
                } else if(!self.reviewForm.safetyComment){
                    return hackService.scrollAnim('#safetyText');
                }
            }
            if (self.formValidate.facilities.rateRequired) {
                if (self.reviewForm.facilitiesRate == 0) {
                    return hackService.scrollAnim('#facilitiesRate');
                } else if(!self.reviewForm.facilitiesComment){
                    return hackService.scrollAnim('#facilitiesText');
                }
            }
            if (self.formValidate.staff.rateRequired) {
                if (self.reviewForm.staffRate == 0) {
                    return hackService.scrollAnim('#staffRate');
                } else if(!self.reviewForm.staffComment){
                    return hackService.scrollAnim('#staffText');
                }
            }
            if (self.formValidate.education.rateRequired) {
                if (self.reviewForm.educationRate == 0) {
                    return hackService.scrollAnim('#educationRate');
                } else if(!self.reviewForm.educationComment){
                    return hackService.scrollAnim('#educationText');
                }
            }
            if (self.formValidate.overAll.rateRequired) {
                if (self.reviewForm.overAllRate == 0) {
                    return hackService.scrollAnim('#overAllRate');
                } else if(!self.reviewForm.overAllComment){
                    return hackService.scrollAnim('#overAllText');
                }
            }

        } else {
            swal({
                title: "Confirm Review Submission",
                text: "Are you sure you want to submit this review?\n\nNote: Your image and alias will be posted with this review upon approval. You can change your image or alias by visiting Account Information on your Dashboard.",
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                showLoaderOnConfirm: true
            }, function() {
                setTimeout(function() {
                    var data = constructData('complete');
                    // if rejected or approved change to pending
                    if (data.approved === true || data.approved === 'true' || data.approved === 'rejected')
                        data.approved = false;
                    if (self.updateReviewMode) data._id = self.review._id;
                    var promise = (self.updateReviewMode) ? reviewService.updateReview(data) : reviewService.submitReview(data);

                    promise.then(function(response) {
                        setTimeout(function() {
                            //@todo conditionally go back to listing detail or to dashboard review when editing a review
                            returnToPreviousPage();
                            /*$state.go('listingDetail', {
                                listingId: self.listingData._id
                            });*/
                        }, 100);
                    }, function(error) {
                        swal("Error", error, "error");
                    });
                }, 1500);
            });
        }
    };

    self.cancelReview = function() {

        console.log("Cancelling Review: "+JSON.stringify(self.reviewForm));

        swal({
            title: "Cancel " + (self.updateReviewMode ? "Changes" : "Review") + "?",
            // text: "Are you sure you want to cancel writing a review?",
            type: 'warning',
            showCancelButton: true,
            showConfirmButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: "No",
        }, function() {
            setTimeout(function() {

                returnToPreviousPage();

            }, 100);
        });
        hackService.scrollAnim('div.sweet-alert button.cancel', true);
    };

    function returnToPreviousPage(){
        
        if( $cookies.get("tmpUrl")=="daycare_detail" ){
            $cookies.put("tmpUrl","review");
            $state.go('listingDetail', {
                listingId: self.listingData._id
            });
        }

        if( $cookies.get("tmpUrl")=="search" ){
            $state.go('search');
        }

        if( $cookies.get("tmpUrl")=="dashboard_reviews" ){
            $state.go('dashboard_reviews');
        }
    }

    function loadReview(){
        console.log("loadReview Execute: "+JSON.stringify($stateParams));

        self.userData = AuthService.getUser();

        if($stateParams.reviewId!=null && $stateParams.reviewId!=''){

            console.log("### reviewId: "+$stateParams.reviewId+ " ###");
            console.log("### daycareId: "+$stateParams.daycareId+ " ###");

            self.updateReviewMode = true;
            //console.log("### Reviewing: "+$stateParams.reviewId+" ###");
            reviewService.getReview($stateParams.reviewId).then(function(_res){
                var review = _res[0].reviewInfo;

                console.log("RESPONSE: "+JSON.stringify(review));

                self.review = _res[0];
                self.reviewForm = {
                    name : review.overAllRate.name,
                    overAllRate : review.overAllRate,
                    overAllComment : review.overAllComment,
                    safetyRate: review.safetyRate,
                    safetyComment: review.safetyComment,
                    facilitiesRate: review.facilitiesRate,
                    facilitiesComment: review.facilitiesComment,
                    staffRate: review.staffRate,
                    staffComment: review.staffComment,
                    educationRate: review.educationRate,
                    educationComment: review.educationComment,
                    //generalRate: review.generalRate,
                    //generalComment: review.generalComment,
                    reviewId: $stateParams.reviewId
                };

                if(self.reviewForm.safetyRate===0&&self.reviewForm.safetyComment===""){
                    self.formValidate.safety.rateRequired = false;
                    self.formValidate.safety.commentRequired = false;

                }
                if(self.reviewForm.facilitiesRate===0&&self.reviewForm.facilitiesComment===""){
                    self.formValidate.facilities.rateRequired = false;
                    self.formValidate.facilities.commentRequired = false;
                    
                }
                if(self.reviewForm.staffRate===0&&self.reviewForm.staffComment===""){
                    self.formValidate.staff.rateRequired = false;
                    self.formValidate.staff.commentRequired = false;
                    
                }
                if(self.reviewForm.educationRate===0&&self.reviewForm.educationComment===""){
                    self.formValidate.education.rateRequired = false;
                    self.formValidate.education.commentRequired = false;
                    
                }
            });
        }

        if($stateParams.daycareId!=null && $stateParams.daycareId!=''){
            listingService.get({ listingId:$stateParams.daycareId }, function(response) {


                if( response.listing ){
                    reviewService.listingData = response.listing;
                    self.listingData = reviewService.listingData;
                }

            });
        }
        else {
            self.listingData = reviewService.listingData;
        }
    };

    $scope.skipSafety = function(){
        self.formValidate.safety.rateRequired = (!self.formValidate.safety.rateRequired)?true:false;
        self.formValidate.safety.commentRequired = (!self.formValidate.safety.commentRequired)?true:false;
        self.reviewForm.safetyRate = 0;
        self.reviewForm.safetyComment = "";
        $scope.computeAvgOverall();

    };
    $scope.skipFacilities = function(){
        self.formValidate.facilities.rateRequired = (!self.formValidate.facilities.rateRequired)?true:false;
        self.formValidate.facilities.commentRequired = (!self.formValidate.facilities.commentRequired)?true:false;
        self.reviewForm.facilitiesRate = 0;
        self.reviewForm.facilitiesComment = "";
        $scope.computeAvgOverall();

    };
    $scope.skipStaff = function(){
        self.formValidate.staff.rateRequired = (!self.formValidate.staff.rateRequired)?true:false;
        self.formValidate.staff.commentRequired = (!self.formValidate.staff.commentRequired)?true:false;
        self.reviewForm.staffRate = 0;
        self.reviewForm.staffComment = "";
        $scope.computeAvgOverall();

    };
    $scope.skipEducation = function(){
        self.formValidate.education.rateRequired = (!self.formValidate.education.rateRequired)?true:false;
        self.formValidate.education.commentRequired = (!self.formValidate.education.commentRequired)?true:false;
        self.reviewForm.educationRate = 0;
        self.reviewForm.educationComment = "";
        $scope.computeAvgOverall();
    };

    $scope.computeAvgOverall = function(){
        var divisor = 0;
        var dividend = 0;
        if(self.reviewForm.safetyRate > 0){
            dividend += self.reviewForm.safetyRate;
            divisor +=1;
        }
        if(self.reviewForm.facilitiesRate > 0){
            dividend += self.reviewForm.facilitiesRate;
            divisor +=1;
            
        }
        if(self.reviewForm.staffRate > 0){
            dividend += self.reviewForm.staffRate;
            divisor +=1;
            
        }
        if(self.reviewForm.educationRate > 0){
            dividend += self.reviewForm.educationRate;
            divisor +=1;
            
        }

        self.reviewForm.overAllRate = Math.round(dividend / divisor);
        if (isNaN(self.reviewForm.overAllRate))
            self.reviewForm.overAllRate = 0;

    };

    //console.log("Checking: "+JSON.stringify(self.reviewForm));
    console.log("self.listingData: "+self.listingData);
    console.log("$stateParams: reviewId ## "+JSON.stringify($stateParams.reviewId)+" ##");

}