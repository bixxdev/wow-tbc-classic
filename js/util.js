/** Convert time of latest data modification from api */
convertDate = (date) => {
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};
    return new Date(date).toLocaleString("de-DE", options);
}

/**
 * slicePrice converts a number (auction buyout) and returns three numbers: gold, silver, copper
 * should only be used in getPrice()
 */
slicePrice = (num, numLength) => {
    const gold = (num >= 5) ? num.slice( 0, -4 ) : '0'; //num.slice( 0, -4 );
    const silver = (num >= 3) ? num.slice( (numLength-4), -2 ) : '00'; //num.slice( (numLength-4), -2 );
    const copper = (num > 0) ? num.slice( (numLength-2) ) : '00'; //num.slice( (numLength-2) );
    return {gold, silver, copper};
}

/**
 * getPrice return an object of 3 digits: gold, silver, copper
 */
getPrice = (auction) => {
    // get total price
    const buyoutString = auction.buyout.toString();
    const buyoutLength = buyoutString.length;
    const price = slicePrice(buyoutString, buyoutLength);
    // get single price
    let singleBuyoutString = Math.floor(buyoutString / auction.quantity).toString();
    const singleBuyoutLength = singleBuyoutString.length;
    const singlePrice = slicePrice(singleBuyoutString, singleBuyoutLength);
    return {price, singlePrice};
}

module.exports = { 
    convertDate,
    getPrice,
};