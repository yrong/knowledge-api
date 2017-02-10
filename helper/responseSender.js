const STATUS_OK = 'ok',STATUS_WARNING = 'warning',STATUS_ERROR='error'
    CONTENT_OPERATION_SUCESS='operation success',CONTENT_NO_RECORD='no record found'
    DISPLAY_AS_TOAST='toast',DISPLAY_AS_MODEL='model';

module.exports = (req,res,result)=>{
    let response_wrapped = {
        status:STATUS_OK,
        message: {
            content: CONTENT_OPERATION_SUCESS,
            displayAs: DISPLAY_AS_TOAST
        }
    }
    if(result instanceof Error){
        response_wrapped.status = STATUS_ERROR
        response_wrapped.message = {content:String(result),displayAs:DISPLAY_AS_MODEL}
        res.status(result.status || 500)
    }else{
        if(result)
            response_wrapped.data = result
    }
    res.send(response_wrapped);
}
