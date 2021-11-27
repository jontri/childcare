angular.module('rvFilters')
  .filter('qualityProgram', QualityProgram);

function QualityProgram() {

  return function(state) {
    if(state == "NJ"){
      return "Grow NJ Kids";
    } else if(state == "VA"){
      return "Virginia Quality";
    } else if(state == "NY"){
        return "QUALITYstarsNY";
    } else if(state == "FL"){
        return "Gold Seal";
    } else {
        return null;
    }

  }
}