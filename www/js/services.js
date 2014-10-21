angular.module('ptApp.services', [])

.factory('Survey', function($rootScope, $http){
  localStorage['surveys'] = localStorage['surveys'] || '{}';
  localStorage['unsynced'] = localStorage['unsynced'] || '[]';
  localStorage['synced'] = localStorage['synced'] || '[]';

  var service = {
    baseUrl: 'http://dev.aggregate.promisetracker.org/',
    surveys: JSON.parse(localStorage['surveys']),
    unsynced: JSON.parse(localStorage['unsynced']),
    synced: JSON.parse(localStorage['synced']),
    currentResponse: {},

    fetchSurvey: function(surveyCode, successCallback, errorCallback){
      var self = this;
      $http.get(this.baseUrl + "surveys/" + surveyCode)
      .success(function(data){
        successCallback(data);
      })
      .error(errorCallback);
    },

    queueNewResponse: function(surveyId){
      this.currentResponse = {
        survey_id: surveyId,
        timestamp: '',
        inputs: JSON.parse(JSON.stringify(this.surveys[surveyId].inputs)),
        activeIndex: 0
      };
    },

    addToUnsynced: function(response){
      var index = this.unsynced.indexOf(response);
      if(index == -1){
        this.unsynced.push(response);
        localStorage['unsynced'] = JSON.stringify(this.unsynced);
      }
    },

    addToSynced: function(response){
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
        survey_id: response.survey_id,
        timestamp: response.timestamp,
        answers: []
      };

      response.inputs.forEach(function(input){
        var answer = { id: input.id, value: input.value };

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
      $http.post(
        this.baseUrl + 'responses', 
        { response: JSON.stringify(formattedResponse) }
      )
      .success(function(){
        self.addToSynced(response);
      })
      .error(function(response){
        self.addToUnsynced(response);
      });
    },

    syncResponses: function(){
      var self = this;
      this.unsynced.forEach(function(response){
        self.syncResponse(response);
      })
    } 
  };

  return service;
});