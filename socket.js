var socketio={};
var socket_io = require('socket.io');
//获取io
socketio.getSocketio = function(server){
    var io = socket_io.listen(server);
    io.on('connection', function (socket) {
        socket.emit('news', { hello: 'world' });
        socket.on('getData', function (data) {
            console.log(data);
        });
    });
};
module.exports = socketio;
