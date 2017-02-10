var validator = require('validator');
module.exports = (req, res, next) => {
    var uuid=req.params.uuid;
    if(!uuid||!validator.isUUID(uuid,[4])){
        return next(new Error('uuid invalid'))
    }
    next();
};
