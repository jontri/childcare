var reviewService = angular.module('reviewService', []);

reviewService.service('reviewService', ReviewService);

ReviewService.$inject = ['$http', '$q', 'API_ENDPOINT'];

function ReviewService($http, $q, API_ENDPOINT) {
    var reviewService = {
        submitReview: function(data) {
            if (data.photo) {
                delete data.photo;
            }

            console.log("Data sent to service: " + JSON.stringify(data));

            if(data.reviewInfo.reviewId){
                data.id = data.reviewInfo.reviewId;
                data._id = data.reviewInfo.reviewId;
            }

            var defer = $q.defer();
            $http.post(API_ENDPOINT + '/review', data)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        addTagReview: function(reviewId, uId, tag) {

            var defer = $q.defer();
            $http.post(API_ENDPOINT + '/review-vote', {review:reviewId, user:uId, vote:tag})
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        removeTagReview: function(reviewId, uId, tag) {
            
            var defer = $q.defer();
            $http.delete(API_ENDPOINT + '/review-vote?review=' + reviewId + '&uId=' + uId )
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        deleteReview: function(reviewId) {
            var defer = $q.defer();
            $http.post(API_ENDPOINT + '/delete_review/'+ reviewId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        getReviews: function(listingId, uId) {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/review/' + listingId + '?uId=' + uId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },
		
		getApprovedReviews: function(listingId)
		{
			var defer = $q.defer();
            $http.get(API_ENDPOINT + '/approved_reviews/' + listingId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
		},

        updateRatingAverage: function(listingId)
        {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/updateRatingAverage/' + listingId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        getPendingReview: function(reviewId){
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/pending_review/' + reviewId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        getReview: function(reviewId){
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/get_review/' + reviewId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        getAllReviews: function() {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/all_reviews')
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        getEveryReviews: function() {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/every_reviews')
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        updateReview: function(data) {
            var defer = $q.defer();
            $http.post(API_ENDPOINT + '/updateReview', data)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },
        
		getMyReviews: function(userId) {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/my_reviews/' + userId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

        getUserReviewDaycare: function(userId,listingId) {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/user_review_daycare/' + userId+'/'+listingId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },

		getMyDaycares: function(userId){
			var defer = $q.defer();
            $http.get(API_ENDPOINT + '/my_daycares/' + userId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
		},
        getDaycare: function(daycareId){
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/daycare/' + daycareId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },
		getMyReviewsOwned: function(userId,listingId) {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/my_reviewsOwned/' + userId + '/' + listingId)
                .then(function(response) {
                    defer.resolve(response.data);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },
        sendReply: function(reviewId, message) {
            var defer = $q.defer();
            $http.post(API_ENDPOINT + '/review/' + reviewId + '/reply', message)
                .then(function(response) {
                    defer.resolve(response);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },
        getReplies: function(reviewId, params) {
            var defer = $q.defer();
            $http.get(API_ENDPOINT + '/review/' + reviewId + '/reply', {params: params})
                .then(function(response) {
                    defer.resolve(response);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        },
        updateReply: function(replyId, message) {
            var defer = $q.defer();
            $http.put(API_ENDPOINT + '/reply/' + replyId, message)
                .then(function(response) {
                    defer.resolve(response);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        }
    };

    return reviewService;

}