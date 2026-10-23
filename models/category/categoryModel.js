import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  // which storefront rack (and hanger) this category's products hang on.
  // 'top' / 'bottom' are older values, read as 'tshirt' / 'lowers'.
  hangerStyle: {
    type: String,
    enum: ['auto', 'tshirt', 'lowers', 'jeans', 'underwear', 'top', 'bottom'],
    default: 'auto'
  }
}, { timestamps: true });

const categoryModel = mongoose.models.category || mongoose.model('category', categorySchema);

export default categoryModel;
