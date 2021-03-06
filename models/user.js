"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      user.hasOne(models.seller, { foreignKey: "userId" });
      user.belongsToMany(models.kit, {
        through: "purchases",
        foreignKey: "userId",
      });
    }
  }
  user.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      address: DataTypes.STRING,
      phone: DataTypes.STRING,
      isSeller: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "user",
    }
  );
  return user;
};
