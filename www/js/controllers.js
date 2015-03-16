angular.module('ptApp.controllers', ['ptConfig'])

.controller('HomeCtrl', function($scope, $ionicModal, $http, $state, $ionicPopup, $filter, $ionicListDelegate, Survey, PT_CONFIG, Main) {
  $scope.surveys = Survey.surveys;
  $scope.surveyCount = Object.keys($scope.surveys).length;
  $scope.responseCount = Survey.synced.length + Survey.unsynced.length;
  $scope.errorMessage = '';
  $scope.unsynced = Survey.unsynced.length + Survey.unsyncedImages.length;
  $scope.showNeedSyncStatus = Survey.hasUnsyncedItems();
  $scope.showSyncingStatus = Survey.isSyncing();

  $scope.$on('connectionError', function(){
    var alertPopup = $ionicPopup.alert({
      template: $filter('translate')('OFFLINE')
    });

    alertPopup.then(function(res) {
    });
  });

  $scope.$on('updateStatus', function(){
    var updateSyncStatus = function(){
      $scope.showNeedSyncStatus = Survey.hasUnsyncedItems();
      $scope.showSyncingStatus = Survey.isSyncing();
      $scope.syncMessage = Survey.getSyncMessage();
    }

    if(!$scope.$$phase){
      $scope.$apply(updateSyncStatus);
    } else {
      updateSyncStatus();
    }
    $state.go($state.current, {}, {reload: true});
  });

  $scope.$on('viewMap', function(scope, surveyId){
    if($scope.unsynced === 0 && $scope.surveys[surveyId].status != 'test'){
      $scope.viewMap(surveyId, 'SURVEY_SYNCED');
    }
  });

  $ionicModal.fromTemplateUrl(
    'enter-code.html', 
    function(modal){ $scope.codeModal = modal; }, 
    {
      scope: $scope,
      animation: 'slide-in-up',
      focusFirstInput: true
    }
  );

  $scope.viewMap = function(surveyId, titleText){
    var campaignId = Survey.getCampaignId(surveyId);
    var mapPopup = $ionicPopup.confirm({
      title: $filter('translate')(titleText),
      template: $filter('translate')('VIEW_MAP_TEXT'),
      buttons: [
        {
          text: $filter('translate')('CLOSE')
        },
        {
          text: $filter('translate')('VIEW_MAP'),
          type: 'button-positive',
          onTap: function(){ return true; }
        }
      ]
    });

    mapPopup.then(function(res) {
      if(res) {
        navigator.app.loadUrl(PT_CONFIG.campaignUrl + campaignId + '/share?map', {openExternal : true});
      }
    });
  };

  $scope.countSynced = function(surveyId){
    var completed = Survey.synced.concat(Survey.unsynced).filter(function(response){
      return response.survey_id == surveyId && response.status != 'test';
    });
    return completed.length;
  };

  $scope.deleteSurvey = function(surveyId){
    var confirmPopup = $ionicPopup.confirm({
      template: $filter('translate')('DELETE_CAMPAIGN'),
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
        delete Survey.surveys[surveyId];
        localStorage['surveys'] = JSON.stringify(Survey.surveys);
        $scope.surveyCount = Object.keys($scope.surveys).length;
      }
    });
  };

  $scope.shareSurvey = function(){
    alert($filter('translate')('INVITE_FRIENDS'));
  };

  $scope.openCodeModal = function(){
    Main.confirmInternetConnection(function(){
      $scope.codeModal.show();
      window.setTimeout(function(){
        cordova.plugins.Focus.focus(document.querySelector("input"));
      }, 150);
    });
  };

  $scope.closeCodeModal = function(){
    $scope.codeModal.hide();
    $scope.errorMessage = '';
  };

  $scope.fetchSurvey = function(survey){

    var success, error, sanitizedCode;

    success = function(data){
      Survey.surveys[data.payload.id] = data.payload;
      Survey.surveys[data.payload.id].start_date = new Date(data.payload.start_date).toLocaleDateString();
      localStorage['surveys'] = JSON.stringify(Survey.surveys);
      $scope.surveyLoading = false;
      $scope.codeModal.hide();
      $scope.errorMessage = '';
      $state.go($state.current, {}, {reload: true});
    };

    error = function(error_code){
      $scope.surveyLoading = false;
      $scope.errorMessage = (error_code.toString());
    };

    if(survey && survey.code){
      sanitizedCode = survey.code.toString().replace(/-/, '');

      if(sanitizedCode.length === 6){
        Main.confirmInternetConnection(function(){
          $scope.surveyLoading = true;
          Survey.fetchSurvey(sanitizedCode, success, error);
        });
      } else {
        $scope.errorMessage = 'CODE_LENGTH';
      }
    } else {
      $scope.errorMessage = 'ENTER_CODE';
    }
  };

  $scope.syncSurveys = function(){
    Main.confirmInternetConnection(function(){
      Survey.refreshSyncItemCount();
      Survey.syncResponses();
      Survey.syncImages();
    }); 
  };
})

