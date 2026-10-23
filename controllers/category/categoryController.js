import categoryModel from '../../models/category/categoryModel.js';
import { v2 as cloudinary } from 'cloudinary';

const uploadToCloudinary = (buffer) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
    if (error) reject(error); else resolve(result.secure_url);
  }).end(buffer);
});

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, description, hangerStyle } = req.body;

    if (!name) {
      return res.json({ success: false, message: 'Category name is required' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const category = new categoryModel({ name, description, image: imageUrl, hangerStyle: hangerStyle || 'auto' });
    await category.save();

    res.json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({});
    res.json({ success: true, categories });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    await categoryModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { name, description, hangerStyle } = req.body;

    let updateData = { name, description };
    if (hangerStyle) updateData.hangerStyle = hangerStyle;
    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.buffer);
    }

    await categoryModel.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export { createCategory, getCategories, deleteCategory, updateCategory };
