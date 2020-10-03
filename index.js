const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()

const MongoClient = require('mongodb').MongoClient;
const port = 5000
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h85k4.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

var admin = require("firebase-admin");

var serviceAccount = require("./configs/burj-al-arab-db-firebase-adminsdk-t5v3j-112da9b65a.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});


app.use(cors());
app.use(bodyParser.json());


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    console.log("db connected successfully")
    
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/bookings', (req, res) => {
        // console.log(req.query.email);
        console.log(req.headers.authorization);
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // console.log({ idToken });
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail =req.query.email;
                    // console.log(tokenEmail, queryEmail);

                    if (tokenEmail == queryEmail) {
                        bookings.find({ email: queryEmail })
                        .toArray((err, documents) => {
                            res.status(200).send(documents);
                        })
                    }
                    else{
                        res.status(401).send('unauthorized access!!')
                    }
                }).catch(function (error) {
                    res.status(401).send('unauthorized access!!')
                });
        }
        else{
            res.status(401).send('unauthorized access!!')
        }
    })
});

app.listen(port)