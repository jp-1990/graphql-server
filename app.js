const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

// local MySql database connection
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'test1234',
  database: 'testdb',
});

// get all clients
const getClients = (context) =>
  new Promise((resolve, reject) => {
    result = [];
    context.db.query('SELECT * FROM clients', (err, res, fields) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      for (let i = 0, l = res.length; i < l; i++) {
        result.push({
          id: res[i].id,
          name: res[i].name,
          email: res[i].email,
          phone: res[i].phone,
        });
      }
      return resolve(result);
    });
  });

const clients = [];

const schema = buildSchema(`
  type Client {
    id: ID!
    name: String!
    email: String!
    phone: String!
  }
  input ClientInput {
    name: String!
    email: String!
    phone: String!
  }

  type RootQuery {
    clients: [Client!]!
  }
  type RootMutation {
    createClient(clientInput: ClientInput): Client
  }
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

const rootValue = {
  clients: async (args, context) => {
    return await getClients(context);
  },
  createClient: (args) => {
    const client = {
      id: Math.floor(Math.random() * 100).toString(),
      name: args.clientInput.name,
      email: args.clientInput.email,
      phone: args.clientInput.phone,
    };
    clients.push(client);
    return client;
  },
};

const app = express();

app.use(bodyParser.json());
app.use(
  '/graphql',
  graphqlHTTP((req, res, graphQLParams) => ({
    schema,
    rootValue,
    graphiql: true,
    context: {
      test: 'hello world',
      db,
    },
  }))
);

app.listen(5000, () => console.log('Server running on port:5000...'));
