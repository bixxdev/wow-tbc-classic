/**
 * Teufelslotus: 22794
 */
//required imports
const https = require("https");
const express = require("express");
const app = express();
//additional imports
const path = require("path");
const router = express.Router();
//dotenv file
require('dotenv').config()
const accessToken = process.env.TOKEN;
//Form Input
const bodyParser = require("body-parser");
const { raw } = require("body-parser");
const { rawListeners } = require("process");
const { response } = require("express");
app.use(bodyParser.urlencoded({extended:true}));

//custom imports
const util = require("./js/util.js");


app.route("/")
    .get( (req,res) => {
        res.sendFile(path.join(__dirname+'/html/index.html'));
    })
    .post( (req,res) => {
                
        const server = "4745"; //Transcendence
        const auctionhouse = "6"; //A:2, H:6, S:7
        const namespace_dynamic = "dynamic-classic-eu";
        const namespace_static = "static-classic-eu";
        const locale = "de_DE";
        const auctionURL = `https://eu.api.blizzard.com/data/wow/connected-realm/${server}/auctions/${auctionhouse}?namespace=${namespace_dynamic}&locale=${locale}&access_token=${accessToken}`;
        
        const item_ID = parseInt(req.body.itemID, 10); // FormInput: parseInt für eine exakte Typenabfrage im Array/Objekt
        const itemURL = `https://eu.api.blizzard.com/data/wow/item/${item_ID}?namespace=${namespace_static}&locale=${locale}&access_token=${accessToken}`;
        let item_name;
                        
        // GET ITEM INFO
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
                    });
                    break;
                case 401:
                    console.log(`GET ITEM INFO ${response.statusCode}: renew access_token`);
                    break;
                default:
                    console.log(`GET ITEM INFO ${response.statusCode}`);
            }
        })

        // GET AUCTION INFO
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
                        
                        //filter auctions
                        auctions = auctions.filter(auction => { 
                            return (auction.item.id === item_ID ? true : false);
                        });
                        // count auctions and items
                        count_auctions = auctions.length;
                        count_items = auctions.map(i=>i.quantity).reduce((a,b)=>a+b);
                        
                        /* res.write(`
                            <h1>${item_name} (${count_items})</h1>
                        `); */
                        
                        //console.log(auctions);
                        //console.log(`Anzahl Auktionen von ${item_ID}: ${count_auctions}`);
                        //console.log(`Anzahl von ${item_ID}: ${count_items}`);
                        //sort by quantity + buyout
                        auctions.sort((a, b) => (a.quantity > b.quantity) ? 1 : (a.quantity === b.quantity) ? ((a.buyout > b.buyout) ? 1 : -1) : -1 )
                        auctions.forEach((auction,i) => {
                            res.write("ID: " + auction.item.id + " ");
                            res.write("Buyout: " + auction.buyout + " ");
                            res.write("Quantity: " + auction.quantity+"\n");
                            let auction_buyout = JSON.stringify(auction.buyout);
                            //reverse buyout to prettify
                            auction_buyout = util.reverse(auction_buyout);
                            //reverse again to display correct number
                            const gold = util.reverse(auction_buyout.slice(4));
                            const silver = util.reverse(auction_buyout.slice(2,4));
                            const copper = util.reverse(auction_buyout.slice(0,2));

                            res.write(`(${auction.quantity}): ${gold}g ${silver}s ${copper}c \n`);
                        });
                        // res.write(`<p>${count_auctions} Auktionen</p>`);
                        res.send();
                    });
                    //redirect to another html file
                    //res.sendFile(path.join(__dirname+'/html/showAuction.html'));
                    break;
                case 401:
                    console.log(`GET AUCTION INFO ${response.statusCode}: renew access_token`);
                    break;
                default:
                    console.log(`GET AUCTION INFO ${response.statusCode}`);
            }

        }).on('error', function(e){
            console.log("Got an error: ", e);
        });

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