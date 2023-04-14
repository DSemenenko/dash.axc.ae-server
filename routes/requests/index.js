'use strict'
// const fastify = require('fastify')()
const sqlite3 = require('sqlite3')
const fastifyCors = require('@fastify/cors');
const fastify = require('fastify');



module.exports = async function (fastify, opts) {
  fastify.register(fastifyCors)
  // try {
  //   const io = await require('socket.io')(fastify.server, {
  //     cors: {
  //       origin: "*", // Разрешить любой источник (не рекомендуется для продакшена)
  //       methods: ['GET', 'POST'], // Разрешенные методы
  //       allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
  //       credentials: true // Разрешить отправку куки
  //     }
  //   });

  //   io.on('connection', (socket) => {
  //     console.log('Client connected:', socket.id)
  
  //     socket.emit('data', {"test": 123})
      
  //     socket.on('disconnect', () => {
  //       console.log('client disconnected:', socket.id)
  //     })
  //   })
  // } catch (error) {
  //   throw error
  // }


  async function waitSocket(){
    // // Зарегистрируйте плагин fastify-cors с необходимыми настройками
    // await fastify.register(fastifyCors, {
    //   origin: "*", // Разрешить любой источник (не рекомендуется для продакшена)
    //   methods: ['GET', 'POST'], // Разрешенные методы
    //   allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
    //   credentials: true // Разрешить отправку куки
    // });

    const io = await require('socket.io')(fastify.server, {
      cors: {
        origin: "*", // Разрешить любой источник (не рекомендуется для продакшена)
        methods: ['GET', 'POST'], // Разрешенные методы
        allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
        credentials: true // Разрешить отправку куки
      }
    });
    
    fastify.all('/socket.io/*', (request, reply) => {
      reply.raw.statusCode = 404;
      reply.raw.end();
    });
    
    io.on('connection', (socket) => {
      console.log('Socket connected', socket.id);

      try {
        // отправляем данные из базы данных при подключении клиента
        db.all('SELECT * FROM dashdata', [], (err, rows) => {
          if(err) {
            //throw err;
            socket.emit('error', {message: 'Error fetching data'})
          } else {
            socket.emit('boardFetched', rows);
          }
        })

        // отправляем данные из базы данных при обновлении
        db.on('update', (table, changes) => {
          if (table === 'data') {
            db.all('SELECT * FROM data', (err, rows) => {
              if (err) throw err;

              socket.emit('data', rows);
            });
          }
        });

        db.all('SELECT * FROM announce', [], (err, rows) => {
          if(err){
            socket.emit('error', {message: 'Error fetching data'})
          } else {
            socket.emit('salesFetched', rows)
          }
        })
        
        socket.on('fetchData', () => {
          db.all('SELECT * FROM lists', {}, (err, rows) => {
            if(err){
              socket.emit('error', {message: 'Error fetching data'})
            }else{
              socket.emit('listFetched', rows)
            }
          })
        })


      } catch (error) {
        throw error        
      }

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    })
  }
  waitSocket();

  
  

  // Set up database connection
  //const db = new sqlite3.Database('/mydatabaasse.db');
  
  const db = new sqlite3.Database('./db/salesannounce.db', (err) => {
    if (err) {
      console.error(err.message);
    } else{
      console.log('Connected to the database.');
    }
  });

  // const test = `CREATE TABLE IF NOT EXISTS announce (
  //   id INTEGER PRIMARY KEY, 
  //   Agent TEXT, 
  //   Agent_2 TEXT,
  //   Developer TEXT,
  //   Project TEXT,
  //   agent1_img TEXT,
  //   agent2_img TEXT,
  //   DealType TEXT,
  //   Amount TEXT,
  //   Content TEXT
  // )`

// const addAlter = `ALTER TABLE sales ADD COLUMN timestamp`
//const deleterow = `DELETE FROM sales WHERE id=7`
//db.run(`ALTER TABLE sales ADD COLUMN timestamp`)



  
//////////////////////////////////////////////////

// fastify.post('/api', async(request, reply) => {

//   const category = request.body.DealType
  

//   const {Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content, announce_id} = request.body

//   const arrdb = [Agent, Agent_2, Developer, Project, agent1_img, agent2_img,  DealType, Amount, Content, announce_id]

//   const sql = `
//   INSERT INTO ${category} (
//     Agent, 
//     Agent_2, 
//     Developer, 
//     Project, 
//     agent1_img, 
//     agent2_img, 
//     DealType, 
//     Amount, 
//     Content, 
//     announce_id
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `


//   if (category == 'Secondary'){
//     db.run(sql, arrdb)
//   }else if(category == 'Offplan'){
//     db.run(sql, arrdb)
//   }

//   reply.send(200).then(reply.status(200))
  
// })

//////////////////////////////////////////////////

fastify.get('/', async (request, reply) => {
  return 'Hello, World!'
})


//POST Sales
fastify.post('/api-sales', async(request, reply) => {
  const {Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content, announce_id} = request.body

  //кол записей 
  db.all(`SELECT COUNT(*) AS count FROM sales WHERE DealType = ?`, DealType, (err, rows) => {
    if(err){
      reply.status(500).send({error: err.message});
      return;
    }


    //если количество записей в кат. меньше или равно 4 то добавление новой записи 
    if(rows[0].count < 4){
      const timestamp = new Date().getTime();
      db.run(
        `
        INSERT INTO sales (
          Agent, 
          Agent_2, 
          Developer, 
          Project, 
          agent1_img, 
          agent2_img, 
          DealType, 
          Amount, 
          Content, 
          announce_id, 
          timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content, announce_id, timestamp], (err) => {
            if(err){
              reply.status(500).send({error: err.message})
              return;
            }

            reply.send({success: true});
          })
    } else {
      // Если количество записей в категории больше 4, то удаление самой старой записи и добавление новой записи
      db.all('SELECT * FROM sales WHERE DealType = ? ORDER BY timestamp ASC LIMIT 1', DealType, (err, rows) => {
        if(err){
          reply.status(500).send({error: err.message});
          return;
        }
        
        const id = rows[0].id
        db.run(`DELETE FROM sales WHERE id = ?`, id, (err) => {
          if(err){
            reply.status(500).send({error: err.message});
            return;
          }

          const timestamp = new Date().getTime();
          db.run(`INSERT INTO sales (
            Agent, 
            Agent_2, 
            Developer, 
            Project, 
            agent1_img, 
            agent2_img, 
            DealType, 
            Amount, 
            Content, 
            announce_id,
            timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content, announce_id, timestamp], (err) => {
              if (err){ 
                reply.status(500).send({error: err.message});
                return;
              }

              reply.send({success: true})
            })
        })
      })
    }


  })
})


fastify.post('/announce-api', async(request, reply) => {
  const {id, Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content} = request.body

  const props = [Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content, id]

  db.run(`
  UPDATE announce SET
    Agent = ?, 
    Agent_2 = ?, 
    Developer = ?, 
    Project = ?, 
    agent1_img = ?, 
    agent2_img = ?, 
    DealType = ?, 
    Amount = ?, 
    Content = ? 
  WHERE id = ?`, props, (err) => {
    if (err) {
      reply.status(500)
    }
  })
})


//////////////////////////////////////////////////



  //sales announce UPDATE
  // fastify.post('/update-post', (request, reply) => {
  //   const {announce_id, Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content} = request.body

  //   const updateannounce = `
  //   UPDATE sales SET 
  //     Agent = ?, 
  //     Agent_2 = ?, 
  //     Developer = ?, 
  //     Project = ?, 
  //     agent1_img = ?, 
  //     agent2_img = ?, 
  //     DealType = ?, 
  //     Amount = ?, 
  //     Content = ? 
  //   WHERE announce_id = ?`

  //   const result = db.run(updateannounce, [announce_id, Agent, Agent_2, Developer, Project, agent1_img, agent2_img, DealType, Amount, Content])
  //   reply.status(200)
  // })

  //GET Board
  fastify.get('/getboard', async (request, reply) => {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM dashdata', (err, rows) => {
          if(err){
            reject(err)
          }else{
            resolve(rows)
          }
        });
      })
      reply.send(rows)
      // const jsonRows = JSON.stringify(rows)
      // reply.send(jsonRows);
    } catch (err) {
      console.error(err.message);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  });


  //UPDATE Board 
  fastify.post('/dashboard-api/', async(request, reply) => {
    const{id} = request.body
    const {dldSales} = request.body
    const {dldTrans} = request.body
    const {marketshare} = request.body
    const {totallead} = request.body
    const {totaldeals} = request.body
    const {meter} = request.body
    
    let sql = `UPDATE dashdata SET `
    const params = [];

    if (dldSales) {
      sql += `dldSales = ?, `;
      params.push(dldSales);
    } 
    if(dldTrans) {
      sql += `dldTrans = ?, `;
      params.push(dldTrans);
    }
    if(marketshare){
      sql += `marketshare = ?, `;
      params.push(marketshare)
    } 
    if(totallead){
      sql += `totallead = ?, `;
      params.push(totallead)
    } 
    if(totaldeals){
      sql += `totaldeals = ?, `;
      params.push(totaldeals)
    }
    if(meter){
      sql += `meter = ?, `;
      params.push(meter)
    }

    sql = sql.slice(0, -2);// Удаление последней запятой и пробела
    sql += ` WHERE id = ?`;
    
    params.push(id)

    db.run(sql, params, function(err){
      if(err){
        return console.error(err.message)
      }
      console.log(`Row(s) updated: ${this.changes}`)
    })
  })

  

  //POST lists
  fastify.post('/post-lists/:id', (request, reply) => {
    const data = [JSON.stringify(request.body)]
    
    db.run(`UPDATE lists SET data = ? WHERE id = ?`, [data, request.params.id], (err) => {
      if (err){
        reply.status(500).send({error: err.message})
      }else{
        reply.send('Accept')
      }
    })
    reply.send('Accept').status(200)
  })

  //GET lists
  fastify.get('/get-lists', async (request, reply) => {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM lists', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      })
      reply.send(rows)
    } catch (err) {
      reply.status(500).send(err);
    }
  })

  
}