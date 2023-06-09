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
      res.status(404).json({ message: `No tag with id ${id} found` });
      return;
    }
    res.status(200).json(getOneTag);
  } catch (err) {
    res.status(400).json(err)
  }
});

//creates new tag
router.post('/', (req, res) => {
  Tag.create(req.body)
    .then((tag) => {
      if (req.body.productIds && req.body.productIds.length) {
        const productTagIdArr = req.body.productIds.map((product_id) => {
          return {
            tag_id: tag.id,
            product_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // response if no product tags
      res.status(200).json(tag);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// updates tags by id
router.put('/:id', (req, res) => {
  // updates tag data
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then(() => {
      // finds all tags from productTag
      return ProductTag.findAll({ where: { tag_id: req.params.id } });
    })
    .then((productTags) => {
      // get all current productIds
      const productTagIds = productTags.map(({ product_id }) => product_id);
      // creates filtered list of new productIds
      const newProductTags = req.body.productIds
        .filter((product_id) => !productTagIds.includes(product_id))
        .map((product_id) => {
          return {
            tag_id: req.params.id,
            product_id,
          };
        });
      const productTagsToRemove = productTags
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then(() => {
      // gets updated tag data
      return Tag.findByPk(req.params.id, { include: [{ model: Product }] });
    })
    .then((updatedTag) => res.json(updatedTag))
    .catch((err) => {
      res.status(400).json(err);
    });
});

// deletes associated tag
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deletedTag = await Tag.destroy({
      where: {
        id: id
      }
    })
    if (!deletedTag) {
      res.status(404).json({ message: `No tag found with id ${id}` })
    }
    res.status(200).json({ message: `Tag with id ${id} successfully deleted!` })
  } catch (err) {
    res.status(400).json(err)
  }
});

module.exports = router;