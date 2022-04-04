/* required imports */
    const https = require("https");
    const express = require("express");
    const app = express();
/* additional imports */
    const path = require("path");
    const router = express.Router();
/* dotenv file, access_token */
    require('dotenv').config()
    const clientID = process.env.CLIENTID;
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
// const requestAuctions = require(__dirname + '/js/request.js');
let axiosFN = require(__dirname + '/js/axios.js');
const token = axiosFN.getAccessToken(clientID, clientSecret);

app.route("/")
    .get( (req,res) => {
        //res.sendFile(path.join(__dirname+'/html/index.html'));
        /** ejs */
        res.render('index');
    })
    /* .post( (req,res) => {
        // requestAuctions(req,res,https,axios,clientId,clientSecret);

        const itemID = [22794];//parseInt(req.body.itemID, 10); // FormInput: parseInt für eine exakte Typenabfrage im Array/Objekt
        const itemIDs = [22794,22793,22861,22791,22853,22786,22851,22790,22854,22789,22866,22792]; // reference @ ids.txt

        token
        .then(async response => { 
            for(let i=0; i<itemIDs.length; i++) {
                await axiosFN.getItemInfo(response, itemIDs[i], i) 
            }
            auctionInfo = await axiosFN.getAuctionInfo(response, itemID);
            console.log('lastmodified: '+auctionInfo.lastModified);
            return auctionInfo;
        })
        .then( response => {
            
            res.render('auctionInfo', {
                lastModified: response.lastModified,
            });
        } )
        .catch(error => console.log("Final Execution Error",error));
    }) */
    .post( (req,res) => {
        // let itemInfo, auctionInfo;
        token
        .then(async response => {
            // itemInfo = await axiosFN.getItemInfo(response, itemIDs);
            let auctionInfo = await axiosFN.getAuctionInfo(response, util.itemIDs);

            try {
                res.render('auctionInfo', {
                        // itemInfo,
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