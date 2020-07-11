const Helios = require("../middleware/helios");
const HELIOS = new Helios();

class Util {

    isDmChannel( channelType ){
        if ( channelType == 'dm' )
            return true;
        else 
            return  false;
    }

    parseFloat( amount ){
        return parseFloat(amount);
    }

}
module.exports = Util;