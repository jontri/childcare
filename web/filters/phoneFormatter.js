angular.module('rvFilters')
  .filter('phoneFormatter', PhoneFormatter);

function PhoneFormatter($window) {
  return function(str, plain) {
    if (!str) return str;

    if (!plain) {
      var trimmed = str.trim(),
        patt = /\([0-9]{3}\)\s{1}[0-9]{3}\-[0-9]{4}/,
        parsed = ['('];

      // console.log("Trimmed: " + trimmed);
      if (trimmed && !patt.test(trimmed)) {
        var arr = trimmed.split('');


        angular.forEach(arr, function(val) {
          // console.log(" Length: " + parsed.length + "  " + arr + " Parsed: " + parsed + " Value: " + val);
          if (parsed.length == 4) {
            parsed.push(')');
          } else if (parsed.length == 5) {
            parsed.push(' ');
          } else if (parsed.length == 6  ) {
             // console.log("5th element: " + parsed[5]);
             if(parsed[5] != " "){
                 parsed.splice(5, 0, " ");
             }
          } else if (parsed.length == 9) {
            parsed.push('-');
          } else if (parsed.length == 14) {
            // console.log("Parsed Length: "  + parsed.length + " Data: " + parsed);
          }
  
          if (!$window.isNaN($window.parseInt(val)) && parsed.length != 14) {
            parsed.push(val);
          }

        });

      }
      
      return (parsed.length == 1 ? str : parsed.join(''));

    } else {
      return str.replace(/[\(\)\s\-]/g,'');
    }
  }
}