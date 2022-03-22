/** Teufelslotus: 22794 */
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
    const util = require("./js/util.js");
/* ejs */
    //app.set("view engine", "ejs");
/* axios, renew token */
    const axios = require("axios");


app.route("/")
    .get( (req,res) => {
        res.sendFile(path.join(__dirname+'/html/index.html'));
        /** ejs */
        //res.render('index');//ejs
    })
    .post( (req,res) => {

        const server = "4745"; //Transcendence
        const auctionhouse = "6"; //A:2, H:6, S:7
        const namespace_dynamic = "dynamic-classic-eu";
        const namespace_static = "static-classic-eu";
        const locale = "de_DE";
        const item_ID = parseInt(req.body.itemID, 10); // FormInput: parseInt für eine exakte Typenabfrage im Array/Objekt
        let auctionURL;
        let itemURL;
        let access_token;
        let item_name;

        axios.request({
            url: "https://us.battle.net/oauth/token",
            method: "post",
            auth: {
              username: clientId,
              password: clientSecret
            },
            data: "grant_type=client_credentials",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded" // added to encode body string
              },
        },()=>{console.log("end request");})
        .then( resp => {
            access_token = resp.data.access_token;
            console.log(access_token);
            auctionURL = `https://eu.api.blizzard.com/data/wow/connected-realm/${server}/auctions/${auctionhouse}?namespace=${namespace_dynamic}&locale=${locale}&access_token=${access_token}`;
            itemURL = `https://eu.api.blizzard.com/data/wow/item/${item_ID}?namespace=${namespace_static}&locale=${locale}&access_token=${access_token}`;
       
            /** GET ITEM INFO */
            https.get(itemURL, response => {
                switch (response.statusCode) {
                    case 200:
                        console.log(`GET ITEM INFO ${response.statusCode}`);
                        let body = '';
                        response.on("data", function(data){
                            body += data;
                        })
                        response.on('end', function(){
                            const parsedResponse = JSON.parse(body);
                            item_name = parsedResponse.name;
                            res.write(`${item_name} \n\n`);
                        });
                        break;
                    case 401:
                        console.log(`GET ITEM INFO ${response.statusCode}: renew access_token`);
                        //console.log(`**** CURRENT ACCESS_TOKEN: ${util.accessToken}`);
                        break;
                    default:
                        console.log(`GET ITEM INFO ${response.statusCode}`);
                }
                console.log("___________________ GET ITEM INFO END ___________________");
            })
  
            /** GET AUCTION INFO */
            https.get(auctionURL, response => {
                switch (response.statusCode) {
                    case 200:
                        console.log(`GET AUCTION INFO ${response.statusCode}`);
                        let body = '';
                        response.on("data", function(data){
                            body += data;
                        })
                        response.on('end', function(){
                            const parsedResponse = JSON.parse(body);
                            let auctions = parsedResponse.auctions;
                            let count_auctions= 0;
                            let count_items = 0;
                            
                            /** filter auctions */
                            auctions = auctions.filter(auction => { 
                                return (auction.item.id === item_ID ? true : false);
                            });
                            /** count auctions and items */ 
                            count_auctions = auctions.length;
                            count_items = auctions.map(i=>i.quantity).reduce((a,b)=>a+b);
                            
                            /* res.write(`
                                <h1>${item_name} (${count_items})</h1>
                            `); */
                            
                            //console.log(auctions);
                            //console.log(`Anzahl Auktionen von ${item_ID}: ${count_auctions}`);
                            //console.log(`Anzahl von ${item_ID}: ${count_items}`);
                            /** sort by quantity + buyout */
                            auctions.sort((a, b) => (a.quantity > b.quantity) ? 1 : (a.quantity === b.quantity) ? ((a.buyout > b.buyout) ? 1 : -1) : -1 )
                            auctions.forEach((auction,i) => {
                                res.write("ID: " + auction.item.id + " ");
                                res.write("Buyout: " + auction.buyout + " ");
                                res.write("Quantity: " + auction.quantity+"\n");
                                let auction_buyout = JSON.stringify(auction.buyout);
                                /** reverse buyout to prettify */
                                auction_buyout = util.reverse(auction_buyout);
                                /** reverse again to display correct number */
                                const gold = util.reverse(auction_buyout.slice(4));
                                const silver = util.reverse(auction_buyout.slice(2,4));
                                const copper = util.reverse(auction_buyout.slice(0,2));
        
                                res.write(`(${auction.quantity}): ${gold}g ${silver}s ${copper}c \n`);
                            });
                            // res.write(`<p>${count_auctions} Auktionen</p>`);
                            /** comment out res.send() for ending write / infinite page loading (ejs?) */
                            res.send();
                            /** ejs */
                            //res.render('show', {
                            //    auctions: auctions
                            //});
                        });
                        /** redirect to another html file */
                        //res.sendFile(path.join(__dirname+'/html/showAuction.html'));
                        break;
                    case 401:
                        console.log(`GET AUCTION INFO ${response.statusCode}: renew access_token`);
                        break;
                    default:
                        console.log(`GET AUCTION INFO ${response.statusCode}`);
                }
                console.log("___________________ GET AUCTION INFO END ___________________");
            })
            /*.on('error', function(e){
                console.log("Got an error: ", e);
                console.log("___________________ ERROR END  ___________________");
            });*/
            console.log("___________________ AXIOS END ___________________");
        })
        .catch(function (error) {
            console.log(error);
        }); /** end axios then */
        console.log("post end");
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