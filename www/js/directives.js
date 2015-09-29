angular.module('ptApp.directives', ['ptConfig', 'pascalprecht.translate'])

.directive('readSensor', function(){
  ble.scan([], 5, function(device) {
      console.log(JSON.stringify(device));
  }, function(){console.log("fail")});
})
