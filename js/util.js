/**
 * Used to display auction costs in gold, silver, copper
 */
function reverse(str) {
    if (str === "")
        return "";
    else
        return reverse(str.substr(1)) + str.charAt(0);
}

module.exports = { 
    reverse
};