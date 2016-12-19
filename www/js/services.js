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

    confirmInternetConnection: function(successCallback, errorCallback, showPopup){
      if(window.Connection && navigator.connection.type !== Connection.NONE) {
        successCallback();  
      } else {
        showPopup ? $rootScope.$broadcast('connectionError') : false;
        errorCallback ? errorCallback() : false;
      }
    }
  }
  
  if(!localStorage['installationId']){
    service.setInstallationId(PT_CONFIG.aggregatorUrl);
  }

  return service;
})

.factory('Survey', function($rootScope, $http, $ionicPopup, $state, $filter, $location, $timeout, PT_CONFIG, Main){
  localStorage['surveys'] = localStorage['surveys'] || '{}';
  localStorage['unsyncedResponses'] = localStorage['unsyncedResponses'] || '[]';
  localStorage['syncedResponses'] = localStorage['syncedResponses'] || '[]';
  localStorage['unsyncedImages'] = localStorage['unsyncedImages'] || '[]';
  localStorage['syncedImages'] = localStorage['syncedImages'] || '[]';

  var service = {
    surveys: JSON.parse(localStorage['surveys']),
    unsyncedResponses: JSON.parse(localStorage['unsyncedResponses']),
    syncedResponses: JSON.parse(localStorage['syncedResponses']),
    unsyncedImages: JSON.parse(localStorage['unsyncedImages']),
    syncedImages: JSON.parse(localStorage['syncedImages']),
    currentResponse: {},
    syncing: false,
    findingLocation: false,

    hasUnsyncedResponses: function(){
      return this.unsyncedResponses.length > 0;
    },

    hasUnsyncedImages: function(){
      return this.unsyncedImages.length > 0
    },

    hasUnsyncedItems: function(){
      return this.hasUnsyncedResponses() || this.hasUnsyncedImages();
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
          } else if(errorCallback) {
            errorCallback('ERROR_' + data.error_code.toString());
          }
        })

        .error(function(data, status){
          Main.interceptResponse(data, status);
        });
    },

    openVizLink: function(surveyId, $event){
      $event.preventDefault();
      var campaignId = this.getCampaignId(surveyId);
      var ref = window.open(PT_CONFIG.campaignUrl + campaignId + '/share?locale=' + $filter('translate')('LOCALE'), '_blank', 'location=yes', 'closebuttoncaption=X');
      ref.addEventListener('exit', function(){
        ref.close();
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

    getLocation: function(locationObject, displayMap){
      var self = this;
      self.findingLocation = true;

      var success = function(position){
        locationObject.lon = position.coords.longitude;
        locationObject.lat = position.coords.latitude;

        if(!self.currentResponse.locationstamp.lon){
          self.currentResponse.locationstamp.lon = position.coords.longitude;
          self.currentResponse.locationstamp.lat = position.coords.latitude;
        }

        $timeout(function(){
          self.findingLocation = false;
        });

        if(displayMap){
          self.renderMap(locationObject);

          if(!window.Connection || navigator.connection.type == Connection.NONE){
            scope.location.message = $filter('translate')('LOCATION') + ": " + locationObject.lat + ", " + locationObject.lon;
          }
        }
      };

      var error = function(){
        locationObject.lon = null;
        locationObject.lat = null;
        self.findingLocation = false;

        $rootScope.$broadcast('locationTimeout', {location: locationObject});
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
      var index = this.unsyncedResponses.indexOf(response);
      if(index == -1){
        this.unsyncedResponses.push(response);
        localStorage['unsyncedResponses'] = JSON.stringify(this.unsyncedResponses);
      }
    },

    removeResponseFromUnsynced: function(response){
      var index = this.unsyncedResponses.indexOf(response);
      if(index > -1){
        this.unsyncedResponses.splice(index, 1);
        localStorage['unsyncedResponses'] = JSON.stringify(this.unsyncedResponses);
      }

    },

    addResponseToSynced: function(formattedResponse){
      this.syncedResponses.push(formattedResponse);
      localStorage['syncedResponses'] = JSON.stringify(this.syncedResponses)
    },

    refreshSyncItemCount: function(){
      this.currentSyncItemTotal = this.unsyncedImages.length + this.unsyncedResponses.length;
    },

    getSyncMessage: function(){
      var itemsToGo = this.unsyncedImages.length + this.unsyncedResponses.length;
      var message = (this.currentSyncItemTotal-itemsToGo+1) + '/' + this.currentSyncItemTotal;
      if(this.currentSyncPercentage > 0 && this.currentSyncPercentage < 100){
        message += " " + this.currentSyncPercentage + "%";
      }
      return message;
    },

    addImagesToUnsynced: function(response){
      var self = this;
      // Search for images in the survey response
      response.answers.forEach(function(answer){
        if(answer.input_type == 'image' && answer.value.length > 0){
          if(Array.isArray(answer.value)){
            answer.value.forEach(function(image){
              self.unsyncedImages.push({id: response.id, survey_id: response.survey_id, input_id: answer.id, fileLocation: image});
            })
          } else {
            self.unsyncedImages.push({id: response.id, survey_id: response.survey_id, input_id: answer.id, fileLocation: answer.value});
          }
        }
      });
      localStorage['unsyncedImages'] = JSON.stringify(self.unsyncedImages);
      self.syncImages();
    },

    addImageToSynced: function(image){
      var self = this;
      var index = self.unsyncedImages.indexOf(image);
      self.syncedImages.push(image);
      localStorage['syncedImages'] = JSON.stringify(self.syncedImages);

      if(index > -1){
        self.unsyncedImages.splice(index, 1);
        localStorage['unsyncedImages'] = JSON.stringify(self.unsyncedImages);

        if(self.hasUnsyncedItems()){
          self.syncResponses();
        } else {
          self.syncing = false;
          $rootScope.$broadcast('viewMap', image.survey_id);
        }
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

    syncResponse: function(response){
      var self = this;
      var formattedResponse = self.formatResponse(response);

      self.syncing = true;

      $http.post(
        PT_CONFIG.aggregatorUrl + 'responses', 
        { response: JSON.stringify(formattedResponse) }
      )
        .success(function(data){
          if(data['status'] == 'success'){
            self.removeResponseFromUnsynced(response);

            formattedResponse.id = data.payload.id;
            self.addResponseToSynced(formattedResponse);
            self.addImagesToUnsynced(formattedResponse);
          } else if(data['status'] == "error"){
            $rootScope.$broadcast('notifyError', data.error_code)
          }

          if(self.hasUnsyncedItems()) {
            self.syncResponses();
          } else {
            self.syncing = false;
          }
        })

        .error(function(data, status){
          console.log("upload fail");
          self.syncing = false;
        });
    },

    syncResponses: function(){
      var self = this;
      if(self.hasUnsyncedResponses()){
        self.syncResponse(self.unsyncedResponses[0]);
      } else if(self.hasUnsyncedImages()){
        self.syncImages();
      }
    },

    syncImage: function(image){
      var self = this;
      self.syncing = true;
      // TODO: need to find if the image really exists
      // upload the image with cordova file-transfer
      var options = new FileUploadOptions();
      options.fileKey = "file";
      options.fileName = image.fileLocation.substr(image.fileLocation.lastIndexOf('/') + 1);
      options.mimeType = "image/jpeg";
      options.params = image;
      options.headers = { 'Authorization': PT_CONFIG.accessKey };

      var fileTransfer = new FileTransfer();
      fileTransfer.upload(image.fileLocation, encodeURI(PT_CONFIG.aggregatorUrl + 'upload_image'),

        function(result){   // upload succeed
          if(typeof result.response != 'undefined'){
            self.addImageToSynced(image);
          } else {
            self.syncing = false;
          }
        }, 

        function(error){   // upload failed
          // TODO: notify user of image upload failure
          self.syncing = false;
          $rootScope.$broadcast('updateSyncing');
        }, options);
    },

    syncImages: function(){
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
