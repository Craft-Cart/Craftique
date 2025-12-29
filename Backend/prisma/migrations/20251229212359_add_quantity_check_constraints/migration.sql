-- Add CHECK constraints to prevent negative quantity values
-- This prevents business logic errors at the database level

-- Item.quantity should be >= 0 (can be zero for out of stock items)
ALTER TABLE "Item" ADD CONSTRAINT "Item_quantity_check" CHECK (quantity >= 0);

-- OrderItem.quantity should be > 0 (order items must have positive quantity)
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_check" CHECK (quantity > 0);

-- ProductVariant.quantity should be >= 0 (can be zero for out of stock variants)
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_quantity_check" CHECK (quantity >= 0);

