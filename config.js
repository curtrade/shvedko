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
      database: 'shvedko',
      user: 'root',
      password: '',
      dateStrings: 'DATETIME'
    }
    config.web = {
      port:'3000',
    }
    break;
  default:
  //mysql://b9eb358e330c55:5b11a3eb@us-cdbr-iron-east-02.cleardb.net/heroku_fd6c06613258cdd?reconnect=true
    console.log('production service started!');
    config.db = {
      host: 'us-cdbr-iron-east-02.cleardb.net',
      port: '3306',
      database: 'heroku_fd6c06613258cdd',
      user: 'b9eb358e330c55',
      password:'5b11a3eb',
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
