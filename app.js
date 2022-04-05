/* required imports */
const https = require("https");
const express = require("express");
const app = express();
/* additional imports */
// const path = require("path");
const router = express.Router();
/* dotenv file, access_token */
require('dotenv').config()
const clientID = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
// const request = require('request');
/* Form Input */
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
// const { raw } = require("body-parser");
// const { rawListeners } = require("process");
// const { response } = require("express");
/* custom imports */
const util = require(__dirname + "/js/util.js");
/* ejs */
app.set("view engine", "ejs");
/* axios, renew token */
// const axios = require("axios").default;
let axiosFN = require(__dirname + '/js/axios.js');
/** js ordner bereitstellen */
app.use('/js', express.static(__dirname + '/js'));


app.route("/")
.get( (req,res) => {
    console.log("GET /");
    //res.sendFile(path.join(__dirname+'/html/index.html'));
    /** ejs */
    res.render('index');
})

app.route("/auctions/item")
.post( (req,res) => {
    var input = req.body.itemID;
    console.log("POST /auctions/item",input);
    axiosFN.getAccessToken(clientID, clientSecret)
    .then(async response => {
        let auctionInfo = await axiosFN.getAuctionInfo(response, input, false);
        try {
            /** check if response is empty */
            if (auctionInfo.length === 0) {
                res.render('auctionItem');
                return;
            } else {
                res.render('auctionItem', {
                        auctions: auctionInfo.auctions,
                        lastModified: auctionInfo.lastModified.toString(),
                    });   
            }
        } catch (error) {
            console.log(error);
        }
    })
    .catch(function (error) {
        console.log(error);
    });
})

app.route("/auctions/alchemy")
.post( (req,res) => {
    console.log("POST /auctions/alchemy");
    axiosFN.getAccessToken(clientID, clientSecret)
    .then(async response => {
        let auctionInfo = await axiosFN.getAuctionInfo(response, util.itemIDs, true);

        try {
            res.render('auctionProfession', {
                    auctions: auctionInfo.auctions,
                    cheapestAuctions: auctionInfo.cheapestAuctions,
                    lastModified: auctionInfo.lastModified.toString(),
                    profit_flask_zm: auctionInfo.profit_flask_zm, 
                    profit_flask_mp5: auctionInfo.profit_flask_mp5, 
                    profit_flask_hp: auctionInfo.profit_flask_hp, 
                    profit_flask_ak: auctionInfo.profit_flask_ak, 
                    profit_flask_sff: auctionInfo.profit_flask_sff, 
                });   
        } catch (error) {
            console.log(error);
        }
    })
})

app.use('/', router)
app.listen(process.env.PORT || 3000, function(){
console.log("Server is up and running on port 3000.");
})