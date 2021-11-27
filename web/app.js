// Instantiate modules
angular.module('rvFilters', []);
angular.module('rvConstants', []);
angular.module('rvServices', []);
angular.module('rvComponents', []);
angular.module('rvDirectives', []);

// app.js
var routerApp = angular.module('routerApp', [
  'ui.router', 'satellizer', 'LocalStorageModule', 'ngMessages', 'ngSanitize', 'ngCookies', 'ngAnimate', 'ngFileUpload',
  'ngImgCrop','ngPDFViewer', 'ui.bootstrap','angular-stripe', 'userController', 'registerController', 'listingController', 'reviewController', 'dashboardController',
  'articleController', 'searchService', 'userService', 'listingService', 'reviewService', 'stateService', 'memberService', 'providerService', 'allUserService',
  'vsGoogleAutocomplete','clientService','appointmentService','appointmentController','articleService','classService','documentService','rvFilters',
  'rvConstants','rvServices','rvComponents','rvDirectives', 'broadcastService'
]);

routerApp.run(function (AuthService, AutoLogoutService, SystemAlertService, $state, $rootScope, $cookies, $window) {
  var rvUser = AuthService.getUser();

  if (rvUser) {
    AuthService.saveSession(rvUser);
  }

  // make sure storage listener is only added once
  if (!$rootScope.isStorageListenerActive) {
    var isIE = navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
    // Communicate between tabs using localStorage
    var localStorageEvents = function(event) {
      if(!event) { event = window.event; } // ie suq
      if (event.key === 'logout' && !$rootScope.noRedirectToHome) {
        if ($state.current.name !== 'home') {
          $state.go('home');
        } else {
          $state.reload();
        }
      }
    };
    // listen for changes to localStorage
    if(window.addEventListener) {
      window.addEventListener("storage", localStorageEvents, false);
    } else {
      window.attachEvent("onstorage", localStorageEvents);
    }
    $rootScope.isStorageListenerActive = true;
  }

  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {


    // console.log("From State: " + fromState.name + " toState: " + toState.name);

    // focus on daycare search input when homepage is visited for the first time
    if (toState.name === 'home') {
      var id = setInterval(tryFocus, 100);

      function tryFocus() {
        if ( (fromState.name == 'changePassword' || fromState.name == 'forgotPassword') && $('input#email_login').focus().length) {
          clearInterval(id);
        } else if ($('input#homeTxtDayCare').focus().length) {
          clearInterval(id);
        }
      }
    }

    if (toState.name !== 'search' && toState.name !== 'writeReview' && toState.name !== 'listingDetail' && toState.name !== 'daycare_appointment' && toState.name !== 'ownershipUploads') {
      localStorage.removeItem('SearchItem');
      //localStorage.setItem('advance-daycare-status', 0);
    }

    if (toState.name !== 'dashboard_daycares_owner_request' && toState.name !== 'ownershipUploads') {
      localStorage.removeItem('DashboardSearchItem');
    }

    // set cookie visit Thu, 01 Jan 1970 00:00:00 GMT
    if (angular.isUndefined($cookies.get('rt_visit'))) $cookies.put('rt_visit', true);

    // flag to determine if subheader should be displayed on page
    $rootScope.includeSubheader = angular.isDefined(toState.data) && toState.data.includeSubheader;
    if ($rootScope.includeSubheader) {
      $rootScope.subHeaderContent = toState.data.subHeaderContent;
    }

    $rootScope.hideLoginPopup = false;
    $rootScope.hideRegisterPopup = false;

    //if user is authenticated
    if (AuthService.isAuthenticated()) {

      var authorizedRoles = angular.isDefined(toState.data) && toState.data.authorizedRoles;

      if(!AutoLogoutService.isStarted()){
        console.log("AutoLogout is not started... restarting");
        AutoLogoutService.start();
      }

        // if(!SystemAlertService.isStarted()){
        //     console.log("SystemAlert is not started... restarting");
        //     SystemAlertService.start();
        // }

        if (angular.isDefined(authorizedRoles) && authorizedRoles !== false) {
        var isAuthorized = AuthService.isAuthorized(authorizedRoles);

        if (!isAuthorized) {
          console.log('redirecting to dashboard home');
          $state.go('home');
          event.preventDefault();
          return;
        }

      }

      // compare email user to current user
      if (toState.data && toState.data.authCheck) {
        if (toParams.email && AuthService.isAuthenticated() && toParams.email !== AuthService.getUser().email) {
          AuthService.logout(true);
        }
      }

    }

    if ($cookies.get('rt_visit') == 'true') {

      // Lightbox FadeIn
      setTimeout(function () {

        // document.getElementById('lightbox').style.display = 'inline';

        // Change Welcome message to 'Welcome Back (username)'
        if (angular.isUndefined($cookies.get('rt_loggedin')) && $cookies.get('rt_loggedin') == 'true') {
          $('#lightbox .message').text(' Welcome Back ' + AuthService.getUser(response.data.username));
        }

        $cookies.put('rt_visit', false);

        // Lightbox FadeOut
        setTimeout(function () {
          // $('#lightbox').fadeOut();

        }, 5000);

      }, 100);

    }

    // Remove Cookie rt_visit
    window.onbeforeunload = function (e) {
      $cookies.remove('rt_visit');
    };

  });
});

