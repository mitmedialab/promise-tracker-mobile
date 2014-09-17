angular.module('ptApp.services', [])

.factory('Survey', function($rootScope, $http){
  if(!localStorage['mySurveys']){
    localStorage['mySurveys'] = '{}';
  }

  var service = {
    baseUrl: 'http://localhost:3000/api/v1/surveys/',
    // baseUrl: 'http://dev.monitor.promisetracker.org/surveys/',
    unsynced: [{survey_id: 1}, {survey_id: 2}],
    synced: [],

    currentSubmission: {
      survey_id: '',
      timestamp: '',
      submissions: []
    },

    getSurvey: function(surveyId){
      var local_data = JSON.parse(localStorage['mySurveys']);
      return local_data[surveyId];
    },

    getInputs: function(surveyId){
      var local_data = JSON.parse(localStorage['mySurveys']);
      return local_data[surveyId].inputs;
    },

    getInput: function(surveyId, inputId){
      var local_data = JSON.parse(localStorage['mySurveys']);
      return local_data[surveyId].inputs[inputId];
    },

    loadStorage: function(){
      var surveys = [];
      var local_data = JSON.parse(localStorage['mySurveys'])

      for(var i in local_data){
        surveys.push(local_data[i]);
      }

      return surveys;
    },

    submitSurvey: function(){

      this.currentSubmission.timestamp = Date.now();
      $http.post(baseUrl + Survey.currentSubmission.survey_id).success(function(data){
      console.log(data);
      });
    }  
  };

  return service;
});