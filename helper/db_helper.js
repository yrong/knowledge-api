var countBySql = function(client,sql,callback){
    query = client.query(sql,function(err, result){
        if(err){
            callback(err, null);
            return;
        }
        let count=parseInt(result.rows[0].count);
        callback(null,count);
    });
};
module.exports.countBySql = countBySql;

var countByTableNameAndWhere = function(client,table,alias='t',where,callback){
    countBySql(client,'select count(*) from ' + table + " as "+ alias + (where?(' where '+ where):''),callback);
};

module.exports.countByTableNameAndWhere = countByTableNameAndWhere;


