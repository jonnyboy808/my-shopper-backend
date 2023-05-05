const Product = require('./Product');
const Category = require('./Category');
const Tag = require('./Tag');
const ProductTag = require('./ProductTag');

// product belongsTo category
Product.belongsTo(Category, {
  foreignKey: 'category_id'
});

// category has many product
Category.hasMany(Product, {
  foreignKey: 'category_id',
  onDelete: 'CASCADE'
});

// product belongToMany tag
Product.belongsToMany(Tag, {
  through: ProductTag,
  unique: false,
});

// tag belongToMany products
Tag.belongsToMany(Product, {
  through: ProductTag,
  unique: false,
})

module.exports = {
  Product,
  Category,
  Tag,
  ProductTag,
};