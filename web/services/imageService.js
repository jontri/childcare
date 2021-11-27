(function(angular) {
  'use strict';

  angular.module('rvServices')
    .factory('imageService', imageService);

  imageService.$inject = ['$q', '$window'];

  function imageService($q, $window) {
    return {
      base64ToFile: base64ToFile,
      pdfToImgBase64: pdfToImgBase64,
      srcToBase64: srcToBase64
    };

    function base64ToFile(b64, fileName) {
      var blob = new $window.Blob(
        [jsPDF.API.binaryStringToUint8Array($window.atob(b64.split(',')[1]))],
        {type: 'image/png'}
      );
      blob.name = fileName+'.png';
      return blob;
    }

    function pdfToImgBase64(uint8Array) {
      var deferred = $q.defer();

      $window.PDFJS.getDocument(uint8Array).then(function(pdf) {
        pdf.getPage(1).then(function(page) {
          var viewport = page.getViewport(1);
          var canvas = $window.document.createElement('CANVAS');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).then(function() {
            deferred.resolve(canvas.toDataURL('image/png'));
          }, function() {
            deferred.reject();
          });
        }, function() {
          deferred.reject();
        });
      }, function() {
        deferred.reject();
      });

      return deferred.promise;
    }

    function srcToBase64(src) {
      var deferred = $q.defer();
      var imgElem = angular.element($window.document.createElement('IMG')).attr('src', src);
      imgElem[0].onload = function() {
        var canvas = $window.document.createElement('CANVAS');
        canvas.width = imgElem[0].width;
        canvas.height = imgElem[0].height;
        canvas.getContext('2d').drawImage(imgElem[0], 0, 0);
        deferred.resolve(canvas.toDataURL());
      };
      imgElem[0].onerror = function() {
        deferred.reject();
      };
      return deferred.promise;
    }
  }
})(angular);