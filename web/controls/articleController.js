var articleController = angular.module('articleController', []);

articleController.controller('articleCtrl', ['$scope', '$state', 'AuthService','articleService' ,function ($scope, $state, AuthService,articleService) {
  var self = this;

  $scope.user = angular.copy(AuthService.getUser());
  $scope.tags = [];
  $scope.pretag;
  $scope.title = '';
  $scope.addArticleTag = function(){
    if(!$scope.pretag){
      console.log("error");
    }else{
      $scope.tags.push($scope.pretag);
      $scope.pretag = '';
    }
  }
  $scope.test = function(){
    console.log($scope.image);
  }
  $scope.removetag = function(index){
    console.log(index);
    $scope.tags.splice(index, 1);
  }

  $scope.submit_article = function submit_article(){
  	var data = $('#edit').froalaEditor('html.get');
    console.log( $scope.title);
    var content = {
      user_id:$scope.user.id,
      content:data,
      tags:$scope.tags,
      title:$scope.title
    };
  	console.log( data );
  	if( data != "" ){
  		this.articleSuccess = true;
  		this.articleFailed = false;

      articleService.save(content);

      $scope.tags = '';
      
  		console.log("response 200 : submit success !");
  	}else{
  		this.articleSuccess = false;
  		this.articleFailed = true;
  		console.log(" failed !");
  	}
  }
  	

}]);
