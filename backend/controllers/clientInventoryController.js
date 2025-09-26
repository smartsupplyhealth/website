const ClientInventory = require('../models/ClientInventory');

// @desc    Get the inventory for the logged-in client
// @route   GET /api/client-inventory
// @access  Private (Client)
exports.getClientInventory = async (req, res) => {
  try {
    // Find all inventory items for the current client and populate product details
    const inventory = await ClientInventory.find({ client: req.user.id })
      .populate('product', 'name reference category images price') 
      .sort({ createdAt: -1 });

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching client inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update settings for a specific inventory item
// @route   PUT /api/client-inventory/:inventoryId
// @access  Private (Client)
exports.updateInventoryItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { dailyUsage, reorderPoint, reorderQty, autoOrder } = req.body;

    // Find the item, ensuring it belongs to the logged-in client
    const item = await ClientInventory.findOne({ _id: inventoryId, client: req.user.id });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found or access denied.' });
    }

    // Update only the fields provided by the client
    if (dailyUsage !== undefined) item.dailyUsage = dailyUsage;
    if (reorderPoint !== undefined) item.reorderPoint = reorderPoint;
    if (reorderQty !== undefined) item.reorderQty = reorderQty;
    if (autoOrder && autoOrder.enabled !== undefined) {
      item.autoOrder.enabled = autoOrder.enabled;
    }

    const updatedItem = await item.save();
    
    // Re-populate the product details to ensure the full product object is returned
    const populatedItem = await ClientInventory.findById(updatedItem._id)
      .populate('product', 'name reference category images price');

    res.json(populatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
