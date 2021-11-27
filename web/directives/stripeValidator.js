(function() {
    angular.module('routerApp')
           .directive('stripeValidator', stripeValidator);

    stripeValidator.$inject = ['$http', 'API_ENDPOINT'];

    function stripeValidator($http, API_ENDPOINT) {
        return {
            restrict: 'A',
            template: `
              <div id="stripe-wrapper">
                <div id="card-element"></div>
              </div>
              <small id="card-errors" class="text-danger" role="alert">{{ ccErrMsg }}</small>
              <input type="hidden" name="stripeToken" ng-value="stripeToken" />`,
            scope: {
              'stripeFormId': '@',
              'stripeError': '=',
              'stripeToken': '=',
            },
            link: function(scope, element, attrs) {
              // publishable key
              var stripe = Stripe('pk_test_qqwG6EUQSJhzkEFObjDtgtAT');
              var elements = stripe.elements();
              var card = elements.create('card');
              var form = document.getElementById(scope.stripeFormId);
        
              // mount card element https://stripe.com/docs/stripe-js/reference#element-mount
              card.mount('#card-element');
              
              card.addEventListener('change', function(event) {
                if (event.error) {
                  scope.ccErrMsg = event.error.message;
                } else {
                  scope.ccErrMsg = '';
                }
                
                scope.stripeComplete = event.complete ? true : false;
                scope.$apply();
              });
              
              form.addEventListener('submit', function(event) {
                event.preventDefault();
                
                stripe.createToken(card).then(function(result) {                
                  if (result.error) {
                      scope.ccErrMsg = event.error.message;
                      scope.stripeToken = '';
                  } else {
                      scope.ccErrMsg = '';
                      var token = result.token;

                      // Should be transfered into it's own service
                      $http.post(API_ENDPOINT + '/subscribe', {
                          stripeDetails: token,
                          email: scope.$parent.user.email,
                          plan: 'premium_monthly'
                      }).then(function (response) {
                          console.log(response);                              
                      }, function (err) {
                          console.log(err);
                      });
                  }
                });
              });
            }
          }
    }
}());