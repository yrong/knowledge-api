'use strict'


const test = function() {
    let auth_host = $('#authhost').val()|| window.location.hostname;
    $.ajax({
        url: `http://${auth_host}:3002/auth/login`,
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        timeout: 5000,
        data: JSON.stringify({
            "username":$('#username').val(),
            "password":$('#password').val()
        })
    }).done(function (res) {
        $('#token').val(res.data.token)
        let token = res.data.token
        $("#attachment").fileinput({
            uploadUrl: '/api/upload/images?token='+token,
            overwriteInitial: false,
            maxFilesNum: 1,
            maxFileCount: 1,
            allowedFileTypes: ['object']
        });
    }).fail(function(res) {
        $('#token').val('request failed:' + JSON.stringify(res))
    })
}
$('#attachment').on('fileuploaded', function (event, data, previewId, index) {
    var form = data.form, files = data.files, extra = data.extra,
        response = data.response, reader = data.reader;
    var filelink = response['data'][data.filenames[0]]
    $('#uploaded_fileName').text(data.filenames[0])
    $('#uploaded_fileUrl').text(filelink)
});

const showNotification = (event)=>{
    var options = {message:JSON.stringify(event,null,'\t')}
    var settings = {
        icon: 'fa fa-paw',
        type: 'success'
    }
    $.notify(options,settings);
}

var article_history_io = io( '/ArticleHistory' )
article_history_io.on( 'ArticleHistory', showNotification)

var discussion_history_io = io( '/DiscussionHistory' )
discussion_history_io.on( 'DiscussionHistory', showNotification)


