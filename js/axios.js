const https = require("https");
const util = require(__dirname + "/util.js");
const axios = require('axios').default;
const server = "4745"; //Transcendence
const auctionhouse = "6"; //A:2, H:6, S:7
const namespace_dynamic = "dynamic-classic-eu";
const namespace_static = "static-classic-eu";
const locale = "de_DE";

const getAccessToken = async (clientID, clientSecret) => {
    try {
        const request = await axios({
            url: "https://us.battle.net/oauth/token",
            method: "post",
            auth: {
                username: clientID,
                password: clientSecret
            },
            data: "grant_type=client_credentials",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded" // added to encode body string
                },
        });
        return request.data["access_token"];
    } catch (err) {
        console.error("getAccessToken Error",err);
    }
}

const getItemInfo = async (accessToken, itemIDs) => {
    console.log('getItemInfo');
    let itemNames = [];
    accessToken = accessToken.toString();
    try {
        for(let i=0; i<itemIDs.length; i++) {
            const itemURL = `https://eu.api.blizzard.com/data/wow/item/${itemIDs[i]}?namespace=${namespace_static}&locale=${locale}&access_token=${accessToken}`;
            /** wait for finishing get(); keepAlive:true, otherwise it can quit with error */
            const response = await axios.get(itemURL, {
                httpsAgent: new https.Agent({ keepAlive: true })
            });
            let itemNamesObject = {};
            itemNamesObject['id'] = response.data.id;
            itemNamesObject['name'] = response.data.name;
            itemNames.push(itemNamesObject);
        }
        return itemNames;
    } catch (err) {
        console.error("getItemInfo Error",err);
    }
};

const getAuctionInfo = async (accessToken, itemIDs) => {
    let auctions;
    console.log('getAuctionInfo');
    const auctionURL = `https://eu.api.blizzard.com/data/wow/connected-realm/${server}/auctions/${auctionhouse}?namespace=${namespace_dynamic}&locale=${locale}&access_token=${accessToken.toString()}`;
    const itemInfo = await getItemInfo(accessToken, itemIDs);
    
    try {
        const resp = await axios.get(auctionURL);
        auctions = resp.data.auctions;
        /** recude array (auctions) to requested items */
        auctions = auctions.filter(auction => { 
            return itemIDs.includes(auction.item.id);
        });
        /** redurce entries in objects to needed values */
        auctions = auctions.map(auc => ({ item: { id: auc.item.id }, bid: auc.bid, buyout: auc.buyout, quantity: auc.quantity }));
              
        /** for every item loop auctions array, check if it matches item, add item name to object */
        for (const key in itemInfo) {
            // console.log('key '+key, 'itemInfo[key] '+JSON.stringify(itemInfo[key].id));    
            for (let i = 0; i < auctions.length; i++) {
                if (auctions[i].item.id == JSON.stringify(itemInfo[key].id)) {
                    auctions[i].item["name"] = itemInfo[key].name;
                    auctions[i]["price"] = util.getPrice(auctions[i]).price;
                    auctions[i]["singlePrice"] = util.getPrice(auctions[i]).singlePrice;
                }
            }
        }

        /** sort by ID then quantity then buyout */
        auctions.sort((a, b) => (a.item.id > b.item.id) ? 1 : (a.item.id === b.item.id) ? ((a.quantity > b.quantity) ? 1 : (a.quantity === b.quantity) ? ((a.buyout > b.buyout) ? 1 : -1) : -1 ) : -1 )
        console.log(auctions);

        const lastModified = util.convertDate(resp.headers['last-modified']);
        console.log(lastModified);

        /** 
         * Beispielaufruf der Funktion:  
         * getAuctionInfo(response, itemIDs).auctions
         * getAuctionInfo(response, itemIDs).lastModified.toString()
         * */
        return {auctions,lastModified};
    } catch (err) {
        console.error("getItemInfo Error",err);
    }
}

module.exports = {
    getAccessToken,
    getItemInfo,
    getAuctionInfo,
}