var validator = require('validator');
module.exports = (req, res, next) => {
    var idcode=req.params.uuid;
    if(!idcode||!validator.isUUID(idcode,[4])){
        return next(new Error(res.__('RequestParamError.IdInvalid')))
    }
    next();
};
