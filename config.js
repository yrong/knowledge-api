var Config=function(){
    // Postgres连接参数
    this.PG_Connection= {
        host: '192.168.0.125',
        port: 5432,
        database: 'knowledge',
        user: 'postgres',
        password: '123456'
    };
    this.MySQL_Connection={
        host:'192.168.0.125',
        user:'root',
        password:'123456',
        port:'3306',
        database:'mysql',
    }
}
module.exports = Config;