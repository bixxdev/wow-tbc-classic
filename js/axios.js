const util = require(__dirname + "/util.js");
const https = require("https");
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
    let cheapestAuctions;
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
        auctions = auctions.map(auc => ({ item: { id: auc.item.id }, quantity: auc.quantity, bid: auc.bid, buyout: { total: auc.buyout, single: util.getSingle(auc.buyout,auc.quantity), isCheapest: false } }));
              
        /** for every item loop auctions array, check if it matches item, add item name to object */
        for (const key in itemInfo) {
            // key = 0, 1, 2, 3, 4...
            for (let i = 0; i < auctions.length; i++) {
                if (auctions[i].item.id == JSON.stringify(itemInfo[key].id)) {
                    auctions[i].item["name"] = itemInfo[key].name;
                    auctions[i]["price"] = {};
                    auctions[i].price["total"] = util.getPrice(auctions[i]).price;
                    auctions[i].price["single"] = util.getPrice(auctions[i]).singlePrice;
                }
            }
        }

        /** set isCheapest */
        util.setCheapest(auctions,util.itemIDs);
        cheapestAuctions = auctions.filter(auction => auction.buyout.isCheapest === true);
        // console.log(cheapestAuctions);
        /** 
         * Calculate flask profit 
         * 1x 22794 Teufelslotus
         * 3x 22793 Manadistel
         * 7x ...
            * 22791 Netherblüte 22861 Fläschchen des blendenden Lichts 
            * 22786 Traumwinde 22853 Fläschchen der mächtigen Wiederherstellung 
            * 22790 Urflechte 22851 Fläschchen der Stärkung 
            * 22789 Terozapfen 22854 Fläschchen des unerbittlichen Angriffs 
            * 22792 Alptraumranke 22866 Fläschchen des reinen Todes 
        * */
        const profit_flask_zm = calcProfit('flask', cheapestAuctions, 22861);
        const profit_flask_mp5 = calcProfit('flask', cheapestAuctions, 22853);
        const profit_flask_hp = calcProfit('flask', cheapestAuctions, 22851);
        const profit_flask_ak = calcProfit('flask', cheapestAuctions, 22854);
        const profit_flask_sff = calcProfit('flask', cheapestAuctions, 22866);

        /** sort by ID then buyout.single then quantity */
        // auctions.sort((a, b) => (a.item.id > b.item.id) ? 1 : (a.item.id === b.item.id) ? ((a.quantity > b.quantity) ? 1 : (a.quantity === b.quantity) ? ((a.buyout.total > b.buyout.total) ? 1 : -1) : -1 ) : -1 )
        cheapestAuctions.sort((a, b) => (a.item.id > b.item.id) ? 1 : (a.item.id === b.item.id) ? ((a.buyout.single > b.buyout.single) ? 1 : (a.buyout.single === b.buyout.single) ? ((a.quantity > b.quantity) ? 1 : -1) : -1 ) : -1 );
        auctions.sort((a, b) => (a.item.id > b.item.id) ? 1 : (a.item.id === b.item.id) ? ((a.buyout.single > b.buyout.single) ? 1 : (a.buyout.single === b.buyout.single) ? ((a.quantity > b.quantity) ? 1 : -1) : -1 ) : -1 );
        // console.log(auctions);

        /** letzte Blizz Update der API */
        const lastModified = util.convertDate(resp.headers['last-modified']);
        console.log(lastModified);

        /** 
         * Beispielaufruf der Funktion:  
         * getAuctionInfo(response, itemIDs).auctions
         * getAuctionInfo(response, itemIDs).lastModified.toString()
         * */
        return { 
            auctions, cheapestAuctions, lastModified, 
            profit_flask_zm, profit_flask_mp5, profit_flask_hp, profit_flask_ak, profit_flask_sff 
        };
    } catch (err) {
        console.error("getItemInfo Error",err);
    }
}

module.exports = {
    getAccessToken,
    getItemInfo,
    getAuctionInfo,
}