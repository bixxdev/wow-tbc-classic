const db_user = process.ENV.DBUSER;
const db_pw = process.ENV.DBPW;

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://"+db_user+":"+db_pw+"@worldofwarcraftclassict.gnfxs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});