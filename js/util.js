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

module.exports = { 
    reverse,
    //price
};