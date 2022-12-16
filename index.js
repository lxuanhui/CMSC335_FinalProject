"use strict";
const fs = require('fs');
const path = require("path");
const express = require('express');
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended:false}));
app.set("view engine", "ejs");

require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })  
const port = process.env.PORT || "https://cmsc335-project.herokuapp.com/"
app.set("views", path.resolve(__dirname, "views"));
const dbName = "CMSC335_DB";
const collectionName= "finalProject";
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.iyxr6ed.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// axios is the library to make HTTPS requests
const axios = require('axios');
const IP = require('ip');
const { kMaxLength } = require('buffer');



async function main() {
  try {
        await client.connect();
        console.log(`Listening to ${port}`);

        app.get('/', (request, response) => {
            response.render('index', {});
        });

        app.get('/signUp', (request, response) => {
          response.render('signUp', {});
        });

        app.get('/login', (request, response) => {
          response.render('login', {});
        });

        app.get('/match', async (request, response) => {
          let userID = request.query.id;
          let memName, memTel, memEmail;
          console.log(userID);
          try {
            await client.connect();
            const retrievedUser = await client.db(dbName).collection(collectionName).findOne({"_id" : ObjectId(userID)});
            console.log(retrievedUser);

            let ranking = await createRanking(client,dbName, collectionName,retrievedUser);
            if (ranking.size==0){
              //No match
              memName = "NoOne";
              memTel = "0000000";
              memEmail = "no@sorry.com";

            }
            const matchUser = await client.db(dbName).collection(collectionName).findOne({"_id" : ranking.entries().next().value[0]});
            console.log(matchUser);
            
            memName = matchUser.name;
            memTel = matchUser.tel;
            memEmail = matchUser.email;

            //Send match info
            response.render('match', {myname: retrievedUser.name, matchName:memName, matchTel: memTel, matchEmail: memEmail, matchTable:"table"});
          } catch (e) {
            console.error(e);
          } finally {
            await client.close();
          }

        });
        
        app.post('/createUser', async (request, response) => {
          const userName = request.body.name;
          const userEmail = request.body.email;
          const userPhone = request.body.phone;
          const userGender = request.body.gender;
          const userAge = request.body.age;
          let userInterests = request.body.interests;
          let str = userInterests.replace(/[\r]/gm, '');
          str = str.replace(/[\n]/gm, ',');
          str = str.toLowerCase();
          const interestsArray = str.split(',');

          let user = {name: userName, email: userEmail, phone: userPhone, gender: userGender, age: userAge, interests: interestsArray};
          try {
            await client.connect();
            await client.db(dbName).collection(collectionName).insertOne(user);
            const retrievedUser = await client.db(dbName).collection(collectionName).findOne(user);
            let variables = {
              name: userName,
              id: retrievedUser._id
            }
            response.render('userPage', variables);
          } catch (e) {
            console.error(e);
          } finally {
            await client.close();
          }
        });

        app.post('/userPage', async (request, response) => {
          const userEmail = request.body.email;
          let filter = {email: userEmail};

          try {
            await client.connect();
            const retrievedUser = await client.db(dbName).collection(collectionName).findOne(filter);
            if (retrievedUser) {
              let variables = {
                name: retrievedUser.name,
                id: retrievedUser._id
              }
              response.render('userPage', variables);
            } else {
              response.render('userNotFound', {});
            }
          } catch (e) {
            console.error(e);
          } finally {
            await client.close();
          }
        });

        


        // For the love calculator API
        app.get('/lovescore', async (request, response) => {
            try {
              // insert mongoDB function to retrieve match's name - sname and fname
              let sname = request.query.lover;
              let fname = request.query.me;
              const options = {
                method: 'GET',
                url: 'https://love-calculator.p.rapidapi.com/getPercentage',
                params: {sname:sname, fname: fname},
                headers: {
                  'X-RapidAPI-Key': '0be8987ed1mshdcb5e8905136398p153bb8jsn0d8de187532b',
                  'X-RapidAPI-Host': 'love-calculator.p.rapidapi.com'
                }
              };
              // For the GET request
              const reply = await axios.request(options);
              let data = reply.data;
              console.log(data);

              response.render("lovescore", {myName:fname, matchName:sname,score:data.percentage, comment:data.result });

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
        

        client.connect(err => {
          if(err){ console.error(err); return false;}
          // connection to mongo is successful, listen for requests
          app.listen(port, () => {
              console.log("listening for requests");
          })
        });

        //app.listen(port);
        
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

main().catch(console.error);

/* Helper Functions */

//Returns sorted interestMap [member_id:freq]
async function createRanking(client, database, collection, cur_user) {
  //get list of members of opposite gender
  let filter = {gender : { $ne: cur_user.gender}}
  const cursor = client.db(database)
  .collection(collection)
  .find(filter);

  const result = await cursor.toArray();

  //Create map with member_id, frequency of matching interest)
  let interestMap = new Map()
  result.forEach(mem => 
      interestMap.set(mem._id, 
        mem.interests.reduce((cnt, it) => 
        ((hasElem(cur_user.interests,it))? cnt+1 : cnt) ,0)));
  
  
    //console.log(mem.name, freq);
  
  //sort by frequency
  interestMap = new Map([...interestMap.entries()].sort((a, b) => b[1] - a[1]));

  //debugging:
  console.log("CHECK algo")
  for (const v of interestMap.entries()){
    console.log(v);
  }
  
  return interestMap;
}

function hasElem(arr, elem){
  return arr.some(i => i.toLowerCase()==elem.toLowerCase());
}



