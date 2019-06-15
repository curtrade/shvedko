var config = {};
if(!process.env){
  process.env = {};
}
const mode = process.env.NODE_ENV || 'local';

//version
config.serverVersion = "Node.js Websocket Server v1.0";
config.apiSecret = 'trololo';


switch(mode){
  case 'local':
    console.log('local service started!');
    config.db = {
      host: 'localhost',
      port: '3306',
      database: 'hackathon19',
      user: 'root',
      password: '',
      dateStrings: 'DATETIME'
    }
    config.web = {
      port:'3000',
    }
    break;
  default:
    console.log('production service started!');
    config.db = {
      host: 'us-cdbr-iron-east-02.cleardb.net',
      port: '3306',
      database: 'heroku_23964812090b83f',
      user: 'b6b121b33eb5dd',
      password:'13c8f812',
      dateStrings: 'DATETIME'
    }
    config.web = {
      port: process.env.PORT
    }
    break;
}

console.log('config.web.port',config.web.port);
console.log('-------------------------------------');

console.log('mode: ' + mode);

//export
module.exports  =  config;
