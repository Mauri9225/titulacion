const productService = require('../services/product.service');

async function listProducts(req, res, next) {
  try {
    res.json(await productService.list(req.query));
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productService.update(req.params.id, req.body);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await productService.remove(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
};
