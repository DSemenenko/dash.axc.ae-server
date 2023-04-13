const fastify = require("fastify");
const sqlite3 = require('sqlite3');
const fastifyCors = require('@fastify/cors');

module.exports = async function(fastify, opts){
  const db = new sqlite3.Database('./db/salesannounce.db', (err) => {
    if (err) {
      console.error(err.message);
    } else{
      console.log('Connected to the database.');
    }
  });

  


 
  fastify.get('/test', function(request, reply) {
    return 'Hello'
  })


  
}