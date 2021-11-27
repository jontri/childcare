(function() {
    angular.module('routerApp')
        .directive('rating', Rating);

    function Rating() {
        return {
            restrict: 'AE',
			scope: false,
             link: function(scope, attr, elem) {
                var self = this, rating = null,
                    average, counter;
				
                elem.$observe('rating', function(val) {
                    if (val) {
                        if(val.length > 0){
                            rating = JSON.parse(val);
                            if(typeof rating == "object")
                            {
                                average = self.getAverage(rating);
                            }else{
                                average = rating;
                            }
                        }

                        counter = 0;
                        attr.context.innerHTML = '';
                        
                        for (let i = 0; i < Math.floor(average); i++) {
                            counter++;
                            attr.context.innerHTML += '<i class="fa fa-star"></i>';
                        }
                        let rm = average % 1;
                        if (rm < 1 && rm != 0) {
                            counter++;
                            var templateH = '<i class="fa fa-star-half-o"></i>';
                            attr.context.innerHTML += templateH;
                        }
                        for(;counter < 5;counter++)
                        {
                            var template0 = '<i class="fa fa-star-o"></i>';
                            attr.context.innerHTML += template0;
                        }
                    }
                });
            },
            getAverage: function(reviewInfo) {
                var average = 0;
                for (var key in reviewInfo) {
                    if (key.match(/rate/i)) {
                        average += reviewInfo[key];
                    }
                }
                return average / 3;
            }
        }
    }

}());