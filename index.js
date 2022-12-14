"use strict";
const fs = require('fs');
const path = require("path");
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
app.set("view engine", "ejs");

require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })  
const port = process.argv[2] || 3000;

const dbName = "CMSC335_DB";
const collectionName= "finalProject";
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.iyxr6ed.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function main() {
  try {
        await client.connect();
        console.log(`Listening to ${port}`);
        app.get('/', (request, response) => {
          response.render('index', {});
        });
        
        app.use((request, response) => {
          const httpNotFoundStatusCode = 404;
          response.status(httpNotFoundStatusCode).send("Resource not found");
        });
        app.listen(port);
        
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}






