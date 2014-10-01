angular.module('ptApp.services', [])

.factory('Survey', function($rootScope, $http){
  if(!localStorage['mySurveys']){
    localStorage['mySurveys'] = '{}';
  }

  if(!localStorage['unscyncedResponses']){
    localStorage['unscyncedResponses'] = '[]';
  }

  var service = {
    baseUrl: 'http://localhost:9292/',
    surveys: JSON.parse(localStorage['mySurveys']),
    unsynced: JSON.parse(localStorage['unscyncedResponses']),
    synced: [],

    currentResponse: {},

    getSurvey: function(surveyId){
      return this.surveys[surveyId];
    },

    getInputs: function(surveyId){
      return this.surveys[surveyId].inputs;
    },

    getInput: function(surveyId, inputId){
      return this.survyes[surveyId].inputs[inputId];
    },

    downloadSurvey: function(survey_code, successCallback){
      var self = this;

      $http.get(this.baseUrl + "surveys/" + survey_code)
      .success(function(data){
        self.surveys[data.id] = data;
        localStorage['mySurveys'] = JSON.stringify(self.mySurveys);

        successCallback(data);
      })
    },

    formatResponse: function(response){
      var formattedResponse = {
        survey_id: response.survey_id,
        timestamp: response.timestamp,
        answers: []
      };

      response.inputs.forEach(function(input){
        var answer = {
          id: input.id,
          value: input.answer
        }

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

      $http.post(this.baseUrl + 'responses', { response: JSON.stringify(formattedResponse) })
      .success(function(data){
        console.log("Submitted response");
      })
      .error(function(){
        self.unsynced.push(response);
        localStorage['unsyncedResponses'] = JSON.stringify(self)
        // Add validation for duplicates
      })
    },

    syncAll: function(){
      this.unsynced.forEach(function(response){
        self.syncResponse(response);
      })
    } 
  };

  return service;
});