routerApp.constant('API_ENDPOINT', '/api');

routerApp.constant('USER_ROLES', {
  all: '*',
  admin: 'admin',
  owner: 'owner',
  parent: 'parent',
  customer: 'customer',
  manager: 'manager',
  editor: 'editor'
});

routerApp.config(function ($stateProvider, $urlRouterProvider, $authProvider, stripeProvider, API_ENDPOINT, USER_ROLES) {

  $urlRouterProvider.otherwise('/home');
  $authProvider.loginUrl = API_ENDPOINT + '/login';

  $stateProvider

  // abstract states
      .state('private', {
        abstract: true,
        views: {
          // the main template
          '': {
            templateUrl: 'templates/private.tpl.html'
          },
          'navbar@private': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },

          'footer@private': {
            templateUrl: 'footer.html'
          },
		  
		  'auditlog@private':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })

      .state('dashboard_admin', {
        abstract: true,
        views: {
          '': {
            templateUrl: 'templates/dashboard.tpl.html'
          },
          'navbar-main@dashboard_admin': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },

          'navbar@dashboard_admin': {
            templateUrl: 'navbar_dashboard.html'
          },

          'dashboard_sidemenu@dashboard_admin': {
            templateUrl: 'dashboard_sidemenu.html',
            controller: 'dashboardCtrl as dashboard_ctrl'
          },
          'footer@dashboard_admin': {
            templateUrl: 'footer.html'
          },
		  'auditlog@dashboard_admin':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })

      .state('public', {
        abstract: true,
        views: {
          '': {
            templateUrl: 'templates/public.tpl.html'
          },
          'navbar@public': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },

          'footer@public': {
            templateUrl: 'footer.html'
          },
		  'auditlog@public':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        },
        data: {
          includeSubheader: true
        }
      })

      .state('simple', {
          abstract: true,
          views: {
              '': {
                  templateUrl: 'templates/simple.tpl.html'
              }
          }
      })

      // .state('manageDaycare', {
      //   parent: 'private',
      //   url: '/manage/daycare',
      //   templateUrl: 'manage_daycare.html',
      //   controller: 'listingCtrl',
      //   data: {
      //     authorizedRoles: [USER_ROLES.owner]
      //   }
      // })

      .state('manageDaycare', {
        parent: 'dashboard_admin',
        url: '/dashboard/listing/manageDaycare/:listingId',
        templateUrl: 'manage_daycare.html ',
        controller: 'listingCtrl as listing_ctrl'
      })

      

      .state('logout', {
        parent: 'private',
        url: '/logout',
        controller: 'authCtrl as auth_ctrl'
      })

      // *****************  HOME STATES *************************

      .state('home', {
        url: '/home',
        views: {

          // the main template will be placed here (relatively named)
          '': {
            templateUrl: 'home.html',
            controller: 'homeCtrl as home_ctrl'
          },

          // the child views will be defined here (absolutely named)
          'stats@home': {
            templateUrl: 'home-stats.html'
          },

          'navbar@home': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@home': {
            templateUrl: 'footer.html'
          },
		  'auditlog@home':{
			templateUrl: 'auditlog.html'  
		  }
        }
      })
      .state('login', {
        url: '/login?email&redirectTo&uId&docId',
        views: {
          '': {
            templateUrl: 'login.html ',
            controller: 'authCtrl as auth_ctrl'
          },
          'navbar@login': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@login': {
            templateUrl: 'footer.html'
          },
          'auditlog@login':{
          templateUrl: 'auditlog.html' ,
          controller: 'homeCtrl as home_ctrl'
          }
        },
        data: {
          authCheck: true
        }
      })
      .state('aboutus', {
        parent: 'public',
        url: '/aboutus',
        templateUrl: 'about.html',
        data: {
          subHeaderContent: 'About Us'
        }

      })

      .state('emergency', {
          parent: 'simple',
          url: '/emergency',
          templateUrl: 'documents/emergencyCard.html'

      })

      .state('contactus', {
        url: '/contactus?email&subject&type&id',
        views: {
          '': {
            templateUrl: 'contact.html',
            controller: 'messageCtrl as message_ctrl'
          },
          'navbar@contactus': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@contactus': {
            templateUrl: 'footer.html'
          },
          'auditlog@contactus':{
            templateUrl: 'auditlog.html' ,
            controller: 'homeCtrl as home_ctrl'
          }
        },
        data: {
          includeSubheader: true,
          subHeaderContent: 'Contact Us',
          authCheck: true
        }
      })

      .state('privacyPolicy', {
        url: '/privacypolicy',
        views: {
          '': {
            templateUrl: 'privacy_policy.html',
            controller: 'privacyCtrl as privacy_ctrl'
          },
          'navbar@privacyPolicy': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'privacycontent@privacyPolicy': {
              templateUrl: 'privacy_policy_content.html'
          },
          'footer@privacyPolicy': {
            templateUrl: 'footer.html'
          },
          'auditlog@privacyPolicy':{
            templateUrl: 'auditlog.html' ,
            controller: 'homeCtrl as home_ctrl'
          }
        }
      })

      .state('termsOfUse', {
        url: '/termsofuse',
        views: {
          '': {
            templateUrl: 'terms_use.html',
            controller: 'privacyCtrl as privacy_ctrl'
          },
          'navbar@termsOfUse': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'termscontent@termsOfUse': {
              templateUrl: 'terms_use_content.html'
          },
          'footer@termsOfUse': {
            templateUrl: 'footer.html'
          },
          'auditlog@termsOfUse':{
            templateUrl: 'auditlog.html' ,
            controller: 'homeCtrl as home_ctrl'
          }
        }
      })

      .state('history', {
        parent: 'public',
        url: '/history',
        templateUrl: 'history.html',
        data: {
          subHeaderContent: 'History'
        }
      })
      .state('purpose', {
        parent: 'public',
        url: '/purpose',
        templateUrl: 'purpose.html',
        data: {
          subHeaderContent: 'Purpose'
        }
      })
      .state('leadership', {
        parent: 'public',
        url: '/leadership',
        templateUrl: 'leadership.html',
        data: {
          subHeaderContent: 'Leadership'
        }
      })
      .state('jointeam', {
        parent: 'public',
        url: '/jointeam',
        templateUrl: 'jointeam.html',
        data: {
          subHeaderContent: 'Join Our Team'
        }
      })
      .state('community', {
        url: '/community',
        views: {
          '': {
            templateUrl: 'community.html'
          },
          'navbar@community': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@community': {
            templateUrl: 'footer.html'
          }
        },
        data: {
          includeSubheader: true,
          subHeaderContent: 'Ask the Community'
        }
      })
      .state('articles', {
        url: '/articles',
        views: {
          '': {
            templateUrl: 'articles.html'
          },
          'navbar@articles': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@articles': {
            templateUrl: 'footer.html'
          }
        },
        data: {
          includeSubheader: true,
          subHeaderContent: 'Food for Thought'
        }
      })
      .state('articleDetail', {
        url: '/article/detail',
        views: {
          '': {
            templateUrl: 'article_detail.html'
          },
          'navbar@articleDetail': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@articleDetail': {
            templateUrl: 'footer.html'
          },
		  'auditlog@articleDetail':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        },
      })

      .state('articleWrite', {
        url: '/article/write',
        views: {
          '': {
            templateUrl: 'article_write.html',
            controller: 'articleCtrl'
          },
          'navbar@articleWrite': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@articleWrite': {
            templateUrl: 'footer.html'
          },
		  'auditlog@articleWrite':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }

      })

      .state('forgotPassword', {
        url: '/forgot-password',
        views: {
          '': {
            templateUrl: 'forgot_password.html ',
            controller: 'authCtrl as auth_ctrl'
          },
          'navbar@forgotPassword': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@forgotPassword': {
            templateUrl: 'footer.html'
          },
		  'auditlog@forgotPassword':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })

      .state('forgotUsername', {
        url: '/forgot-username',
        views: {
          '': {
            templateUrl: 'forgot_username.html ',
            controller: 'authCtrl as auth_ctrl'
          },
          'navbar@forgotUsername': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@forgotUsername': {
            templateUrl: 'footer.html'
          },
		  'auditlog@forgotUsername':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })

      .state('changePassword', {
        url: '/change-password?token&email',
        views: {
          '': {
            templateUrl: 'change_password.html',
            controller: 'authCtrl as auth_ctrl'
          },
          'navbar@changePassword': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@changePassword': {
            templateUrl: 'footer.html'
          },
          'auditlog@changePassword':{
            templateUrl: 'auditlog.html' ,
            controller: 'homeCtrl as home_ctrl'
          }
        },
        data: {
          authCheck: true
        }
      })

      .state('smsVerify',{
        url : '/sms_verify?redirectTo&uId&docId',
        views: {
          '': {
            templateUrl: 'sms_verify.html ',
            controller: 'authCtrl as auth_ctrl'
          },
          'navbar@smsVerify': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@smsVerify': {
            templateUrl: 'footer.html'
          },
		  'auditlog@smsVerify':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })

      .state('downloadListingPdf', {
        url: '/download/:listingId',
        templateUrl: 'listing_pdf.html',
        controller: 'listingCtrl as listing_ctrl'
      })

      .state('search', {
		url: '/search?query&name&location&city&state&zip&county&skip&limit&saveSearch&within&fullAddress',
        views: {
          '': {
            templateUrl: 'search_list.html',
            controller: 'searchCtrl as search_ctrl'
          },

          'navbar@search': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },

          'filter@search': {
            templateUrl: 'filter.html'
          },
          'footer@search': {
            templateUrl: 'footer.html'
          },
		  'auditlog@search':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })
      .state('projects', {
        url: '/projects',
        views: {

          '': {
            templateUrl: 'projects.html'
          },


          'navbar@projects': {
            templateUrl: 'navbar.html'
          },

          'footer@projects': {
            templateUrl: 'footer.html'
          }
        }
      })


      .state('listingDetail', {
        url: '/listing/detail/:listingId',
        views: {

          '': {
            templateUrl: 'daycare_detail.html ',
            controller: 'listingCtrl as listing_ctrl'
          },

          'navbar@listingDetail': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },

          'footer@listingDetail': {
            templateUrl: 'footer.html'
          },
		  'auditlog@listingDetail':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })

      

      

      .state('writeReview', {
        url: '/listing/write/review/:daycareId/:reviewId',
        views: {

          '': {
            templateUrl: 'daycare_review.html ',
            controller: 'reviewCtrl as review_ctrl'
          },

          'navbar@writeReview': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },

          'footer@writeReview': {
            templateUrl: 'footer.html'
          },
		  'auditlog@writeReview':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        },
        data: {
          authorizedRoles: [USER_ROLES.parent, USER_ROLES.customer]
        }
      })

      .state('editReview', {
        url: '/listing/edit/review/:daycareId/:reviewId',
        views: {

          '': {
            templateUrl: 'daycare_review.html ',
            controller: 'reviewCtrl as review_ctrl'
          },

          'navbar@editReview': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },

          'footer@editReview': {
            templateUrl: 'footer.html'
          },
          'auditlog@editReview':{
            templateUrl: 'auditlog.html' ,
            controller: 'homeCtrl as home_ctrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.parent, USER_ROLES.customer]
        }
      })


      // *****************  REGISTER DETAILS  *************************

      .state('register', {
        url: '/register',
        views: {

          '': {
            templateUrl: 'register.html ',
            controller: 'registerCtrl as register_ctrl'

          },
          'navbar@register': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'privacycontent@register': {
              templateUrl: 'privacy_policy_content.html',
              controller: 'privacyCtrl as privacy_ctrl'
          },
          'termscontent@register': {
              templateUrl: 'terms_use_content.html',
              controller: 'privacyCtrl as privacy_ctrl'
          },
          'footer@register': {
            templateUrl: 'footer.html'
          },
          'auditlog@register':{
          templateUrl: 'auditlog.html' ,
          controller: 'homeCtrl as home_ctrl'
          }
        }
      })
      .state('activation', {
        url: '/register/confirmation?token&email',
        views: {
          '': {
            templateUrl: 'confirmation.html ',
            controller: 'registerCtrl as register_ctrl'
          },
          'navbar@activation': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@activation': {
            templateUrl: 'footer.html'
          },
		  'auditlog@activation':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })
      .state('register_parent_step2', {
        url: '/register/parent/2/:userId',
        views: {
          '': {
            templateUrl: 'registration_step2.html ',
            controller: 'registerCtrl as register_ctrl'
          },
          'navbar@register_parent_step2': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@register_parent_step2': {
            templateUrl: 'footer.html'
          },
		  'auditlog@register_parent_step2':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })
      .state('register_parent_step3', {
        url: '/register/parent/3/:userId',
        views: {
          '': {
            templateUrl: 'registration_step3.html ',
            controller: 'registerCtrl as register_ctrl'
          },
          'navbar@register_parent_step3': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@register_parent_step3': {
            templateUrl: 'footer.html'
          },
		  'auditlog@register_parent_step3':{
			templateUrl: 'auditlog.html' ,
			controller: 'homeCtrl as home_ctrl'
		  }
        }
      })
      .state('siteAdmin', {
        url: '/site-admin',
        views: {
          '': {
            templateUrl: 'community.html ',
          },
          'navbar@register': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@register': {
            templateUrl: 'footer.html'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.admin]
        }
      })

      // ******************* DASHBOARD **********************

      .state('dashboard_home', {
        parent: 'dashboard_admin',
        url: '/dashboard',
        templateUrl: 'dashboard_home.html',
        controller: 'dashboardCtrl as dashboardCtrl'
      })

      .state('dashboard_profile', {
        parent: 'dashboard_admin',
        url: '/dashboard/profile',
        templateUrl: 'dashboard_profile.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_selected_profile', {
        parent: 'dashboard_admin',
        url: '/dashboard/profile/selected',
        templateUrl: 'dashboard_selected_profile.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_edit_profile', {
        parent: 'dashboard_admin',
        url: '/dashboard/profile/edit',
        templateUrl: 'dashboard_edit_profile.html',
        controller: 'dashboardCtrl as dashboardCtrl'
      })

      .state('dashboard_security_information', {
        parent: 'dashboard_admin',
        url: '/dashboard/security',
        templateUrl: 'dashboard_security_information.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_change_password', {
        parent: 'dashboard_admin',
        url: '/dashboard/change-password',
        templateUrl: 'dashboard_change_password.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_edit_security_information', {
        parent: 'dashboard_admin',
        url: '/dashboard/security/edit',
        templateUrl: 'dashboard_edit_security_information.html',
        controller: 'dashboardCtrl as dashboardCtrl'
      })

      .state('dashboard_provider', {
        parent: 'dashboard_admin',
        url: '/dashboard/provider/',
        templateUrl: 'dashboard_home2.html'
      })

      .state('dashboard_inbox', {
        parent: 'dashboard_admin',
        url: '/dashboard/inbox',
        templateUrl: 'dashboard_inbox.html',
        controller: 'dashboardCtrl as dashboardCtrl'
      })

      .state('dashboard_daycares', {
        parent: 'dashboard_admin',
        url: '/dashboard/daycares',
        templateUrl: 'dashboard_daycares.html',
		    controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_daycares_owner_request', {
        parent: 'dashboard_admin',
        url: '/dashboard/daycares/ownership-request',
        templateUrl: 'dashboard_daycares_owner_request.html',
		    controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_articles', {
        parent: 'dashboard_admin',
        url: '/dashboard/articles',
        templateUrl: 'dashboard_articles.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_reviews', {
        parent: 'dashboard_admin',
        url: '/dashboard/reviews',
        templateUrl: 'dashboard_reviews.html',
		controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_ratings', {
        parent: 'dashboard_admin',
        url: '/dashboard/ratings',
        templateUrl: 'dashboard_ratings.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_ratings_listing', {
        parent: 'dashboard_admin',
        url: '/dashboard/ratings/:listingId',
        templateUrl: 'dashboard_ratings_listing.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_users', {
        parent: 'dashboard_admin',
        url: '/dashboard/users',
        templateUrl: 'dashboard_users.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_all_reviews', {
        parent: 'dashboard_admin',
        url: '/dashboard/admin/reviews',
        templateUrl: 'dashboard_all_reviews.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_all_daycares', {
        parent: 'dashboard_admin',
        url: '/dashboard/admin/daycares',
        templateUrl: 'dashboard_all_daycares.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

      .state('dashboard_all_owner_requests', {
        parent: 'dashboard_admin',
        url: '/dashboard/admin/owner-requests',
        templateUrl: 'dashboard_all_owner_requests.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

	  .state('dashboard_all_feedbacks', {
        parent: 'dashboard_admin',
        url: '/dashboard/admin/feedbacks',
        templateUrl: 'dashboard_all_feedbacks.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

    .state('dashboard_class', {
        parent: 'dashboard_admin',
        url: '/dashboard/class',
        templateUrl: 'dashboard_class.html',
        controller: 'classCtrl as classCtrl'
      })

    .state('dashboard_class_register', {
        parent: 'dashboard_admin',
        url: '/dashboard/class/register/:listingId',
        templateUrl: 'dashboard_class_register.html',
        controller: 'classCtrl as classCtrl'
      })

    .state('dashboard_class_update', {
        parent: 'dashboard_admin',
        url: '/dashboard/class/update/:classId',
        templateUrl: 'dashboard_class_register.html',
        controller: 'classCtrl as classCtrl'
      })

	  .state('dashboard_staff', {
        parent: 'dashboard_admin',
        url: '/dashboard/admin/staff',
        templateUrl: 'dashboard_staff.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
      })

    .state('dashboard_staff_list', {
      parent: 'dashboard_admin',
      url: '/dashboard/admin/staff/list/:daycareId',
      templateUrl: 'dashboard_staff_list.html',
      controller: 'staffCtrl as staffCtrl'
    })

    .state('dashboard_client', {
        parent: 'dashboard_admin',
        url: '/dashboard/client',
        templateUrl: 'dashboard_client.html',
        controller: 'dashboardCtrl as dashboardCtrl'
      })

    .state('dashboard_client_list', {
      parent: 'dashboard_admin',
      url: '/dashboard/client/list/:daycareId',
      templateUrl: 'dashboard_client_list.html',
      controller: 'clientCtrl as clientCtrl'
    })

    .state('dashboard_favorites', {
      parent: 'dashboard_admin',
      url: '/dashboard/favorites',
      templateUrl: 'dashboard_favorites.html',
      controller: 'dashboardCtrl as dashboard_ctrl'
    })

    .state('dashboard_appointments', {
        parent: 'dashboard_admin',
        url: '/dashboard/appointment/',
        templateUrl: 'dashboard_appointment.html',
        controller: 'dashboardCtrl as dashboard_ctrl'
    })

    .state('document_daycare_list', {
      parent: 'dashboard_admin',
      url: '/document/list',
      templateUrl: 'document_daycare_list.html',
      controller: 'documentCtrl as documentCtrl'
    })

    .state('document_form_summary', {
      parent: 'dashboard_admin',
      url: '/document/summary/:daycareId',
      templateUrl: 'daycare_form_summary.html',
      controller: 'documentCtrl as documentCtrl'
    })
    
    .state('document_send_client', {
      parent: 'dashboard_admin',
      url: '/document/send/:sourceId/:pickClient',
      // url: '/document/send',
      templateUrl: 'daycare_form_send.html',
      controller: 'documentCtrl as documentCtrl'
    })

    .state('document_input_enroll', {
      parent: 'dashboard_admin',
      url: '/document/input/enroll',
      templateUrl: 'daycare_form_enrollment.html',
      controller: 'enrollmentCtrl as enrollmentCtrl'
    })

    .state('document_edit_enroll', {
      parent: 'dashboard_admin',
      url: '/document/edit/enroll/:userId/:docId?email',
      templateUrl: 'daycare_form_enrollment.html',
      controller: 'enrollmentCtrl as enrollmentCtrl'
    })

    .state('document_input_emergency', {
      parent: 'dashboard_admin',
      url: '/document/input/emergency',
      templateUrl: 'daycare_form_emergency.html',
      controller: 'emFormCtrl as emFormCtrl'
    })

    .state('document_edit_emergency', {
      parent: 'dashboard_admin',
      url: '/document/edit/emergency/:userId/:docId?email',
      templateUrl: 'daycare_form_emergency.html',
      controller: 'emFormCtrl as emFormCtrl'
    })

    .state('document_input_medauth', {
      parent: 'dashboard_admin',
      url: '/document/input/medauth',
      templateUrl: 'daycare_form_medicalAuthorization.html',
      controller: 'medAuthCtrl as medAuthCtrl'
    })

    .state('document_edit_medauth', {
      parent: 'dashboard_admin',
      url: '/document/edit/medauth/:userId/:docId?email',
      templateUrl: 'daycare_form_medicalAuthorization.html',
      controller: 'medAuthCtrl as medAuthCtrl'
    })

    .state('dashboard_subscription', {
      parent: 'dashboard_admin',
      url: '/dashboard/subscription',
      templateUrl: 'dashboard_subscription.html',
      controller: 'dashboardCtrl as dashboard_ctrl'
    })
  
    .state('addStaff', {
      url: '/dashboard/admin/addstaff/:listingId',
      params: {staffInfoObj:null},
          parent: 'dashboard_admin',
      views: {
        '': {
          templateUrl: 'dashboard_add_staff.html',
          controller: 'staffCtrl as staffCtrl'
        }
      }
    })

    .state('updateStaff', {
      url: '/dashboard/admin/updatestaff/:listingId/:staffId',
      params: {staffInfoObj:null},
          parent: 'dashboard_admin',
      views: {
        '': {
          templateUrl: 'dashboard_add_staff.html',
          controller: 'staffCtrl as staffCtrl'
        }
      }
    })

    .state('addStudent', {
      url: '/dashboard/admin/addstudent/:daycareId',
      parent: 'dashboard_admin',
      views: {
        '': {
          templateUrl: 'dashboard_add_client_tab.html',
          controller: 'clientCtrl as clientCtrl'
        }
      }
    })

    .state('updateStudent', {
      url: '/dashboard/admin/updatestudent/:daycareId/:clientId',
      parent: 'dashboard_admin',
      views: {
        '': {
          templateUrl: 'dashboard_add_client_tab.html',
          controller: 'clientCtrl as clientCtrl'
        }
      }
    })

    .state('daycare_appointment', {
      parent: 'dashboard_admin',
      url: '/daycare_appointment/:listingId/:listingName?email',
      templateUrl: 'daycare_appointment.html',
      controller: 'appointmentController as appointment_ctrl'
    })

    .state('ownershipUploads', {
        url: '/ownership/:ownershipId/uploads?email&listing',
        views: {
          '': {
            templateUrl: 'ownership_uploads.html ',
            controller: 'ownershipUploadsCtrl as ownership_uploads_ctrl'
          },
          'navbar@ownershipUploads': {
            templateUrl: 'navbar.html',
            controller: 'headerCtrl as header_ctrl'
          },
          'footer@ownershipUploads': {
            templateUrl: 'footer.html'
          },
          'auditlog@ownershipUploads':{
            templateUrl: 'auditlog.html' ,
            controller: 'homeCtrl as home_ctrl'
          }
        },
        data: {
          authCheck: true
        }
      });

 stripeProvider.setPublishableKey("pk_test_SsJkxNbJJvlU8rBGPjw8xKEU");

});