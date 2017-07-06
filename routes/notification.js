const Router = require('koa-router')
const notifications = new Router();
const {timeline_search_processor,timeline_update_processor} = require('./common')

notifications.post('/timeline',timeline_search_processor)
notifications.put('/timeline/:uuid',timeline_update_processor)

module.exports = notifications
