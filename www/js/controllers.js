angular.module('ptApp.controllers', [])

.controller('HomeCtrl', function($scope, $ionicModal, $http, $state, Survey) {
  $scope.surveys = Survey.loadStorage();

  $ionicModal.fromTemplateUrl(
    'enter-code.html', 
    function(modal){ $scope.enterCodeModal = modal; }, 
    {
      scope: $scope,
      animation: 'slide-in-up',
      focusFirstInput: true
    }
  );

  $scope.openCodeModal = function(){
    $scope.enterCodeModal.show();
  };

  $scope.closeCodeModal = function(){
    $scope.enterCodeModal.hide();
  };

  $scope.fetchSurvey = function(survey){
    var local_data = JSON.parse(localStorage['mySurveys']);

    $http.get(Survey.baseUrl + survey.code + '.json').success(function(data){
      console.log(data);

      if(data.inputs.length > 0){
        local_data[data.survey.id] = data;
        localStorage['mySurveys'] = JSON.stringify(local_data);

        $scope.enterCodeModal.hide();
        Survey.errorMessage = '';
        $state.go($state.current, {}, {reload: true});
      } else {
        Survey.errorMessage = 'This survey is blank. Please try another code.'
      }
    }).error(function(){
      Survey.errorMessage = 'Survey not found. Please check code and try again.'
    });

    survey.code = '';
  };

  $scope.getUnsynced = function(){
    return Survey.unsynced.length;
  }

  $scope.syncSurveys = function(){
    // Simulate sync - to be implemented
    Survey.unsynced = [];
  }
})

.controller('EndCtrl', function($scope, $stateParams, $state, Survey, $location) {
  $scope.survey = Survey.getSurvey($stateParams.surveyId);

  // Simulate submit & save - to be implemented
  $scope.submitSurvey = function(){
    $state.go('home');
  };

  $scope.saveSurvey = function(){
    Survey.unsynced.push({});
    $state.go('home');
  };

  $scope.backToSurvey = function(){
    $state.go('input', {
      surveyId: $stateParams.surveyId, 
      inputId: Survey.currentSubmission.inputs.length - 1
    });
  }
})

.controller('UsersCtrl', function($scope, $stateParams, $state, Survey, $location) {
})

.controller('SurveysCtrl', function($scope, $stateParams, $state, Survey, $location) {
  $scope.survey = Survey.getSurvey($stateParams.surveyId);

  $scope.startSurvey = function(){
    Survey.currentSubmission.inputs = Survey.getInputs($stateParams.surveyId);
    Survey.currentSubmission.survey_id = $stateParams.surveyId;
    Survey.currentInputIndex = 0;

    $state.transitionTo('input', {
      surveyId: $stateParams.surveyId, 
      inputId: Survey.currentSubmission.inputs[Survey.currentInputIndex]
    })
  };
})

.controller('InputsCtrl', function($scope, $stateParams, $state, Survey){
  $scope.survey = Survey.getSurvey($stateParams.surveyId);
  $scope.input = Survey.currentSubmission.inputs[Survey.currentInputIndex];
  $scope.index = Survey.currentInputIndex;
  $scope.input.answerOptions = $scope.input.answerOptions || [];

  $scope.getImage = function(){

    var onSuccess = function(imageURI){
      $scope.input.imageData = imageURI;
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
    $scope.input.msg = 'Getting Location...';
    navigator.geolocation.getCurrentPosition(function(position){
      $scope.input.longData = position.coords.longitude;
      $scope.input.latData = position.coords.latitude;
      $scope.input.msg = '';
      $state.go($state.current, {}, {reload: true});
    });
  };

  $scope.nextPrompt = function(){
    if(Survey.currentInputIndex < (Survey.currentSubmission.inputs.length - 1)){
      Survey.currentInputIndex += 1;
      $state.transitionTo('input', {
        surveyId: $stateParams.surveyId, 
        inputId: Survey.currentSubmission.inputs[Survey.currentInputIndex].id
      });
    } else {
      $state.go('survey-end', {surveyId:  $scope.survey.survey.id});
    }
  };

  $scope.previousPrompt = function(){
    if(Survey.currentInputIndex > 0){
      Survey.currentInputIndex -= 1;
      $state.go('input', {
        surveyId: $stateParams.surveyId, 
        inputId: Survey.currentSubmission.inputs[Survey.currentInputIndex.id]
      });
    }
  };
})