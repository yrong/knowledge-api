module.exports = function (sequelize, DataTypes) {
    var Nofification = sequelize.define("Notification",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true,defaultValue: DataTypes.UUIDV4},
            user_id:{type: DataTypes.INTEGER,allowNull: false},
            action:{type: DataTypes.STRING, allowNull: false},
            old:{type: DataTypes.JSONB},
            new:{type: DataTypes.JSONB},
            update:{type: DataTypes.JSONB},
            type:{type:DataTypes.STRING,allowNull: false},
            notified_user:{type:DataTypes.ARRAY(DataTypes.INTEGER),defaultValue:[-1]}
        });
    return Nofification;
};