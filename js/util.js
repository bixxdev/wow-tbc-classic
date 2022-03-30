/**
 * Used to display auction costs in gold, silver, copper
 */
reverse = (str) => {
    if (str === "")
        return "";
    else
        return reverse(str.substr(1)) + str.charAt(0);
}
//price = (g,s,c) => {
//    console.log(g+"g "+s+"s "+c+"c");
//}

/** Convert time of latest data modification from api */
convertDate = (date) => {
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};
    return new Date(date).toLocaleString("de-DE", options);
}

module.exports = { 
    reverse,
    //price
    convertDate,
};