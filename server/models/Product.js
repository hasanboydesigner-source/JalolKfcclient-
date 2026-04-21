import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String }, // Cloudinary URL
  tag: { type: String, default: 'Non Veg' },
  discount: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
