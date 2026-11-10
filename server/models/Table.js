import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  name: { 
    type: String, 
    default: '' 
  },
  zone: { 
    type: String, 
    default: 'Asosiy zal', 
    trim: true 
  },
  capacity: { 
    type: Number, 
    default: 4, 
    min: 1, 
    max: 50 
  },
  status: { 
    type: String, 
    enum: ['FREE', 'OCCUPIED', 'BILL_PRINTED', 'RESERVED'], 
    default: 'FREE' 
  },
  currentOrderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    default: null 
  },
  currentOrderNumber: { 
    type: String, 
    default: null 
  },
  currentTotal: { 
    type: Number, 
    default: 0 
  },
  itemCount: { 
    type: Number, 
    default: 0 
  },
  openedAt: { 
    type: Date, 
    default: null 
  },
  occupiedBy: { 
    type: String, 
    default: null 
  },
  guestCount: { 
    type: Number, 
    default: 1 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  version: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

tableSchema.index({ status: 1 });
tableSchema.index({ zone: 1 });
tableSchema.index({ tableNumber: 1 });

const Table = mongoose.model('Table', tableSchema);
export default Table;
