const util = require(__dirname + "/util.js");

let requestAuctions = (req,res,https,axios,clientId,clientSecret) => {

        const server = "4745"; //Transcendence
        const auctionhouse = "6"; //A:2, H:6, S:7
        const namespace_dynamic = "dynamic-classic-eu";
        const namespace_static = "static-classic-eu";
        const locale = "de_DE";
        const item_ID = parseInt(req.body.itemID, 10); // FormInput: parseInt für eine exakte Typenabfrage im Array/Objekt
        const alchemy_IDs = [22794,22793,28590,22791,28588,22786,28587,22790,28589,22789,28591,22792]; // reference @ ids.txt
        /** 
         * TODO:
         * 1. array of objects über GET ITEM INFO
         * 2. auctions reduce auf alchemy_IDs
         * 3. ...
         * zusätzlich: wird Unterschied von auctions und auctionsReduces benötigt? reicht nicht auctions und Überschreiben von auctions aus?
         */
        let auctionURL;
        let itemURL;
        let access_token;
        let item_name;
        let auctions;
        let auctionsReduced = [];

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
                        });
                        break;
                    case 401:
                        console.log(`GET ITEM INFO ${response.statusCode}: renew access_token`);
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

                        let lastModified = util.convertDate(response.headers['last-modified']);
                        console.log(`GET AUCTION INFO ${response.statusCode}`);
                        let body = '';
                        response.on("data", function(data){
                            body += data;
                        })
                        response.on('end', function(){
                            const parsedResponse = JSON.parse(body);
                            auctions = parsedResponse.auctions;
                            let count_auctions= 0;
                            let count_items = 0;
                            
                            /** filter auctions */
                            auctions = auctions.filter(auction => { 
                                return (auction.item.id === item_ID ? true : false);
                            });
                            /** count auctions and items */ 
                            count_auctions = auctions.length;
                            count_items = auctions.map(i=>i.quantity).reduce((a,b)=>a+b);
                            
                            /** sort by quantity + buyout */
                            auctions.sort((a, b) => (a.quantity > b.quantity) ? 1 : (a.quantity === b.quantity) ? ((a.buyout > b.buyout) ? 1 : -1) : -1 )
                            auctions.forEach((auction,i) => {
                                //res.write("ID: " + auction.item.id + " ");
                                //res.write("Buyout: " + auction.buyout + " ");
                                //res.write("Quantity: " + auction.quantity+"\n");

                                /** buyout divided by quantity */
                                let result = auction.buyout / auction.quantity;
                                let auc = {};
                                auc.itemId = auction.item.id;
                                auc.buyout = auction.buyout;
                                auc.quantity = auction.quantity;
                                auc.singleBuyout = result;
                                auc.price = util.getPrice(auction).price;
                                auc.singlePrice = util.getPrice(auction).singlePrice;
                                auctionsReduced.push(auc);
                            });
                            
                            /** get lowest singlebuyout */
                                var lowest = Number.POSITIVE_INFINITY; // There's no real number bigger than plus Infinity
                                //var highest = Number.NEGATIVE_INFINITY; 
                                var tmp;
                                for (var i=auctionsReduced.length-1; i>=0; i--) {
                                    tmp = auctionsReduced[i].singleBuyout;
                                    if (tmp < lowest) lowest = tmp;
                                    //if (tmp > highest) highest = tmp;
                                }
                                let lowestAuction = auctionsReduced.filter(a => {
                                    return a.singleBuyout === lowest
                                  })
                                auctionsReduced.sort((a,b) => (a.singleBuyout > b.singleBuyout) ? 1 : ((b.singleBuyout > a.singleBuyout) ? -1 : 0));

                            // res.write(`<p>${count_auctions} Auktionen</p>`);
                            /** comment out res.send() for ending write / infinite page loading (ejs?) */
                            //res.send();
                            /** ejs, comment out res.write() and res.send() */
                            res.render('show', {
                                auctions: auctions,
                                item_name: item_name,
                                auctionsReduced: auctionsReduced,
                                lowestAuction: lowestAuction,
                                lastModified: lastModified,
                            });
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
            console.log("catch "+error);
        }); /** end axios then */
        console.log("post end");

}

module.exports = requestAuctions;