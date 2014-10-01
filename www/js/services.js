angular.module('ptApp.services', [])

.factory('Survey', function($rootScope, $http){
  if(!localStorage['mySurveys']){
    localStorage['mySurveys'] = '{}';
  }

  var service = {
    baseUrl: 'http://localhost:9292/',
    surveys: JSON.parse(localStorage['mySurveys']),
    unsynced: [{survey_id: 1}, {survey_id: 2}],
    synced: [],

    currentSubmission: {
      survey_id: '',
      submission_timestamp: '',
      inputs: []
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

    downloadSurvey: function(survey_code, successCallback){
      var self = this;

      $http.get(this.baseUrl + "surveys/" + survey_code)
      .success(function(response){
        self.surveys[response.id] = response;
        localStorage['mySurveys'] = JSON.stringify(self.surveys);

        successCallback(response);
      })
    },

    loadStorage: function(){
      var surveys = [];
      var local_data = JSON.parse(localStorage['mySurveys']);

      for(var i in local_data){
        surveys.push(local_data[i]);
      }

      return surveys;
    },

    submitSurvey: function(submission){
      submission.submission_timestamp = Date.now();
      $http.post(this.baseUrl + 'submissions', { submission: submission })
      .success(function(response){
      });
    }  
  };

  return service;
});