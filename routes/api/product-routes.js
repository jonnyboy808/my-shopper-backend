const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// finds all products
router.get('/', async (req, res) => {
  try {
    const getProducts = await Product.findAll({
      include: [{ model: Category }, { model: Tag }]
    });
    res.status(200).json(getProducts)
  } catch (err) {
    res.status(400).json(err)
  }
});

// finds a single product by its 'id'
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getOneProduct = await Product.findByPk(id, {
      include: [{ model: Category }, { model: Tag }]
    });

    if (!getOneProduct) {
      res.status(404).json({ message: `No product with id ${id} found` });
      return;
    }
    res.status(200).json(getOneProduct);
  } catch (err) {
    res.status(400).json(err)
  }
});

// creates new product
router.post('/', (req, res) => {
  Product.create(req.body)
    .then((product) => {
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// updates product and all associated tags
// get list of current tag ids and filters list of new tag ids
router.put('/:id', (req, res) => {
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      res.status(400).json(err);
    });
});

// deletes one product by its 'id'
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deletedProduct = await Product.destroy({
      where: {
        id: id
      }
    })
    if (!deletedProduct) {
      res.status(404).json({ message: `No product with id ${id} found` })
    }
    res.status(200).json({ message: `Product with id ${id} successfully deleted!` })
  } catch (err) {
    res.status(400).json(err)
  }
});

module.exports = router;
