/* required imports */
    const https = require("https");
    const express = require("express");
    const app = express();
/* additional imports */
    const path = require("path");
    const router = express.Router();
/* dotenv file, access_token */
    require('dotenv').config()
    const clientId = process.env.CLIENTID;
    const clientSecret = process.env.CLIENTSECRET;
    const request = require('request');
/* Form Input */
    const bodyParser = require("body-parser");
    app.use(bodyParser.urlencoded({extended:true}));
    const { raw } = require("body-parser");
    const { rawListeners } = require("process");
    const { response } = require("express");
/* custom imports */
    const util = require(__dirname + "/js/util.js");
/* ejs */
    app.set("view engine", "ejs");
/* axios, renew token */
    const axios = require("axios");

/** js ordner bereitstellen */
app.use('/js', express.static(__dirname + '/js'));

// in progress / TEST
const requestAuctions = require(__dirname + '/js/request.js');

app.route("/")
    .get( (req,res) => {
        //res.sendFile(path.join(__dirname+'/html/index.html'));
        /** ejs */
        res.render('index');
    })
    .post( (req,res) => {
        requestAuctions(req,res,https,axios,clientId,clientSecret);
    })

/*
router.get("/", function(req,res){
    //res.send("Server is running.");
    //res.sendFile(path.join(__dirname+'/html/index.html'));
})
*/
app.use('/', router)
app.listen(process.env.PORT || 3000, function(){
    console.log("Server is up and running on port 3000.");
})