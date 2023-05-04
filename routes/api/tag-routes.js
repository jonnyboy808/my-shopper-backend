const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// finds all tags
router.get('/', async (req, res) => {
  try {
    const getTags = await Tag.findAll({
      include: [{ model: Product }]
    });
    res.status(200).json(getTags)
  } catch (err) {
    res.status(400).json(err)
  }
});

// finds a single tag by its 'id'
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getOneTag = await Tag.findByPk(id, {
      include: [{ model: Product }]
    });
    if (!getOneTag) {
      res.status(404).json({ message: `No tag found with id${id}` });
      return;
    }
    res.status(200).json(getOneTag);
  } catch (err) {
    res.status(400).json(err)
  }
});

// creates a new tag
router.post('/', (req, res) => {
  Tag.create(req.body)
  .then((tag) => {
    if (req.body.productIds.length) {
      const productTagIdArr = req.body.productIds.map((product_id) => {
        return {
          tag_id: tag.id,
          product_id,
        };
      });
      return ProductTag.bulkCreate(productTagIdArr);
    }
    //responds if no tags
    res.status(200).json(tag);
  })
  .then((productTagIds) => res.status(200).json(productTagIds))
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
});

// update tags name by its 'id'
// gets list of product ids and filters list of new product ids
router.put('/:id', (req, res) => {
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((tag) => {
      return ProductTag.findAll({ where: { tag_id: req.params.id } });
    })
    .then((productTags) => {
      const productTagIds = productTags.map(({ product_id }) => product_id);
      const newProductTags = req.body.product_id
        .filter((product_id) => !productTagIds.includes(product_id))
        .map((product_id) => {
          return {
            tag_id: req.params.id,
            product_id,
          };
        });
      const productTagsToRemove = productTags
        .filter(({ product_id }) => !req.body.product_id.includes(product_id))
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

// deletes on tag by its 'id'
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deletedTag = await Tag.destroy({
      where: {
        id: id
      }
    })
    if (!deletedTag) {
      res.status(404).json({ message: `No tag found with id${id}` })
    }
    res.status(200).json({ message: `Tag with id${id} successfully deleted!` })
  } catch (err) {
    res.status(400).json(err)
  }
});

module.exports = router;
