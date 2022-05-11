const util = require(__dirname + "/util.js");
const https = require("https");
const axios = require('axios').default;
const server = "4477"; // "4745"; //Transcendence
const auctionhouse = "6"; //A:2, H:6, S:7
const namespace_dynamic = "dynamic-classic-eu";
const namespace_static = "static-classic-eu";
const locale = "de_DE";

const getAccessToken = async (clientID, clientSecret) => {
    // console.log("getAccessToken");
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
        })
        .catch(function (error) { console.log("getAccessToken Axios",error) })
        return request.data["access_token"];
    } catch (err) { console.error("getAccessToken",err) }
}

const getItemInfo = async (accessToken, itemIDs) => {
    let error = false;
    let items = [];
    if (!Array.isArray(itemIDs)) {
        itemIDs = [itemIDs]; // convert input into Array
    }
    accessToken = accessToken.toString();

    try {
        for(let i=0; i<itemIDs.length; i++) {
            const requestURL = await util.requestItemURL(itemIDs[i], namespace_static, locale, accessToken);
            /** wait for finishing get(); keepAlive:true, otherwise it can quit with error */
            const resp = await axios.get(requestURL, {
                httpsAgent: new https.Agent({ keepAlive: true })
            })
            .catch( (err) => {
                console.log("getItemInfo Axios",err.response.status);
                error = true;
            });
            if(!error) {
                let itemObject = {};
                itemObject['id'] = resp.data.id;
                itemObject['name'] = resp.data.name;
                itemObject['itemSubclassID'] = resp.data.item_subclass.id; // 3: Fläschchen, 9: Kräuter
                items.push(itemObject);
            }
        }
        return items;
    } catch (err) { console.error("getItemInfo",err) }
};

/** calcProfit: true/false */
/** 
 * Beispielaufruf der Funktion:  
 * getAuctionInfo(response, itemIDs, true).auctions
 * getAuctionInfo(response, itemIDs, true).lastModified.toString()
 * getAuctionInfo(response, input, false);
* */
const getAuctionInfo = async (accessToken, itemIDs, calcProfit) => {
    let auctions;
    let cheapestAuctions;
    const auctionURL = requestAuctionURL(server, auctionhouse, namespace_dynamic, locale, accessToken);
    const itemInfo = await getItemInfo(accessToken, itemIDs);
    /** check if itemInfo Array is empty */
    if (itemInfo.length === 0) { return itemInfo; }
    try {
        const resp = await axios.get(auctionURL)
        .catch((error) => {console.log("getAuctionInfo Axios",error)});
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
                    auctions[i].item["subclassID"] = itemInfo[key].itemSubclassID;
                    auctions[i]["price"] = {};
                    auctions[i].price["total"] = util.getPrice(auctions[i]).price;
                    auctions[i].price["single"] = util.getPrice(auctions[i]).singlePrice;
                }
            }
        }
        
        /** set isCheapest */
        util.setCheapest(auctions,util.itemIDs);
        cheapestAuctions = auctions.filter(auction => auction.buyout.isCheapest === true);
        
        /** sort by ID then buyout.single then quantity */
        // auctions.sort((a, b) => (a.item.id > b.item.id) ? 1 : (a.item.id === b.item.id) ? ((a.quantity > b.quantity) ? 1 : (a.quantity === b.quantity) ? ((a.buyout.total > b.buyout.total) ? 1 : -1) : -1 ) : -1 )
        cheapestAuctions.sort((a, b) => (a.item.id > b.item.id) ? 1 : (a.item.id === b.item.id) ? ((a.buyout.single > b.buyout.single) ? 1 : (a.buyout.single === b.buyout.single) ? ((a.quantity > b.quantity) ? 1 : -1) : -1 ) : -1 );
        auctions.sort((a, b) => (a.item.id > b.item.id) ? 1 : (a.item.id === b.item.id) ? ((a.buyout.single > b.buyout.single) ? 1 : (a.buyout.single === b.buyout.single) ? ((a.quantity > b.quantity) ? 1 : -1) : -1 ) : -1 );
        
        /** letztes Blizz Update der API */
        const lastModified = util.convertDate(resp.headers['last-modified']);
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
         * type: 3: Fläschchen, 9: Kräuter
         * */
        if (calcProfit) {
            const profit_flask_zm = util.calcProfit(3, cheapestAuctions, 22861);
            const profit_flask_mp5 = util.calcProfit(3, cheapestAuctions, 22853);
            const profit_flask_hp = util.calcProfit(3, cheapestAuctions, 22851);
            const profit_flask_ak = util.calcProfit(3, cheapestAuctions, 22854);
            const profit_flask_sff = util.calcProfit(3, cheapestAuctions, 22866);
            return { 
                auctions, cheapestAuctions, lastModified, 
                profit_flask_zm, profit_flask_mp5, profit_flask_hp, profit_flask_ak, profit_flask_sff 
            };
        } else {
            return { auctions, cheapestAuctions, lastModified, }
        }
    } catch (err) {
        console.error("getAuctionInfo",err);
    }
}

module.exports = {
    getAccessToken,
    getItemInfo,
    getAuctionInfo,
}