(function() {
  'use strict';
  angular.module('routerApp').controller('ownershipUploadsCtrl', OwnershipUploads);

  OwnershipUploads.$inject = ['$rootScope', '$scope', '$state', '$stateParams', '$timeout', '$cookies', 'AuthService', 'ownershipService', 'Upload', 'listingService'];

  function OwnershipUploads($rootScope, $scope, $state, $stateParams, $timeout, $cookies, AuthService, ownershipService, Upload, listingService) {
    var self = this;

    var prevSelectedPOA, prevPOADoc;
    
    OnLoad();

    $scope.onFileSelected = function(file, invalidFile, objName) {
      if (file || invalidFile) {
        $scope.selected[objName] = file || invalidFile;
      }
    };

    $scope.proofOwnerChange = function(isOwner) {
      if (isOwner) {
        prevSelectedPOA = $scope.selected.power;
        prevPOADoc = $scope.ownershipRequest.power_attorney_doc;
        delete $scope.selected.power;
        $scope.ownershipRequest.power_attorney_doc = null;
      } else {
        if (prevSelectedPOA) $scope.selected.power = prevSelectedPOA;
        if (prevPOADoc) $scope.ownershipRequest.power_attorney_doc = prevPOADoc;
      }
    };

    $scope.uploadFiles = function(ownershipUploadsForm) {
      if (!ownershipUploadsForm.$valid) {
        setTimeout(function () {
            var firstErrorElement = angular.element("[name='" + ownershipUploadsForm.$name + "']").find('[class*="ng-invalid"]:visible:first');
            firstErrorElement.focus();
            $("html, body").animate({scrollTop: firstErrorElement.offset().top - 300}, 1000);
        }, 1);
        return;
      }

      if ($.isEmptyObject($scope.selected) && ($scope.prevOwnershipRequest.proof_owner === $scope.ownershipRequest.proof_owner || !$scope.ownershipRequest.proof_owner)) {
        swal({
          title: 'No Documents Selected for Uploading',
          text: 'Please select at least 1 document to upload.',
          type: 'warning',
          showconfirmbutton: true
        });
        return;
      }
      if (!self.agree) {
        $scope.needAgree = true;
        return;
      }

      swal({
        title: 'Documents Uploaded: ' + Object.keys($scope.selected).length + (
          $scope.prevOwnershipRequest.power_attorney_doc && $scope.ownershipRequest.proof_owner ? '\nDocuments Removed: 1' : ''
        ),
        text: CreateSwalText(),
        html: true,
        type: 'success',
        showconfirmbutton: true,
        timer: 20000
      }, function(isConfirm) {
        Upload.upload({
          url: '/api/owner-request/uploads',
          data: $scope.ownershipRequest
        }).then(function(response) {
          console.log(response);
          if ($cookies.get('tmpUrl') == 'dashboard_daycares_owner_request') {
            $state.go('dashboard_daycares_owner_request');
          } else {
            $state.go('search');
          }
        }, function(error) {
          console.warn(error);
        });
      });
    };

    $scope.uploadLater = function() {
      swal({
        title: 'Document Upload Postponed',
        text: CreateSwalText(true),
        html: true,
        type: 'warning',
        showconfirmbutton: true,
        timer: 20000
      }, function() {
        if ($cookies.get('tmpUrl') == 'dashboard_daycares_owner_request' || $stateParams.email) {
          $state.go('dashboard_daycares_owner_request');
        } else {
          $state.go('search');
        }
        $cookies.remove('tmpUrl');
        if ($scope.prevOwnershipRequest.proof_owner !== $scope.ownershipRequest.proof_owner) {
          delete $scope.ownershipRequest.id_doc;
          delete $scope.ownershipRequest.proof_owner_doc;
          delete $scope.ownershipRequest.power_attorney_doc;
          Upload.upload({
            url: '/api/owner-request/uploads',
            data: $scope.ownershipRequest
          }).then(function(response) {
            console.log(response);
          }, function(error) {
            console.warn(error);
          });
        }
      });
    };

    function CreateSwalText(later) {
      var docs = {
        'id_doc': 'Valid government issued photo ID',
        'proof_owner_doc': 'Proof of ownership of child care center (any one)<ul><li>License</li><li>Registration Letter</li><li>IRS Letter of Employer Identification Number (EIN)</li><li>Other</li></ul>',
        'power_attorney_doc': 'Power of Attorney' + ($scope.ownershipRequest.proof_owner !== undefined ? '' : ' (if applicable)')
      };
      var dueDate = new Date($scope.ownershipRequest.date_requested).getTime() + 14 * 86400000, // due date in milliseconds
        text = 'The following documents need to be uploaded no later than ' + new Date(dueDate).toLocaleDateString() + ':<ul>',
        needUpload;

      Object.keys(docs).forEach(function(val) {
        if ((!$scope.ownershipRequest[val]&&!later) || (!$scope.prevOwnershipRequest[val]&&later)) {
          if (val != 'power_attorney_doc' || (val == 'power_attorney_doc' && !$scope.ownershipRequest.proof_owner)) {
            text += '<li style="text-align: left;">' + docs[val] + '</li>';
            needUpload = true;
          }
        }
      });
      if (!needUpload) {
        text = !later ? 'Thank you for uploading the documents necessary to process your ownership request for '+$scope.ownershipRequest.listing.name+'. The Ratingsville team will review them and contact you shortly if anything additional is required. Please allow up to 14 days for a final decision on this request.<br/><br/>'
          : 'No documents need to be uploaded at this time unless you want to replace documents you previously uploaded.<br/><br/>';
      } else {
        text += '</ul>';
      }
      text += 'You will now be redirected to the child care search listing. If you are not redirected in 20 seconds, please click OK below.';

      return text;
    }

    function OnLoad() {
      $scope.true = true; $scope.false = false;
      $scope.isLoading = true;
      $scope.filePattern = 'image/*,.pdf';
      $scope.maxFileSize = '50MB';
      $scope.modelOptions = {updateOn:'change'};
      $scope.readyMsg = function(filename) {
        return '"' + filename + '"' + ' is ready for upload.'
      };
      $scope.reUploadMsg = "This document is already uploaded. Press 'Select Document' to replace this document.";
      $scope.prevOwnershipRequest = {};
      $scope.selected = {};
      $scope.AuthService = AuthService;
      $scope.$stateParams = $stateParams;

      ownershipService.get({ownerRequestId: $stateParams.ownershipId}, function(response) {
        $scope.isLoading = false;
        $scope.ownershipRequest = response.searchResult;
        $scope.showLoginModal = !AuthService.isAuthenticated();
        if ($scope.ownershipRequest) {
          angular.copy($scope.ownershipRequest, $scope.prevOwnershipRequest);
        } else {
          listingService.get({listingId: $stateParams.listing}, function(response) {
            $scope.listing = response.listing;
          });
        }
      });
    }
  }
})();