.controller('SurveysCtrl', function($scope, $stateParams, $state, Survey) {
  $scope.survey = Survey.surveys[$stateParams.surveyId];
  $scope.responseSettings = {
    locationConsent: true
  };
  $scope.locationStamp = {};

  $scope.startSurvey = function(){
    Survey.queueNewResponse($stateParams.surveyId, $scope.responseSettings.locationConsent);
    $state.transitionTo('input', {
      surveyId: $stateParams.surveyId, 
      inputId: Survey.currentResponse.inputs[Survey.currentResponse.activeIndex].id
    })
  };

  $scope.submitResponse = function(){
    Survey.syncResponse(Survey.currentResponse);
    $state.go('home');
  };

  $scope.saveResponse = function(){
    Survey.addResponseToUnsynced(Survey.currentResponse);
    $state.go('home');
  };

  $scope.backToSurvey = function(){
    $state.go('input', {
      surveyId: $stateParams.surveyId, 
      inputId: Survey.currentResponse.inputs.length - 1
    });
  };

  $scope.cancelResponse = function() {
    Survey.cancelResponse();
  }
})

.controller('InputsCtrl', function($scope, $stateParams, $state, Survey, $ionicPopup, $filter){
  $scope.survey = Survey.surveys[$stateParams.surveyId];
  $scope.index = Survey.currentResponse.activeIndex;
  $scope.input = Survey.currentResponse.inputs[Survey.currentResponse.activeIndex];
  $scope.input.input_type == 'select' ? $scope.input.answer = $scope.input.answer || [] : false;
  $scope.errorMessage = '';

  $scope.getImage = function(){
    var onSuccess = function(imageURI){
      $scope.input.answer = imageURI;
      $state.go($state.current, {}, {reload: true});
    };
    var onError = function(){};

    navigator.camera.getPicture(onSuccess, onError, {
      limit: 1,
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      correctOrientation: true
    });
  };

  $scope.getLocation = function(){
    $scope.input.answer = $scope.input.answer || {};
    $scope.input.msg = $filter('translate')('GETTING_LOCATION');

    navigator.geolocation.getCurrentPosition(function(position){
      $scope.input.answer.lon = position.coords.longitude;
      $scope.input.answer.lat = position.coords.latitude;
      $scope.input.msg = '';
      $state.go($state.current, {}, {reload: true});
    });
  };

  $scope.inputValid = function(input){
    if(input.required == true){
      switch(input.input_type){
        case "location":
          return input.answer && input.answer.lat && input.answer.lon;
          break;
        case "select":
          return input.answer.filter(function(i) { return i == true;}).length > 0
          break;
        default:
          return input.answer && String(input.answer).length > 0;
          break;
      }
      return false;
    } else {
      return true;
    }
  };

  $scope.nextPrompt = function(currentInput){
    if($scope.inputValid(currentInput)){
      if(Survey.currentResponse.activeIndex < (Survey.currentResponse.inputs.length - 1)){
        Survey.currentResponse.activeIndex += 1;
        $state.transitionTo('input', {
          surveyId: $stateParams.surveyId,
          inputId: Survey.currentResponse.inputs[Survey.currentResponse.activeIndex].id
        });
      } else {
        $state.go('survey-end', {surveyId:  $scope.survey.id});
      }
    } else {
      $scope.errorMessage = 'REQUIRED';
      console.log('REQUIRED');
    }
  };

  $scope.previousPrompt = function(){
    if(Survey.currentResponse.activeIndex > 0){
      Survey.currentResponse.activeIndex -= 1;
      $state.go('input', {
        surveyId: $stateParams.surveyId, 
        inputId: Survey.currentResponse.inputs[Survey.currentResponse.activeIndex].id
      });
    }
  };

  $scope.cancelResponse = function() {
    Survey.cancelResponse();
  }
})

.controller('UsersCtrl', function($scope, $stateParams, $state, $location, $ionicModal, Survey, Main) {
  $scope.surveys = Object.keys(Survey.surveys);
  $scope.responses = Survey.synced.filter(function(response){return response.status != 'test'});
  $scope.user = Main.user;

  $ionicModal.fromTemplateUrl(
    'user-info.html', 
    function(modal){ $scope.userModal = modal; }, 
    {
      scope: $scope,
      animation: 'slide-in-up',
      focusFirstInput: true
    }
  );

  $scope.deleteSurveys = function() {
    Survey.surveys = {};
    localStorage['surveys'] = '{}'
  };

  $scope.openUserModal = function(){
    $scope.userModal.show();
  };

  $scope.closeUserModal = function(){
    $scope.userModal.hide();
  };

  $scope.updateUser = function(){
    Main.updateUserInfo();
    $scope.userModal.hide();
  };
});