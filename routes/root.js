'use strict'
const fastifyCors = require('@fastify/cors');

module.exports = async function (fastify, opts) {
  
  fastify.get('/', async function (request, reply) {
    reply.code(404)
  })
}
