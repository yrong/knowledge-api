module.exports = (req, res, next) => {
    var keys = Object.keys(req.body);
    if(!keys||keys.length!=2){
        return next(new Error(res.__('RequestParamError.patchBodyInvalid')));
    }
    next();
};
