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
app.set("views", path.resolve(__dirname, "views"));
const dbName = "CMSC335_DB";
const collectionName= "finalProject";
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.iyxr6ed.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// axios is the library to make HTTPS requests
const axios = require('axios');
const IP = require('ip');




async function main() {
  try {
        await client.connect();
        console.log(`Listening to ${port}`);

        app.get('/', (request, response) => {
            response.render('index', {});
        });

        // For the love calculator API
        app.get('/data', async (request, response) => {
            try {
              // insert mongoDB function to retrieve match's name - sname and fname
              let sname = '';
              let fname = '';
              const options = {
                method: 'GET',
                url: 'https://love-calculator.p.rapidapi.com/getPercentage',
                params: {sname: '', fname: ''},
                headers: {
                  'X-RapidAPI-Key': '0be8987ed1mshdcb5e8905136398p153bb8jsn0d8de187532b',
                  'X-RapidAPI-Host': 'love-calculator.p.rapidapi.com'
                }
              };
              // For the GET request
              const reply = await axios.request(options);
              let data = reply.data;
              console.log(data);
            } catch (error) {
              console.log(error);
            }
        });
        // IP Geo location API
        app.get('/locationData', async (request, response) => {
          try {
            // insert mongoDB function to retrieve match's name - sname and fname
            const ipAddress = IP.address();
            console.log(ipAddress);
            const options = {
              method: 'GET',
              url: 'https://ip-geo-location.p.rapidapi.com/ip/23.123.12.11',
              params: {ip: ''},
              headers: {
                'X-RapidAPI-Key': '0be8987ed1mshdcb5e8905136398p153bb8jsn0d8de187532b',
                'X-RapidAPI-Host': 'ip-geo-location.p.rapidapi.com'
              }
            };
            // For the GET request
            const reply = await axios.request(options);
            let data = reply.data;
            //console.log(data);
          } catch (error) {
            //console.log(error);
          }
      });
        
        // Middleware - if link not found (Error code 404) this middleware runs
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
main().catch(console.error);





