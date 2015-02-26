angular.module('ptApp', ['ionic', 'ptApp.controllers', 'ptApp.services', 'pascalprecht.translate', 'ptConfig'], function($httpProvider, PT_CONFIG){
    $httpProvider.defaults.headers.common['Authorization'] = PT_CONFIG.accessKey;
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

  /**
   * The workhorse; converts an object to x-www-form-urlencoded serialization.
   * @param {Object} obj
   * @return {String}
   */ 

  var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
      
    for(name in obj) {
      value = obj[name];
        
      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
      
    return query.length ? query.substr(0, query.length - 1) : query;
  };
 
  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
})

.run(function($ionicPlatform) {
  
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('home', {
      url: '/home',
      templateUrl: 'templates/home.html',
      controller: 'HomeCtrl'
    })
  
    .state('survey-start', {
      url: '/surveys/:surveyId/start',
      templateUrl: 'templates/survey-start.html',
      controller: 'SurveysCtrl'   
    })
  
    .state('input', {
      url: '/surveys/:surveyId/:inputId',
      templateUrl: 'templates/input.html',
      controller: 'InputsCtrl'   
    })

    .state('survey-end', {
      url: '/end/:surveyId/end',
      templateUrl: 'templates/survey-end.html',
      controller: 'SurveysCtrl'   
    })

    .state('user', {
      url: '/user',
      templateUrl: 'templates/user.html',
      controller: 'UsersCtrl'
    })

    $urlRouterProvider.otherwise('/home');
})

