var Config=function(){
    // Postgres连接参数
    this.PG_Connection= {
        host: 'localhost',
        port: 5432,
        database: 'test',
        user: 'postgres',
        password: 'postgres',
        max: 50,
        idleTimeoutMillis: 3000
    };
    this.MySQL_Connection={
        host:'localhost',
        user:'root',
        password:'root',
        port:'3306',
        database:'test',
    };
    this.CMDB_API={
        base_url: 'http://localhost:3001'
    }
}
module.exports = Config;