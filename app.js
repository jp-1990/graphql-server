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

// -- RESOLVERS -- //
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

// get client by id
const getClient = (args, context) =>
  new Promise((resolve, reject) => {
    context.db.query(
      `SELECT * FROM clients WHERE id = ${args.client.id};`,
      (err, res, _) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        // return client details
        return resolve({
          id: args.client.id,
          name: res[0].name,
          email: res[0].email,
          phone: res[0].phone,
        });
      }
    );
  });

// create client
const createClient = (args, context) =>
  new Promise((resolve, reject) => {
    context.db.query(
      `INSERT INTO clients (name, email, phone) VALUES ("${args.clientInput.name}", "${args.clientInput.email}", "${args.clientInput.phone}");`,
      (err, res, _) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        // return client details
        return resolve({
          id: res.insertId,
          name: args.clientInput.name,
          email: args.clientInput.email,
          phone: args.clientInput.phone,
        });
      }
    );
  });

// update client by id
const updateClient = (args, context) =>
  new Promise((resolve, reject) => {
    const name = args.client.name;
    const email = args.client.email;
    const phone = args.client.phone;

    context.db.query(
      `UPDATE clients SET ${
        name ? `name = "${name}"${email || phone ? ',' : ''}` : ''
      } ${email ? `email = "${email}"${phone ? ',' : ''}` : ''} ${
        phone ? `phone = "${phone}"` : ''
      } WHERE id=${args.client.id};`,
      (err, res, _) => {
        //console.log(res);
        if (err) {
          console.log(err);
          return reject(err);
        }
        // return client details
        return resolve(args.client.id);
      }
    );
  });

// delete client by id
const deleteClient = (args, context) =>
  new Promise((resolve, reject) => {
    context.db.query(
      `DELETE FROM clients WHERE id=${args.deleteID};`,
      (err, res, _) => {
        // if error, reject promise and log error
        if (err) {
          console.log(err);
          return reject(err);
        }
        // if nothing is deleted
        if (res.affectedRows !== 0) {
          return resolve({
            id: `Client ID:${args.deleteID} successfully deleted`,
          });
        }
        // if delete is successful
        return resolve({
          id: `Delete failed for Client ID:${args.deleteID}. Entry may not exist.`,
        });
      }
    );
  });

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
  input ClientUpdateInput {
    id: Int!
    name: String
    email: String
    phone: String
  }
  type DeletedClient{
    id: String!
  }

  type RootQuery {
    clients: [Client!]!
  }
  type RootMutation {
    createClient(clientInput: ClientInput): Client
    deleteClient(deleteID: Int): DeletedClient
    updateClient(client: ClientUpdateInput): Client
  }
 
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);

const rootValue = {
  clients: async (_, context) => {
    return await getClients(context);
  },
  createClient: async (args, context) => {
    return await createClient(args, context);
  },
  deleteClient: async (args, context) => {
    return await deleteClient(args, context);
  },
  updateClient: async (args, context) => {
    if (!args.client.name && !args.client.email && !args.client.phone)
      return { id: args.client.id };
    await updateClient(args, context);
    return await getClient(args, context);
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
      db,
    },
  }))
);

app.listen(5000, () => console.log('Server running on port:5000...'));
