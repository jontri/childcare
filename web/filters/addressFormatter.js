angular.module('rvFilters')
  .filter('addressFormatter', AddressFormatter);

function AddressFormatter() {
  return function(address, displayAddress) {
    var result = '';

    if (address.addressLine1 && address.addressLine1.replace(/^\s+|\s+$/g, '').length > 0) {

        if (displayAddress != 'False') {
            result = result.concat(address.addressLine1)
                .concat(address.suite ? (', Suite/Unit '+address.suite) : '');
            result = result.concat(', ', address.city)
                .concat(', ', address.state)
                .concat(' ', address.zip);
        }


        if (displayAddress == 'False') {
            result = result.concat(address.city)
                .concat(', ', address.state)
                .concat(' ', address.zip);
            result = result.concat(' ', '(Street address not disclosed by provider)');
        }

    } else {
       result = address.fullAddress;
    }

    return result;
  }
}