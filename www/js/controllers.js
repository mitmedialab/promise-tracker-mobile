angular.module('ptApp.controllers', [])

.controller('HomeCtrl', function($scope, $ionicModal, $http, $state, Survey) {
  $scope.surveys = Survey.surveys;
  $scope.errorMessage = '';

  $ionicModal.fromTemplateUrl(
    'enter-code.html', 
    function(modal){ $scope.codeModal = modal; }, 
    {
      scope: $scope,
      animation: 'slide-in-up',
      focusFirstInput: true
    }
  );

  $scope.openCodeModal = function(){
    $scope.codeModal.show();
  };

  $scope.closeCodeModal = function(){
    $scope.codeModal.hide();
    $scope.errorMessage = '';
  };

  $scope.fetchSurvey = function(survey){
    var success = function(response){
      if(response.id){
        $scope.codeModal.hide();
        $scope.errorMessage = '';
        $state.go($state.current, {}, {reload: true});
      } else {
        $scope.errorMessage = 'Survey not found. Please check code and try again.';
      }
    };

    var error = function(){
      $scope.errorMessage = 'Survey could not be downloaded. Please check your network connection and try again.';
    };

    if(survey){
      Survey.fetchSurvey(survey.code, success, error);
    } else {
      $scope.errorMessage = 'Please enter a survey code.';
    }
  };

  $scope.getUnsynced = function(){
    return Survey.unsynced.length;
  }

  $scope.syncSurveys = function(){
    Survey.syncResponses();
  }
})

.controller('EndCtrl', function($scope, $stateParams, $state, Survey, $location, $http) {
  $scope.survey = Survey.surveys[$stateParams.surveyId];

  $scope.submitResponse = function(){
    Survey.currentResponse.timestamp = Date.now();
    Survey.syncResponse(Survey.currentResponse);
    $state.go('home');
  };

  $scope.saveResponse = function(){
    Survey.currentResponse.timestamp = Date.now();
    Survey.addToUnsynced(Survey.currentResponse);
    $state.go('home');
  };

  $scope.backToSurvey = function(){
    $state.go('input', {
      surveyId: $stateParams.surveyId, 
      inputId: Survey.currentResponse.inputs.length - 1
    });
  }
})

.controller('UsersCtrl', function($scope, $stateParams, $state, Survey, $location) {
  $scope.surveys = Object.keys(Survey.surveys);
  $scope.responses = Survey.synced;
})

.controller('SurveysCtrl', function($scope, $stateParams, $state, Survey, $location) {
  $scope.survey = Survey.surveys[$stateParams.surveyId];

  $scope.startSurvey = function(){
    Survey.queueNewResponse($stateParams.surveyId);
    $state.transitionTo('input', {
      surveyId: $stateParams.surveyId, 
      inputId: Survey.currentResponse.inputs[Survey.currentResponse.activeIndex].id
    })
  };
})

.controller('InputsCtrl', function($scope, $stateParams, $state, Survey){
  $scope.survey = Survey.surveys[$stateParams.surveyId];
  $scope.index = Survey.currentResponse.activeIndex;
  $scope.input = Survey.currentResponse.inputs[Survey.currentResponse.activeIndex];
  $scope.input.input_type == 'select' ? $scope.input.answer = $scope.input.answer || [] : false;

  $scope.getImage = function(){
    var onSuccess = function(imageURI){
      $scope.input.answer = imageURI;
      $state.go($state.current, {}, {reload: true});
    };
    var onError = function(){};

    navigator.camera.getPicture(onSuccess, onError, {
      limit: 1,
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI
    });
  }

  $scope.getLocation = function(){
    $scope.input.answer = $scope.input.answer || {};
    $scope.input.msg = 'Getting Location...';

    navigator.geolocation.getCurrentPosition(function(position){
      $scope.input.answer.lng = position.coords.longitude;
      $scope.input.answer.lat = position.coords.latitude;
      $scope.input.msg = '';
      $state.go($state.current, {}, {reload: true});
    });
  };

  $scope.nextPrompt = function(){
    if(Survey.currentInputIndex < (Survey.currentResponse.inputs.length - 1)){
      Survey.currentResponse.activeIndex += 1;
      $state.transitionTo('input', {
        surveyId: $stateParams.surveyId, 
        inputId: Survey.currentResponse.inputs[Survey.currentResponse.activeIndex].id
      });
    } else {
      $state.go('survey-end', {surveyId:  $scope.survey.id});
    }
  };

  $scope.previousPrompt = function(){
    if(Survey.currentInputIndex > 0){
      Survey.currentInputIndex -= 1;
      $state.go('input', {
        surveyId: $stateParams.surveyId, 
        inputId: Survey.currentResponse.inputs[Survey.currentResponse.activeIndex.id]
      });
    }
  };
});