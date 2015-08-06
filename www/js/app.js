angular.module('ptApp', ['ionic', 'ptApp.controllers', 'ptApp.services', 'pascalprecht.translate', 'ptConfig', 'ui.mask'], function($httpProvider, PT_CONFIG){
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

.config(function ($translateProvider) {
  $translateProvider.translations('es', {
    // Home page
    'APP_NAME': 'Promise Tracker',
    'LOCALE': 'es',
    'MY_CAMPAIGNS': 'Mis campañas',
    'GREETING': 'Bienvenido a Promise Tracker!',
    'GET_STARTED': 'Para comenzar, descarga tu primera campaña',
    'CODE_TIP': 'Cada campaña tiene un código asociado a ella. Obten el código del organizador de la campaña o crea tu propia campaña en monitor.promisetracker.org.',
    'RESPONSES_TO_DATE': "{NUM, plural, one{Has contestado una} 0{¡Comienza con tu primer respuesta!} other{Has contestado {NUM} veces}}",
    'TESTING_ONLY': 'Copia de prueba',
    'CAMPAIGN_CODE': 'Código de campaña',
    'CAMPAIGN_CODE_PROMPT': 'Ingresa tu código de campaña abajo',
    'CAMPAIGN_CODE_HELP': "Si no tienes un código habla con el organizador de la campaña",
    'GET_CAMPAIGN': 'Obtener nueva campaña',
    'DOWNLOAD': 'Descargar',
    'CANCEL': 'Cancelar',
    'CLOSE': 'Cerrar',
    'SHARE': 'Compartir',
    'VIEW_MAP_TEXT': 'Para ver el mapa de esta campaña da clic abajo',
    'VIEW_MAP': 'Ver mapa',

    // User page
    'MY_PROFILE': 'Mi perfil',
    'USER_INFO': 'Información del usuario',
    'USERNAME': 'Nombre de usuario',
    'BIO': 'Biografía',
    'ADD_BIO': 'Agregar biografía',
    'EDIT_BIO': 'Editar',
    'SAVE': 'Guardar',
    'RESPONSES': '{NUM, plural, one{respuesta} other{respuestas}} completadas',

    //Survey
    'CAMPAIGN_CODE': 'Código de campaña',
    'GET_NEW_VERSION': 'Obtener la version más reciente',
    'LOCATION_CONSENT': 'Permitir conocer mi ubicación',
    'START_RESPONSE': 'Comenzar encuesta',
    'LOCATION_CONSENT': 'Permitir que se guarde mi ubicación',
    'NEXT': 'Siguiente',
    'BACK': 'Atrás',
    'TAKE_PICTURE': 'Tomar una fotografía',
    'GET_LOCATION': 'Obtener ubicación',
    'GETTING_LOCATION': 'Buscando ubicación',
    'LOCATION_RECORDED': '¡Listo!',
    'LOCATION_NOT_FOUND': 'Ubicación no encontrada',
    'LOCATION_TIMEOUT': 'Por favor confirme que los servicios de ubicación estén activados.',
    'RETRY': 'Tratar de nuevo',
    'SKIP_LOCATION': 'Omitir ubicación',
    'LOCATION_MISSING': 'No se guardó ninguna ubicación para esta respuesta. ¿Tratar de nuevo?',
    'LOCATION': 'Ubicación',
    'CHOOSE_ONE': 'Seleccionar una',
    'CHOOSE_MANY': 'Seleccionar todas las que apliquen',
    'YOUR_ANSWER': 'Tu respuesta aquí...',
    'ALL_SET': '¡Listo!',
    'RESPONSE_COMPLETE': 'Has finalizado la encuesta.',
    'SUBMIT_NOW': 'Enviar ahora',
    'SUBMIT_LATER': 'Enviar después',
    'CANCEL_AND_DELETE': 'Cancelar y borrar esta respuesta',

    //Errors, Alerts
    'ENTER_CODE': 'Por favor incerte un código de campaña',
    'CODE_LENGTH': 'El código de la campaña debe ser de 6 números.',
    '12': 'Encuesta no encontrada. Por favor verifica el código e intenta de nuevo.',
    'DELETE_RESPONSE': "¿Estás seguro que deseas eliminar esta respuesta? Todos los datos se perderán.",
    'DELETE_CAMPAIGN': "¿Estás seguro que deseas eliminar esta campaña de la lista?",
    'DELETE': 'Eliminar',
    'UNSYNCED_RESPONSES': "{NUM, plural, other{Elementos}} sin enviar!",
    'SYNCING': 'Enviando',
    'RESPONSE_SYNCED': '¡Encuesta enviada!',
    'ALL_SYNCED': 'Todo enviado',
    'SYNC_NOW': 'Enviar',
    'REQUIRED': 'Esta pregunta es requerida',
    'OFFLINE': 'Sin conexión. Por favor intenta después'
  });

  $translateProvider.translations('en', {
    // Home page
    'APP_NAME': 'Promise Tracker',
    'LOCALE': 'en',
    'MY_CAMPAIGNS': 'My campaigns',
    'GREETING': 'Welcome to Promise Tracker!',
    'GET_STARTED': 'To get started, download your first campaign',
    'CODE_TIP': 'Every campaign has a code associated with it. Get the code from the campaign organizers or create your own campaign at monitor.promisetracker.org.',
    'RESPONSES_TO_DATE': "{NUM, plural, one{You've responded once} 0{Get started on your first response!} other{You've responded {NUM} times}}",
    'TESTING_ONLY': 'Testing copy',
    'CAMPAIGN_CODE': 'Campaign code',
    'CAMPAIGN_CODE_PROMPT': 'Enter your campaign code below',
    'CAMPAIGN_CODE_HELP': "If you don't have a code, talk with the campaign organizer",
    'GET_CAMPAIGN': 'Get new campaign',
    'DOWNLOAD': 'Download',
    'CANCEL': 'Cancel',
    'CLOSE': 'Close',
    'SHARE': 'Share',
    'VIEW_MAP_TEXT': 'To see the map for this campaign, click below',
    'VIEW_MAP': 'View map',

    // User page
    'MY_PROFILE': 'My profile',
    'USER_INFO': 'User information',
    'USERNAME': 'Username',
    'BIO': 'Bio',
    'ADD_BIO': 'Add bio',
    'EDIT_BIO': 'Edit',
    'SAVE': 'Save',
    'RESPONSES': '{NUM, plural, one{response} other{responses}} completed',

    //Survey
    'CAMPAIGN_CODE': 'Campaign code',
    'GET_NEW_VERSION': 'Get newest version',
    'LOCATION_CONSENT': 'Allow my location to be recorded',
    'START_RESPONSE': 'Start survey',
    'NEXT': 'Next',
    'BACK': 'Back',
    'TAKE_PICTURE': 'Take a picture',
    'GET_LOCATION': 'Get location',
    'GETTING_LOCATION': 'Getting location',
    'LOCATION_RECORDED': 'Got it!',
    'LOCATION_NOT_FOUND': 'Location not found',
    'LOCATION_TIMEOUT': "Please ensure location services are enabled in your phone's settings.",
    'RETRY': 'Retry',
    'SKIP_LOCATION': 'Skip location',
    'LOCATION_MISSING': 'No location was recorded for this response. Try again?',
    'LOCATION': 'Location',
    'CHOOSE_ONE': 'Select one',
    'CHOOSE_MANY': 'Select all that apply',
    'YOUR_ANSWER': 'Your answer here...',
    'ALL_SET': 'All set!',
    'RESPONSE_COMPLETE': 'You have completed the survey.',
    'SUBMIT_NOW': 'Submit now',
    'SUBMIT_LATER': 'Submit later',
    'CANCEL_AND_DELETE': 'Cancel and delete this response',

    //Errors, Alerts
    'ENTER_CODE': 'Please enter a campaign code',
    'CODE_LENGTH': 'The campaign code should be a total of 6 numbers.',
    '12': 'Campaign not found. Please check code and try again.',
    'DELETE_RESPONSE': "Are you sure you want to delete this reponse? All data for this response will be lost.",
    'DELETE_CAMPAIGN': "Are you sure you want to delete this campaign from your list?",
    'DELETE': 'Delete',
    'UNSYNCED_RESPONSES': "Unsynced {NUM, plural, other{items}}!",
    'SYNCING': 'Syncing',
    'RESPONSE_SYNCED': 'Response sent!',
    'ALL_SYNCED': 'All synced',
    'SYNC_NOW': 'Sync now',
    'REQUIRED': 'This question is required',
    'OFFLINE': 'No network connection. Please try again later'
  });

  $translateProvider.translations('pt', {
    // Home page
    'APP_NAME': 'Monitorando a Cidade',
    'LOCALE': 'pt-BR',
    'MY_CAMPAIGNS': 'Minhas campanhas',
    'GREETING': 'Bem-vindo ao Monitorando a Cidade!',
    'APP_DESCRIPTION': 'Com este aplicativo você poderá participar de campanhas de coleta de dados criadas no módulo Web.',
    'GET_STARTED': 'Para começar, baixe sua primeira campanha!',
    'CODE_TIP': 'Toda campanha tem um código associado a ela. Obtenha o código com os organizadores da campanha ou crie sua própria campanha no site monitorandoacidade.org.',
    'RESPONSES_TO_DATE': "{NUM, plural, one{Você já completou um registro} 0{Preencha seu primeiro registro!} other{Você já completou {NUM} registros}}",
    'TESTING_ONLY': 'Versão de teste',
    'CAMPAIGN_CODE_PROMPT': 'Digite o código da campanha',
    'CAMPAIGN_CODE_HELP': "Se não tem um código, fala com o organizador da ação",
    'GET_CAMPAIGN': 'Baixar nova campanha',
    'DOWNLOAD': 'Baixar',
    'CANCEL': 'Cancelar',
    'CLOSE': 'Fechar',
    'SHARE': 'Compartilhar',
    'VIEW_MAP_TEXT': 'Para ver o mapa para esta campanha, clique abaixo',
    'VIEW_MAP': 'Ver mapa',


     // User page
    'MY_PROFILE': 'Meu perfil',
    'USER_INFO': 'Dados do usuario',
    'USERNAME': 'Nome do Usuario',
    'BIO': 'Biografia',
    'ADD_BIO': 'Adicionar biografia',
    'EDIT_BIO': 'Editar',
    'SAVE': 'Salvar',
    'RESPONSES': '{NUM, plural, one{registro completado} other{registros completados}}',

    //Survey
    'CAMPAIGN_CODE': 'Código da campanha',
    'GET_NEW_VERSION': 'Baixar nova versão',
    'LOCATION_CONSENT': 'Permitir que minha localização seja gravada',
    'START_RESPONSE': 'Preencher registro',
    'NEXT': 'Próximo',
    'BACK': 'Voltar',
    'TAKE_PICTURE': 'Tirar uma foto',
    'GET_LOCATION': 'Obter localização',
    'GETTING_LOCATION': 'Procurando localização',
    'LOCATION_RECORDED': 'Pronto!',
    'LOCATION_NOT_FOUND': 'Localização não encontrado',
    'LOCATION_TIMEOUT': 'Por favor confirme nas configurações do celular que a localização esteja ativada.',
    'RETRY': 'Tentar novamente',
    'SKIP_LOCATION': 'Pular localização',
    'LOCATION_MISSING': 'Não tem localização gravado para este registro. Tente novamente?',
    'LOCATION': 'Localização',
    'CHOOSE_ONE': 'Selecione uma',
    'CHOOSE_MANY': 'Selecione (pode ser mais de uma)',
    'YOUR_ANSWER': 'Sua resposta aqui...',
    'RESPONSE_PROGRESS': 'Andamento',
    'ALL_SET': 'Pronto!',
    'RESPONSE_COMPLETE': 'Você completou o registro.',
    'SUBMIT_NOW': 'Enviar agora',
    'SUBMIT_LATER': 'Enviar depois',
    'CANCEL_AND_DELETE': 'Cancelar e eliminar este registro',

    //Errors, Alerts
    'ENTER_CODE': 'Por favor, digite um código de campanha',
    'CODE_LENGTH': 'O código da campanha deve ser 6 números',
    '12': 'Esta campanha não existe. Por favor, verifique o código e tente novamente.',
    'DELETE_RESPONSE': 'Tem certeza que quer eliminar este registro?',
    'DELETE_CAMPAIGN': 'Tem certeza que quer eliminar esta campanha?',
    'DELETE': 'Eliminar',
    'UNSYNCED_RESPONSES': "{NUM, plural, other{Registros}} sem enviar!",
    'SYNCING': 'Enviando',
    'RESPONSE_SYNCED': 'Registro enviado!',
    'SYNC_NOW': 'Enviar',
    'ALL_SYNCED': 'Tudo enviado',
    'REQUIRED': 'Este campo é obrigatório',
    'OFFLINE': 'Sem internet. Por favor, verifique sua conexão e tente novamente.'
  });

  var lang = navigator.language.split("-")[0];
  if ($translateProvider.translations().hasOwnProperty(lang)){
    $translateProvider.preferredLanguage(lang).fallbackLanguage("en");
  } else {
    $translateProvider.preferredLanguage("en");
  }

  $translateProvider.addInterpolation('$translateMessageFormatInterpolation');
})

.run(function($ionicPlatform, $translate) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

  });
});