//required imports
const https = require("https");
const express = require("express");
const app = express();
//additional imports
const path = require('path');
const router = express.Router();
//dotenv file
require('dotenv').config()
const accessToken = process.env.TOKEN;

//custom imports
// ...


router.get("/", function(req,res){

    const server = "4745"; //Transcendence
    const auctionhouse = "6"; //A:2, H:6, S:7
    const namespace = "dynamic-classic-eu";
    const locale = "de_DE";
    const url = "https://eu.api.blizzard.com/data/wow/connected-realm/" 
                + server + "/auctions/" + auctionhouse 
                + "?namespace=" + namespace 
                + "&locale=" + locale 
                + "&access_token=" + accessToken;
    
    https.get(url, function(response){
        console.log(response.statusCode);

        let body = '';
        response.on("data", function(data){
            body += data;
        })
        response.on('end', function(){
            let parsedResponse = JSON.parse(body);
            let auctions = parsedResponse.auctions;
            let item_teufelslotus = 22794;
            let item_ID = item_teufelslotus;
            let count_auctions= 0;
            let count_items = 0;
            
            //filter auctions
            auctions = auctions.filter(auction => { 
                return (auction.item.id === item_ID ? true : false);
            });

            count_auctions = auctions.length;
            count_items = auctions.map(i=>i.quantity).reduce((a,b)=>a+b);

            res.write("" + item_ID + " (" + count_items + ")\n\n");

            console.log(auctions);
            console.log("Anzahl Auktionen von " + item_ID + ": " + count_auctions);
            console.log("Anzahl von " + item_ID + ": " + count_items);
            //sort by quantity + buyout
            auctions.sort((a, b) => (a.quantity > b.quantity) ? 1 : (a.quantity === b.quantity) ? ((a.buyout > b.buyout) ? 1 : -1) : -1 )
            auctions.forEach(auction => {
                //res.write("ID: " + auction.item.id + " ");
                res.write("Buyout: " + auction.buyout + " ");
                res.write("Quantity: " + auction.quantity+"\n");
            });

            res.write("\nAnzahl Auktionen: " + count_auctions);

            res.send();
        });
    }).on('error', function(e){
        console.log("Got an error: ", e);
    });
    
    //res.send("Server is running.");
    //res.sendFile(path.join(__dirname+'/html/index.html'));
})

app.use('/', router)
app.listen(process.env.port || 3000, function(){
    console.log("Server is up and running on port 3000.");
})