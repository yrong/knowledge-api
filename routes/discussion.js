const Router = require('koa-router')
const discussions = new Router();
const {post_processor,delete_processor,findOne_processor,findAll_processor,search_processor,timeline_search_processor,timeline_update_processor} = require('./common')
discussions.post("/",post_processor);
discussions.del('/:uuid',delete_processor);
discussions.get('/:uuid',findOne_processor);
discussions.get('/',findAll_processor);
discussions.post('/search',search_processor);

module.exports = discussions
