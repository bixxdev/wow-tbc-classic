/** set of item IDs */
const itemIDs = [22794,22793,22861,22791,22853,22786,22851,22790,22854,22789,22866,22792]; // reference @ ids.txt

/** 
 * Convert time of latest data modification from api 
 * */
convertDate = (date) => {
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};
    return new Date(date).toLocaleString("de-DE", options);
}

/**
 * Generate API Request URL
 */
requestItemURL = (itemID, namespace_static, locale, accessToken) => {
    return `https://eu.api.blizzard.com/data/wow/item/${itemID}?namespace=${namespace_static}&locale=${locale}&access_token=${accessToken}`
}
requestAuctionURL = (server, auctionhouse, namespace_dynamic, locale, accessToken) => {
    return `https://eu.api.blizzard.com/data/wow/connected-realm/${server}/auctions/${auctionhouse}?namespace=${namespace_dynamic}&locale=${locale}&access_token=${accessToken.toString()}`;
}

/**
 * slicePrice converts a number (auction buyout) and returns three numbers: gold, silver, copper
 * should only be used in getPrice()
 */
slicePrice = (num, numLength) => {
    const gold = (numLength >= 5) ? num.slice( 0, -4 ) : '0';
    const silver = (numLength >= 3) ? num.slice( (numLength-4), -2 ) : '00';
    const copper = (numLength > 0) ? num.slice( (numLength-2) ) : '00';
    return {gold, silver, copper};
}

/**
 * getPrice return an object of 3 digits: gold, silver, copper
 */
getPrice = (auction) => {
    // get total price
    const buyoutString = auction.buyout.total.toString();
    const buyoutLength = buyoutString.length;
    const price = slicePrice(buyoutString, buyoutLength);
    // get single price
    let singleBuyoutString = getSingle(buyoutString,auction.quantity).toString();
    const singleBuyoutLength = singleBuyoutString.length;
    const singlePrice = slicePrice(singleBuyoutString, singleBuyoutLength);
    return {price, singlePrice};
}

/** 
 * getSingle: Buyout, Price, ... 
 * */
getSingle = (buyout, quantity) => {
    return Math.floor(buyout/quantity);
}

/**
 * Sets attribute isCheapest true for lowest buyout.single of that item
 * auctions: auctions, item: itemID
 */
setCheapest = (auctions, items) => {
    for (const key in items) {
        var lowest = Number.POSITIVE_INFINITY; 
        var tmp;
        for (var i=0; i<auctions.length; i++) {
            if (auctions[i].item.id === items[key]){
                tmp = auctions[i].buyout.single;
                if (tmp < lowest) lowest = tmp;
            }
        }
        let lowestAuction = auctions.filter(a => {
            return a.buyout.single === lowest
        })
        lowestAuction.forEach(element => {
            element.buyout.isCheapest = true;
        });
    }
}

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
 * type: flask or elixier
 */
calcProfit = (type, lowestPriceItems, toBeCrafted) => {
    let sellingPrice;
    let sellingPriceWithFee;
    if (type === 3) { // 3: flask
        const item_1 = lowestPriceItems.find(element => element.item.id === 22794).buyout.single; // Teufelslotus
        const item_2 = lowestPriceItems.find(element => element.item.id === 22793).buyout.single; // Manadistel
        let item_3;
        const flaskPrice = lowestPriceItems.find(element => element.item.id === toBeCrafted).buyout.single; // toBeCrafted

        switch (toBeCrafted) {
            case 22861: //Netherblüte: Fläschchen des blendenden Lichts
                item_3 = lowestPriceItems.find(element => element.item.id === 22791).buyout.single;
            break;
            case 22853: //Traumwinde: Fläschchen der mächtigen Wiederherstellung
                item_3 = lowestPriceItems.find(element => element.item.id === 22786).buyout.single;
            break;
            case 22851 : //Urflechte: Fläschchen der Stärkung
                item_3 = lowestPriceItems.find(element => element.item.id === 22790).buyout.single;
            break;
            case 22854: //Terozapfen: Fläschchen des unerbittlichen Angriffs
                item_3 = lowestPriceItems.find(element => element.item.id === 22789).buyout.single;
            break;
            case 22866: //Alptraumranke: Fläschchen des reinen Todes
                item_3 = lowestPriceItems.find(element => element.item.id === 22792).buyout.single;
            break;
            default:
            break;
        }
        const totalComponentsPrice = item_1 + (3*item_2) + (7*item_3);
        profit = Math.floor( (flaskPrice*0.95) - totalComponentsPrice );
        profit = slicePrice(profit.toString(),profit.toString().length);
        // console.log(item_1, item_2, item_3, flaskPrice, profit, toBeCrafted);
    }
    return profit;
}

module.exports = {
    itemIDs,
    convertDate,
    requestItemURL,
    requestAuctionURL,
    getPrice,
    getSingle,
    setCheapest,
    calcProfit,
};