.config(['$translateProvider', function ($translateProvider) {
  $translateProvider.translations('en', {
    // Home page
    'APP_NAME': 'Promise Tracker',
    'MY_SURVEYS': 'My surveys',
    'GREETING': 'Welcome to Promise Tracker!',
    'GET_STARTED': 'To get started, download your first survey',
    'NEW_SURVEY': 'Get new survey',
    'RESPONSES': "You've responded {NUM, plural, one{once} other{ {NUM} times}}",
    'TESTING_ONLY': 'For testing only',
    'SURVEY_CODE': 'Survey code',
    'SURVEY_CODE_PROMPT': 'Enter your survey code below',
    'SURVEY_CODE_HELP': "If you don't have a code, talk with the campaign organizer",
    'GET_SURVEY': 'Get survey',
    'CANCEL': 'Cancel',
    'CLOSE': 'Close',
    'SHARE': 'Share',
    'VIEW_MAP_TEXT': 'To see the map for this survey, click below',
    'VIEW_MAP': 'View map',
    'INVITE_FRIENDS': 'Invite your friends to collect data!',

    // User page
    'MY_PROFILE': 'My profile',
    'USER_INFO': 'User information',
    'USERNAME': 'Username',
    'BIO': 'Bio',
    'ADD_BIO': 'Add bio',
    'EDIT_BIO': 'Edit',
    'SAVE': 'Save',
    'CAMPAIGNS': '{NUM, plural, one{data collection campaign} other{data collection campaigns}}',
    'SURVEYS': '{NUM, plural, one{survey} other{surveys}} completed',
    'DELETE_SURVEYS': 'Delete all survey forms',

    //Survey
    'NUMBER_OF_FIELDS': 'Total number of prompts',
    'START_DATE': 'Date this survey was launched',
    'END_DATE': 'End date',
    'START_SURVEY': 'Start survey',
    'NEXT': 'Next',
    'BACK': 'Back',
    'TAKE_PICTURE': 'Take a picture',
    'GET_LOCATION': 'Record location',
    'CHOOSE_ONE': 'Select one',
    'CHOOSE_MANY': 'Select all that apply',
    'YOUR_ANSWER': 'Your answer here...',
    'SURVEY_PROGRESS': 'Survey progress',
    'SURVEY_COMPLETE': 'You have completed the survey!',
    'SUBMIT_NOW': 'Submit now',
    'SUBMIT_LATER': 'Submit later',
    'CANCEL_AND_DELETE': 'Cancel and delete this response',

    //Errors, Alerts
    'ENTER_CODE': 'Please enter a survey code',
    'CODE_LENGTH': 'The survey code should be a total of 6 numbers.',
    '12': 'Survey not found. Please check code and try again.',
    'DELETE_RESPONSE': "Are you sure you want to delete this reponse? All data will be lost.",
    'DELETE_SURVEY': "Are you sure you want to delete this survey?",
    'DELETE': 'Delete',
    'UNSYNCED_SURVEYS': 'unsynced {NUM, plural, one{item} other{items}}',
    'SYNCING': 'Syncing',
    'SURVEY_SYNCED': 'Survey submitted',
    'SYNC_NOW': 'Sync',
    'REQUIRED': 'This question is required',
    'OFFLINE': 'No network connection. Please try again later'
  });

  $translateProvider.translations('pt-BR', {
    // Home page
    'APP_NAME': 'Monitorando a Cidade',
    'MY_SURVEYS': 'Meus formulários',
    'GREETING': 'Bem-vindo ao Monitorando a Cidade!',
    'GET_STARTED': 'Para começar, baixe seu primeiro formulário',
    'NEW_SURVEY': 'Baixar novo formulário',
    'RESPONSES': '{NUM, plural, one{registro} other{registros}}',
    'TESTING_ONLY': 'Esta copia é só para testar',
    'SURVEY_CODE': 'Código do formulário',
    'SURVEY_CODE_PROMPT': 'Digite o código do formulário',
    'SURVEY_CODE_HELP': "Se não tem um código, fala com o organizador da ação",
    'GET_SURVEY': 'Baixar formulário',
    'CANCEL': 'Cancelar',
    'CLOSE': 'Fechar',
    'SHARE': 'Compartilhar',
    'VIEW_MAP_TEXT': 'Para ver o mapa para este formulário, clique abaixo',
    'VIEW_MAP': 'Ver mapa',
    'INVITE_FRIENDS': 'Convide seus contatos para participar desta campanha',


     // User page
    'MY_PROFILE': 'Meu perfil',
    'USER_INFO': 'Dados do usuario',
    'USERNAME': 'Nome do Usuario',
    'BIO': 'Biografia',
    'ADD_BIO': 'Adicionar biografia',
    'EDIT_BIO': 'Editar',
    'SAVE': 'Salvar',
    'CAMPAIGNS': '{NUM, plural, one{ação} other{ações}}',
    'SURVEYS': '{NUM, plural, one{registro} other{registros}}',
    'DELETE_SURVEYS': 'Eliminar todos os formulários',

    //Survey
    'NUMBER_OF_FIELDS': 'Número de campos neste formulário',
    'START_DATE': 'Data de lançamento da campanha',
    'END_DATE': 'Data final',
    'START_SURVEY': 'Preencher formulário',
    'NEXT': 'Próximo',
    'BACK': 'Voltar',
    'TAKE_PICTURE': 'Tirar uma foto',
    'GET_LOCATION': 'Obter localização',
    'CHOOSE_ONE': 'Selecione uma',
    'CHOOSE_MANY': 'Selecione (pode ser mais de uma)',
    'YOUR_ANSWER': 'Sua resposta aqui...',
    'SURVEY_PROGRESS': 'Andamento',
    'SURVEY_COMPLETE': 'Parabéns! Você completou o formulário!',
    'SUBMIT_NOW': 'Enviar agora',
    'SUBMIT_LATER': 'Enviar depois',
    'CANCEL_AND_DELETE': 'Cancelar e eliminar este registro',

    //Errors, Alerts
    'ENTER_CODE': 'Por favor, digite o código do formulário',
    'CODE_LENGTH': 'O código do formulário deve ser 6 números',
    '12': 'Este formulário não existe. Por favor, verifique o código e tente novamente.',
    'DELETE_RESPONSE': 'Tem certeza que quer eliminar este registro?',
    'DELETE_SURVEY': 'Tem certeza que quer eliminar este formulário?',
    'DELETE': 'Eliminar',
    'UNSYNCED_SURVEYS': '{NUM, plural, one{registro} other{registros} sem salvar}',
    'SYNCING': 'Enviando',
    'SURVEY_SYNCED': 'Registro enviado',
    'SYNC_NOW': 'Enviar',
    'REQUIRED': 'Este campo é obrigatório',
    'OFFLINE': 'Sem internet. Por favor, verifique sua conexão.'
  });

  $translateProvider.addInterpolation('$translateMessageFormatInterpolation');
  $translateProvider.preferredLanguage('en');
}]);