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
    var success = function(data){
      Survey.surveys[data.payload.id] = data.payload;
      localStorage['surveys'] = JSON.stringify(Survey.surveys);
      $scope.codeModal.hide();
      $scope.errorMessage = '';
      $state.go($state.current, {}, {reload: true});
    };

    var error = function(error_code){
      $scope.errorMessage = (error_code.toString());
    };

    if(survey && survey.code){
      Survey.fetchSurvey(survey.code, success, error);
    } else {
      $scope.errorMessage = 'ENTER_CODE';
    }
  };

  $scope.getUnsynced = function(){
    return Survey.unsynced.length;
  };

  $scope.syncSurveys = function(){
    Survey.syncResponses();
  };
})

.controller('EndCtrl', function($scope, $stateParams, $state, $location, $http, Survey) {
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
  };

  $scope.cancelResponse = function(){
    Survey.currentResponse = {};
    $state.go('home');
  };
})

.controller('UsersCtrl', function($scope, $stateParams, $state, $location, $ionicModal, Survey, User) {
  $scope.surveys = Object.keys(Survey.surveys);
  $scope.responses = Survey.synced;
  $scope.user = User.user;

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
    User.updateInfo();
    $scope.userModal.hide();
  };
})

.controller('SurveysCtrl', function($scope, $stateParams, $state, $location, Survey) {
  $scope.survey = Survey.surveys[$stateParams.surveyId];
  $scope.survey.start_date = new Date($scope.survey.start_date).toLocaleDateString();

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
  };

  $scope.getLocation = function(){
    $scope.input.value = $scope.input.value || {};
    $scope.input.msg = 'Getting Location...';

    navigator.geolocation.getCurrentPosition(function(position){
      $scope.input.value.lon = position.coords.longitude;
      $scope.input.value.lat = position.coords.latitude;
      $scope.input.msg = '';
      $state.go($state.current, {}, {reload: true});
    });
  };

  $scope.nextPrompt = function(){
    if(Survey.currentResponse.activeIndex < (Survey.currentResponse.inputs.length - 1)){
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
    if(Survey.currentResponse.activeIndex > 0){
      Survey.currentResponse.activeIndex -= 1;
      $state.go('input', {
        surveyId: $stateParams.surveyId, 
        inputId: Survey.currentResponse.inputs[Survey.currentResponse.activeIndex.id]
      });
    }
  };
});