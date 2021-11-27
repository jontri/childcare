angular.module('rvFilters')
  .filter('qualityProgramLink', QualityProgram);

function QualityProgram() {

  return function(state) {
    if(state == "NJ"){
      return "http://www.grownjkids.com";
    } else if(state == "VA"){
      return "http://www.virginiaquality.com";
    } else if(state == "NY"){
        return "http://www.qualitystarsny.org";
    } else if(state == "FL"){
        return "http://www.myflfamilies.com/service-programs/child-care/goldseal";
    } else {
        return '#';
    }

  }
}