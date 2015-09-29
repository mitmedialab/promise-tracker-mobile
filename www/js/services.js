angular.module('ptApp.services', ['ptConfig', 'pascalprecht.translate'])

.factory('Main', function($rootScope, $http, PT_CONFIG, $translate){
  localStorage['user'] = localStorage['user'] || '{}';

  var service = {
    user: JSON.parse(localStorage['user']),

    interceptResponse: function(data, status){
      if(status == 404){
        $rootScope.$broadcast('connectionError');
      }
    },

    setInstallationId: function(aggregatorUrl){
      $http.get(aggregatorUrl + 'getId')
      .success(function(response){
        localStorage['installationId'] = response['payload']['installation_id'];
      });
    },

    updateUserInfo: function(){
      localStorage['user'] = JSON.stringify(this.user);
    },

    confirmInternetConnection: function(successCallback, errorCallback){
      if(window.Connection && navigator.connection.type !== Connection.NONE) {
        successCallback();  
      } else {
        $rootScope.$broadcast('connectionError');
        errorCallback ? errorCallback() : false;
      }
    }
  }
  
  if(!localStorage['installationId']){
    // service.setInstallationId(PT_CONFIG.aggregatorUrl);
  }

  return service;
})

.factory('Survey', function($rootScope, $http, $ionicPopup, $state, $filter, $location, PT_CONFIG, Main){
  localStorage['surveys'] = localStorage['surveys'] || '{}';
  localStorage['unsynced'] = localStorage['unsynced'] || '[]';
  localStorage['unsyncedImages'] = localStorage['unsyncedImages'] || '[]';
  localStorage['synced'] = localStorage['synced'] || '[]';

  var service = {
    surveys: JSON.parse(localStorage['surveys']),
    unsynced: JSON.parse(localStorage['unsynced']),
    synced: JSON.parse(localStorage['synced']),
    unsyncedImages: JSON.parse(localStorage['unsyncedImages']),
    currentResponse: {},
    currentSyncItemTotal: 0,
    currentSyncPercentage: 0,
    syncing: false,

    isSyncing: function(){
      return this.syncing;
    },

    hasUnsyncedItems: function(){
      return this.unsynced.length + this.unsyncedImages.length > 0;
    },

    getCampaignId: function(surveyId){
      var survey = this.surveys[surveyId];
      return survey.campaign_id;
    },

    fetchSurvey: function(surveyCode, successCallback, errorCallback){
      var self = this;
      $http.get(PT_CONFIG.aggregatorUrl + 'surveys/' + surveyCode)
        .success(function(data){
          if(data.status == 'success'){
            self.surveys[data.payload.id] = data.payload;
            localStorage['surveys'] = JSON.stringify(self.surveys);
            successCallback(data);
            console.log(data);
          } else {
            errorCallback(data.error_code.toString());
          }
        })

        .error(function(data, status){
          Main.interceptResponse(data, status);
        });
    },

    renderMap: function(locationObject){
      var latLong = new google.maps.LatLng(locationObject.lat, locationObject.lon);
       
      var mapOptions = {
        center: latLong,
        disableDefaultUI: true,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

      var marker = new google.maps.Marker({
        position: latLong,
        map: map,
        draggable: true,
        title: ''
      });

      google.maps.event.addListener(marker, 'dragend', function(event){
        locationObject.lat = event.latLng.lat();
        locationObject.lon = event.latLng.lng();
      });
    },

    getLocation: function(scope, locationObject, displayMap){
      var self = this;
      scope.location.status = "searching";

      var success = function(position){
        locationObject.lon = position.coords.longitude;
        locationObject.lat = position.coords.latitude;

        if(!self.currentResponse.locationstamp.lon){
          self.currentResponse.locationstamp.lon = position.coords.longitude;
          self.currentResponse.locationstamp.lat = position.coords.latitude;
        }

        scope.$apply(function(){
          scope.location.status = "recorded";

          if(displayMap){
            self.renderMap(locationObject);

            if(!window.Connection || navigator.connection.type == Connection.NONE){
              scope.location.message = $filter('translate')('LOCATION') + ": " + locationObject.lat + ", " + locationObject.lon;
            }
          }
        });
      };

      var error = function(){
        locationObject.lon = null;
        locationObject.lat = null;

        var timeoutPopup = $ionicPopup.confirm({
          title: $filter('translate')('LOCATION_NOT_FOUND'),
          template: $filter('translate')('LOCATION_TIMEOUT'),
          buttons: [
            {
              text: $filter('translate')('SKIP_LOCATION'),
              onTap: function() { scope.location.status = null; }
            },
            {
              text: $filter('translate')('RETRY'),
              type: 'button-positive',
              onTap: function(){ self.getLocation(scope, locationObject); }
            }
          ]
        });
      };

      var options = {
        enableHighAccuracy: true,
        timeout: 22000,
      };

      navigator.geolocation.getCurrentPosition(success, error, options);
    },

    queueNewResponse: function(surveyId, locationConsent){
      var self = this;
      self.currentResponse = {
        installation_id: localStorage['installationId'],
        survey_id: surveyId,
        status: self.surveys[surveyId].status,
        timestamp: Date.now(),
        locationstamp: {},
        consent: locationConsent,
        inputs: JSON.parse(JSON.stringify(self.surveys[surveyId].inputs)),
        activeIndex: 0
      };

      if(locationConsent){
        navigator.geolocation.getCurrentPosition(function(position){
          self.currentResponse.locationstamp.lon = position.coords.longitude;
          self.currentResponse.locationstamp.lat = position.coords.latitude;
        });
      }
    },

    addResponseToUnsynced: function(response){
      var index = this.unsynced.indexOf(response);
      if(index == -1){
        this.unsynced.push(response);
        localStorage['unsynced'] = JSON.stringify(this.unsynced);
      }
    },

    removeResponseFromUnsynced: function(response){
      var index = this.unsynced.indexOf(response);
      if(index > -1){
        this.unsynced.splice(index, 1);
        localStorage['unsynced'] = JSON.stringify(this.unsynced);
      }
    },

    getUnsyncedCount: function(){
      return this.unsyncedImages.length + this.unsynced.length;
    },

    getSyncMessage: function(){
      var itemsToGo = this.unsyncedImages.length + this.unsynced.length;
      var message = (this.currentSyncItemTotal-itemsToGo+1) + '/' + this.currentSyncItemTotal;
      if(this.currentSyncPercentage > 0 && this.currentSyncPercentage < 100){
        message += " " + this.currentSyncPercentage + "%";
      }
      return message;
    },

    addImageToUnsynced: function(response){
      var self = this;
      // Search for images in the survey response
      response.inputs.forEach(function(input){
        if(input.input_type == 'image' && input.answer){
          self.unsyncedImages.push({id: response.id, survey_id: response.survey_id, input_id: input.id, fileLocation: input.answer});
        }
      });
      self.syncImages();
    },

    removeImageFromUnsynced: function(image){
      var self = this;
      var index = this.unsyncedImages.indexOf(image);
      if(index > -1){
        this.unsyncedImages.splice(index, 1);
        localStorage['unsyncedImages'] = JSON.stringify(this.unsyncedImages);
      }
    },

    addResponseToSynced: function(response){
      var index = this.unsynced.indexOf(response);
      this.synced.push(response);
      localStorage['synced'] = JSON.stringify(this.synced)
      if(index > -1){
        this.unsynced.splice(index, 1);
        localStorage['unsynced'] = JSON.stringify(this.unsynced);
      }
    },

    formatResponse: function(response){
      var formattedResponse = {
        installation_id: localStorage.installationId,
        survey_id: response.survey_id,
        status: response.status,
        timestamp: response.timestamp,
        locationstamp: response.locationstamp,
        answers: []
      };

      response.inputs.forEach(function(input){
        var answer = { id: input.id, value: input.answer, input_type: input.input_type };

        if(input.input_type == 'select'){
          answer.value = input.answer.map(function(value, index){
            if(value){
              return input.options[index];
            }
          }).filter(function(n){ return n!= undefined; });
        }

        formattedResponse.answers.push(answer);
      })

      return formattedResponse;
    },

    syncResponse: function(response, $scope){
      var self = this;
      var formattedResponse = self.formatResponse(response);
      self.addResponseToUnsynced(response);
      $scope.data.isSyncing =  true;
      $http.post(
        PT_CONFIG.aggregatorUrl + 'responses', 
        { response: JSON.stringify(formattedResponse) }
      )
        .success(function(data){
          if(data['status'] == 'success'){
            response.id = data.payload.id;
            self.removeResponseFromUnsynced(response);
            self.addResponseToSynced(formattedResponse);
            self.addImageToUnsynced(response);
          }
          if(self.unsynced.length + self.unsyncedImages.length == 0) {
            $scope.data.isSyncing =  false;
            $rootScope.$broadcast('viewMap', response.survey_id);
          }
          $scope.data.needsSync = self.getUnsyncedCount() > 0;
          self.syncResponses($scope);
        })

        .error(function(data, status){
          // Main.interceptResponse(data, status);
          $scope.data.isSyncing = false;
        });
    },

    syncImage: function(image, $scope){
      var self = this;
      self.syncing = true;
      $rootScope.$broadcast('updateStatus');
      // TODO: need to find if the image really exists
      // upload the image with cordova file-transfer
      var options = new FileUploadOptions();
      options.fileKey = "file";
      options.fileName = image.fileLocation.substr(image.fileLocation.lastIndexOf('/') + 1);
      options.mimeType = "image/jpeg";
      options.params = image;
      options.headers = { 'Authorization': PT_CONFIG.accessKey };
      var fileTransfer = new FileTransfer();
      fileTransfer.onprogress = function(result){
           var percent =  result.loaded / result.total * 100;
           percent = Math.round(percent);
           self.currentSyncPercentage = percent;
           $rootScope.$broadcast('updateStatus');
      };
      fileTransfer.upload(image.fileLocation, encodeURI(PT_CONFIG.aggregatorUrl + 'upload_image'),

        function(result){   // upload succeed
          if(typeof result.response != 'undefined'){
            self.removeImageFromUnsynced(image);
          }
          self.syncing = false;
          $rootScope.$broadcast('updateStatus');
          self.syncImages();
          self.currentSyncPercentage = 0;
          $rootScope.$broadcast('viewMap', image.survey_id);
        }, 

        function(error){   // upload failed
          // TODO: notify user of image upload failure
          self.currentSyncPercentage = 0;
          self.syncing =false;
          $rootScope.$broadcast('updateStatus');
        }, options);
    },

    syncResponses: function($scope){
      var self = this;
      if(self.unsynced.length>0){
        self.syncResponse(self.unsynced[0], $scope);
      }
    },

    syncImages: function($scope){
      var self = this;
      if(self.unsyncedImages.length>0){
        self.syncImage(self.unsyncedImages[0]);
      }
    },

    cancelResponse: function() {
      var confirmPopup = $ionicPopup.confirm({
        template: $filter('translate')('DELETE_RESPONSE'),
        buttons: [
          {
            text: $filter('translate')('CANCEL')
          },
          {
            text: $filter('translate')('DELETE'),
            type: 'button-pink',
            onTap: function(){ return true; }
          }
        ]
      });
      confirmPopup.then(function(res) {
        if(res) {
          self.currentResponse = {};
          $state.go('home');
        }
      });
    }
  };

  return service;
})
