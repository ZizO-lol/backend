# E-Commerce System - Database Design Document

## 1. Executive Summary

This document provides comprehensive documentation of the database design for the E-Commerce System. It includes entity-relationship diagrams, schema specifications, relationships, constraints, and indexing strategies to ensure optimal performance, scalability, and data integrity.

## 2. Database Overview

### 2.1 Database Management System
- **DBMS**: MongoDB (NoSQL Document Database)
- **ODM**: Mongoose (for Node.js)
- **Version**: MongoDB 6.x or higher

### 2.2 Design Principles
- **Scalability**: Designed to handle millions of records
- **Performance**: Optimized queries with proper indexing
- **Data Integrity**: Validation at application and database level
- **Flexibility**: Schema flexibility for evolving requirements
- **Security**: Role-based access control and data encryption

### 2.3 Database Architecture
- **Primary Database**: Main transactional database
- **Replica Set**: For high availability and read scaling
- **Sharding**: For horizontal scaling (future implementation)
- **Caching Layer**: Redis for frequently accessed data

---

## 3. Entity-Relationship Diagram (ERD)

### 3.1 High-Level ERD

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │────────▶│   Order     │◀────────│   Product   │
│             │  places │             │ contains│             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                       │
      │                       │                       │
      │ has                   │ has                   │ belongs to
      │                       │                       │
      ▼                       ▼                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Address   │         │  Payment    │         │  Category   │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                                               │
      │                                               │
      │                       ┌─────────────┐        │
      └──────────────────────▶│    Cart     │        │
                              │             │        │
                              └─────────────┘        │
                                    │                │
                                    │ has            │ has
                                    │                │
                                    ▼                ▼
                              ┌─────────────┐  ┌─────────────┐
                              │  CartItem   │  │   Review    │
                              │             │  │             │
                              └─────────────┘  └─────────────┘
```

### 3.2 Detailed Entity Relationships

1. **User → Address**: One-to-Many (A user can have multiple addresses)
2. **User → Order**: One-to-Many (A user can place multiple orders)
3. **User → Cart**: One-to-One (A user has one active cart)
4. **User → Review**: One-to-Many (A user can write multiple reviews)
5. **Order → OrderItem**: One-to-Many (An order contains multiple items)
6. **Order → Payment**: One-to-One (Each order has one payment)
7. **Product → Category**: Many-to-One (Products belong to categories)
8. **Product → Review**: One-to-Many (Products can have multiple reviews)
9. **Product → OrderItem**: One-to-Many (Products appear in multiple orders)
10. **Cart → CartItem**: One-to-Many (A cart contains multiple items)
11. **CartItem → Product**: Many-to-One (Cart items reference products)

---

## 4. Collection Schemas

### 4.1 Users Collection

**Collection Name**: `users`

**Purpose**: Store user account information for customers, sellers, and administrators.

**Schema**:

```typescript
{
  _id: ObjectId,                    // Auto-generated MongoDB ID
  email: String,                    // Unique, required, indexed
  username: String,                 // Unique, optional
  password: String,                 // Hashed, required
  firstName: String,                // Required
  lastName: String,                 // Required
  role: String,                     // Enum: ['customer', 'seller', 'admin']
  phoneNumber: String,              // Optional, validated format
  avatar: String,                   // URL to profile image
  isEmailVerified: Boolean,         // Default: false
  isActive: Boolean,                // Default: true
  lastLogin: Date,                  // Timestamp of last login
  preferences: {
    newsletter: Boolean,            // Default: true
    notifications: Boolean,         // Default: true
    language: String,               // Default: 'en'
    currency: String                // Default: 'USD'
  },
  addresses: [ObjectId],            // Reference to Address documents
  wishlist: [ObjectId],             // Reference to Product documents
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}
```

**Indexes**:
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true, sparse: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ isActive: 1 })
db.users.createIndex({ createdAt: -1 })
```

**Validations**:
- Email: Valid email format, unique
- Password: Minimum 8 characters, hashed with bcrypt
- Role: Must be one of: 'customer', 'seller', 'admin'
- Phone: Valid phone number format (E.164)

---

### 4.2 Products Collection

**Collection Name**: `products`

**Purpose**: Store product information including details, pricing, and inventory.

**Schema**:

```typescript
{
  _id: ObjectId,
  name: String,                     // Required, indexed
  slug: String,                     // URL-friendly, unique, indexed
  description: String,              // Required, full text indexed
  shortDescription: String,         // Optional, summary
  sku: String,                      // Stock Keeping Unit, unique
  category: ObjectId,               // Reference to Category
  subcategory: String,              // Optional
  brand: String,                    // Optional
  price: {
    regular: Number,                // Required, minimum 0
    sale: Number,                   // Optional, must be < regular
    currency: String                // Default: 'USD'
  },
  inventory: {
    quantity: Number,               // Required, minimum 0
    lowStockThreshold: Number,      // Default: 10
    status: String,                 // Enum: ['in_stock', 'low_stock', 'out_of_stock']
    allowBackorder: Boolean         // Default: false
  },
  images: [{
    url: String,                    // Image URL
    alt: String,                    // Alt text for accessibility
    isPrimary: Boolean              // One primary image per product
  }],
  specifications: {                 // Flexible key-value pairs
    type: Map,
    of: String
  },
  dimensions: {
    weight: Number,                 // In kg
    length: Number,                 // In cm
    width: Number,                  // In cm
    height: Number                  // In cm
  },
  shipping: {
    freeShipping: Boolean,          // Default: false
    shippingClass: String,          // Enum: ['standard', 'express', 'overnight']
    estimatedDays: Number           // Estimated delivery days
  },
  seo: {
    title: String,                  // SEO title
    description: String,            // SEO description
    keywords: [String]              // SEO keywords
  },
  ratings: {
    average: Number,                // Calculated average rating (0-5)
    count: Number                   // Total number of ratings
  },
  seller: ObjectId,                 // Reference to User (seller)
  status: String,                   // Enum: ['draft', 'published', 'archived']
  featured: Boolean,                // Default: false
  tags: [String],                   // Product tags
  variants: [{                      // Product variations (size, color, etc.)
    name: String,
    values: [String],
    priceModifier: Number           // Price adjustment for variant
  }],
  relatedProducts: [ObjectId],      // Reference to related products
  totalSold: Number,                // Total units sold
  viewCount: Number,                // Product view counter
  isActive: Boolean,                // Default: true
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.products.createIndex({ name: 1 })
db.products.createIndex({ slug: 1 }, { unique: true })
db.products.createIndex({ sku: 1 }, { unique: true })
db.products.createIndex({ category: 1 })
db.products.createIndex({ 'price.regular': 1 })
db.products.createIndex({ 'ratings.average': -1 })
db.products.createIndex({ status: 1, isActive: 1 })
db.products.createIndex({ featured: 1 })
db.products.createIndex({ seller: 1 })
db.products.createIndex({ tags: 1 })
db.products.createIndex({ createdAt: -1 })
// Full-text search index
db.products.createIndex({ 
  name: "text", 
  description: "text", 
  tags: "text" 
})
```

**Validations**:
- Name: Required, 3-200 characters
- Price: Must be positive number
- Inventory quantity: Cannot be negative
- SKU: Unique identifier
- Status: Must be valid enum value

---

### 4.3 Categories Collection

**Collection Name**: `categories`

**Purpose**: Organize products into hierarchical categories.

**Schema**:

```typescript
{
  _id: ObjectId,
  name: String,                     // Required, unique per parent
  slug: String,                     // URL-friendly, unique
  description: String,              // Optional
  parent: ObjectId,                 // Reference to parent category (null for root)
  image: String,                    // Category image URL
  icon: String,                     // Icon class or URL
  level: Number,                    // Hierarchy level (0 for root)
  order: Number,                    // Display order
  isActive: Boolean,                // Default: true
  metadata: {
    seoTitle: String,
    seoDescription: String,
    keywords: [String]
  },
  productCount: Number,             // Cached count of products
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.categories.createIndex({ slug: 1 }, { unique: true })
db.categories.createIndex({ parent: 1 })
db.categories.createIndex({ level: 1 })
db.categories.createIndex({ order: 1 })
db.categories.createIndex({ isActive: 1 })
```

---

### 4.4 Orders Collection

**Collection Name**: `orders`

**Purpose**: Track customer orders from placement to fulfillment.

**Schema**:

```typescript
{
  _id: ObjectId,
  orderNumber: String,              // Unique, auto-generated (ORD-YYYYMMDD-XXXXX)
  user: ObjectId,                   // Reference to User
  items: [{
    product: ObjectId,              // Reference to Product
    productSnapshot: {              // Snapshot at time of order
      name: String,
      sku: String,
      image: String,
      price: Number
    },
    quantity: Number,               // Required, minimum 1
    price: Number,                  // Price at time of purchase
    variant: String,                // Optional variant selection
    subtotal: Number                // quantity * price
  }],
  pricing: {
    subtotal: Number,               // Sum of item subtotals
    tax: Number,                    // Calculated tax
    shipping: Number,               // Shipping cost
    discount: Number,               // Discount amount
    total: Number                   // Final total amount
  },
  shippingAddress: {
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },
  billingAddress: {                 // Same structure as shippingAddress
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },
  payment: ObjectId,                // Reference to Payment document
  status: String,                   // Enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  shippingMethod: String,           // Enum: ['standard', 'express', 'overnight']
  tracking: {
    carrier: String,                // Shipping carrier name
    trackingNumber: String,         // Tracking number
    trackingUrl: String,            // Tracking URL
    estimatedDelivery: Date,        // Estimated delivery date
    actualDelivery: Date            // Actual delivery date
  },
  notes: {
    customer: String,               // Customer notes
    admin: String                   // Internal admin notes
  },
  timeline: [{
    status: String,
    timestamp: Date,
    note: String,
    updatedBy: ObjectId             // User who made the update
  }],
  couponCode: String,               // Applied coupon code
  discount: {
    code: String,
    amount: Number,
    type: String                    // Enum: ['percentage', 'fixed']
  },
  refund: {
    amount: Number,
    reason: String,
    status: String,                 // Enum: ['requested', 'approved', 'rejected', 'processed']
    processedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ user: 1, createdAt: -1 })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ 'tracking.trackingNumber': 1 })
db.orders.createIndex({ createdAt: -1 })
db.orders.createIndex({ 'items.product': 1 })
```

**Validations**:
- Order number: Unique, auto-generated
- Items: At least one item required
- Status: Must be valid enum value
- Pricing calculations: Validated and recalculated

---

### 4.5 Payments Collection

**Collection Name**: `payments`

**Purpose**: Record payment transactions and details.

**Schema**:

```typescript
{
  _id: ObjectId,
  order: ObjectId,                  // Reference to Order
  user: ObjectId,                   // Reference to User
  amount: Number,                   // Required, minimum 0
  currency: String,                 // Default: 'USD'
  method: String,                   // Enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer']
  status: String,                   // Enum: ['pending', 'processing', 'completed', 'failed', 'refunded']
  transactionId: String,            // Payment gateway transaction ID
  gateway: String,                  // Payment gateway name
  gatewayResponse: Object,          // Raw gateway response (encrypted)
  paymentDetails: {
    last4: String,                  // Last 4 digits of card
    brand: String,                  // Card brand (Visa, Mastercard, etc.)
    expiryMonth: String,
    expiryYear: String,
    holderName: String
  },
  billingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  refund: {
    amount: Number,
    reason: String,
    refundId: String,
    processedAt: Date
  },
  metadata: Object,                 // Additional payment metadata
  failureReason: String,            // Reason for failed payment
  attempts: Number,                 // Number of payment attempts
  paidAt: Date,                     // Timestamp of successful payment
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.payments.createIndex({ order: 1 })
db.payments.createIndex({ user: 1 })
db.payments.createIndex({ transactionId: 1 }, { unique: true, sparse: true })
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ createdAt: -1 })
```

**Security**:
- Payment details are encrypted at rest
- PCI DSS compliance for card data
- Sensitive data stored in payment gateway, not locally

---

### 4.6 Carts Collection

**Collection Name**: `carts`

**Purpose**: Store user shopping carts for persistent cart functionality.

**Schema**:

```typescript
{
  _id: ObjectId,
  user: ObjectId,                   // Reference to User (null for guest carts)
  sessionId: String,                // For guest carts
  items: [{
    product: ObjectId,              // Reference to Product
    quantity: Number,               // Required, minimum 1
    price: Number,                  // Current product price
    variant: String,                // Selected variant
    addedAt: Date                   // When item was added
  }],
  totals: {
    subtotal: Number,               // Sum of all items
    tax: Number,                    // Estimated tax
    shipping: Number,               // Estimated shipping
    total: Number                   // Estimated total
  },
  couponCode: String,               // Applied coupon
  discount: Number,                 // Discount amount
  status: String,                   // Enum: ['active', 'abandoned', 'converted']
  expiresAt: Date,                  // Cart expiration date
  lastActivity: Date,               // Last cart activity
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.carts.createIndex({ user: 1 }, { unique: true, sparse: true })
db.carts.createIndex({ sessionId: 1 }, { sparse: true })
db.carts.createIndex({ status: 1 })
db.carts.createIndex({ expiresAt: 1 })
db.carts.createIndex({ lastActivity: -1 })
```

**TTL Index** (for automatic cart cleanup):
```javascript
db.carts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

### 4.7 Reviews Collection

**Collection Name**: `reviews`

**Purpose**: Store product reviews and ratings from customers.

**Schema**:

```typescript
{
  _id: ObjectId,
  product: ObjectId,                // Reference to Product
  user: ObjectId,                   // Reference to User
  order: ObjectId,                  // Reference to Order (verified purchase)
  rating: Number,                   // Required, 1-5
  title: String,                    // Review title
  comment: String,                  // Review text
  images: [String],                 // Review images URLs
  pros: [String],                   // Product pros
  cons: [String],                   // Product cons
  isVerifiedPurchase: Boolean,      // Default: false
  helpful: {
    count: Number,                  // Helpful votes count
    voters: [ObjectId]              // Users who voted
  },
  reported: {
    count: Number,                  // Report count
    reasons: [String]               // Report reasons
  },
  status: String,                   // Enum: ['pending', 'approved', 'rejected']
  adminReply: {
    text: String,
    repliedBy: ObjectId,
    repliedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.reviews.createIndex({ product: 1, createdAt: -1 })
db.reviews.createIndex({ user: 1 })
db.reviews.createIndex({ rating: 1 })
db.reviews.createIndex({ status: 1 })
db.reviews.createIndex({ isVerifiedPurchase: 1 })
db.reviews.createIndex({ 'helpful.count': -1 })
```

---

### 4.8 Addresses Collection

**Collection Name**: `addresses`

**Purpose**: Store user addresses for shipping and billing.

**Schema**:

```typescript
{
  _id: ObjectId,
  user: ObjectId,                   // Reference to User
  type: String,                     // Enum: ['shipping', 'billing', 'both']
  fullName: String,                 // Required
  company: String,                  // Optional
  addressLine1: String,             // Required
  addressLine2: String,             // Optional (apartment, suite, etc.)
  city: String,                     // Required
  state: String,                    // Required
  postalCode: String,               // Required
  country: String,                  // Required
  phone: String,                    // Required
  isDefault: Boolean,               // Default: false
  isActive: Boolean,                // Default: true
  coordinates: {                    // For location-based features
    latitude: Number,
    longitude: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.addresses.createIndex({ user: 1 })
db.addresses.createIndex({ user: 1, isDefault: 1 })
db.addresses.createIndex({ postalCode: 1 })
```

---

### 4.9 Coupons Collection

**Collection Name**: `coupons`

**Purpose**: Manage discount coupons and promotional codes.

**Schema**:

```typescript
{
  _id: ObjectId,
  code: String,                     // Unique coupon code
  description: String,              // Coupon description
  type: String,                     // Enum: ['percentage', 'fixed', 'free_shipping']
  value: Number,                    // Discount value
  minimumPurchase: Number,          // Minimum order amount
  maximumDiscount: Number,          // Maximum discount amount (for percentage)
  applicableProducts: [ObjectId],   // Specific products (empty = all)
  applicableCategories: [ObjectId], // Specific categories
  usageLimit: {
    total: Number,                  // Total usage limit
    perUser: Number                 // Per user limit
  },
  usageCount: Number,               // Current usage count
  userRestrictions: {
    newUsersOnly: Boolean,
    specificUsers: [ObjectId]
  },
  validFrom: Date,                  // Start date
  validUntil: Date,                 // End date
  isActive: Boolean,                // Default: true
  createdBy: ObjectId,              // Admin who created
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.coupons.createIndex({ code: 1 }, { unique: true })
db.coupons.createIndex({ isActive: 1, validFrom: 1, validUntil: 1 })
db.coupons.createIndex({ applicableProducts: 1 })
db.coupons.createIndex({ applicableCategories: 1 })
```

---

### 4.10 Wishlists Collection

**Collection Name**: `wishlists`

**Purpose**: Store user wishlists (alternative to embedding in user document).

**Schema**:

```typescript
{
  _id: ObjectId,
  user: ObjectId,                   // Reference to User
  name: String,                     // Wishlist name (e.g., "Birthday", "Christmas")
  items: [{
    product: ObjectId,              // Reference to Product
    addedAt: Date,
    priority: Number,               // Priority (1-5)
    notes: String                   // Personal notes
  }],
  isPublic: Boolean,                // Default: false
  shareToken: String,               // Token for sharing wishlist
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.wishlists.createIndex({ user: 1 })
db.wishlists.createIndex({ shareToken: 1 }, { unique: true, sparse: true })
```

---

## 5. Relationships and Constraints

### 5.1 Referential Integrity

MongoDB doesn't enforce referential integrity at the database level, so we implement it at the application level using Mongoose middleware:

```javascript
// Example: Cascade delete reviews when product is deleted
productSchema.pre('remove', async function(next) {
  await Review.deleteMany({ product: this._id });
  next();
});
```

### 5.2 Data Denormalization Strategy

To optimize read performance, we denormalize certain frequently accessed data:

1. **Product Snapshot in Orders**: Store product details at the time of order
2. **User Information in Reviews**: Cache user name and avatar
3. **Category Path in Products**: Store full category path for easier querying
4. **Rating Summary in Products**: Cache average rating and count

---

## 6. Indexing Strategy

### 6.1 Index Types

1. **Single Field Indexes**: For frequently queried fields
2. **Compound Indexes**: For queries filtering on multiple fields
3. **Text Indexes**: For full-text search on product names and descriptions
4. **TTL Indexes**: For automatic document expiration (carts, sessions)
5. **Geospatial Indexes**: For location-based features (future)

### 6.2 Index Monitoring

- Monitor index usage with `db.collection.stats()`
- Remove unused indexes
- Analyze slow queries with profiler
- Review index performance quarterly

---

## 7. Data Migration Strategy

### 7.1 Schema Versioning

Each collection includes a `schemaVersion` field for tracking schema changes:

```javascript
{
  schemaVersion: Number  // Current: 1
}
```

### 7.2 Migration Process

1. **Backup**: Create full database backup
2. **Develop Migration**: Write and test migration script
3. **Staging Test**: Run migration on staging environment
4. **Monitor**: Check for errors and performance issues
5. **Production**: Execute migration during low-traffic period
6. **Verify**: Validate data integrity post-migration
7. **Rollback Plan**: Maintain rollback scripts

---

## 8. Performance Optimization

### 8.1 Query Optimization

- Use projection to limit returned fields
- Implement pagination for large result sets
- Use aggregation pipeline for complex queries
- Cache frequently accessed data with Redis

### 8.2 Caching Strategy

**Cache Layers**:
1. **Application Cache** (Redis): 
   - Product catalog
   - Category tree
   - User sessions
   - Shopping carts

2. **Database Query Cache**:
   - Popular products
   - Featured categories
   - Best sellers

**Cache TTL**:
- Product details: 1 hour
- Category tree: 24 hours
- User cart: 7 days
- Session data: Based on JWT expiry

---

## 9. Security Considerations

### 9.1 Data Encryption

- **At Rest**: MongoDB encryption at rest
- **In Transit**: TLS/SSL for all connections
- **Application Level**: Encrypt sensitive fields (payment details)

### 9.2 Access Control

```javascript
// Role-based access control
db.createUser({
  user: "ecommerce_app",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "ecommerce" }
  ]
});
```

### 9.3 Data Sanitization

- Sanitize all user inputs
- Validate data types and formats
- Prevent NoSQL injection
- Use parameterized queries

---

## 10. Backup and Recovery

### 10.1 Backup Strategy

- **Frequency**: Daily automated backups
- **Retention**: 30 days for daily, 1 year for monthly
- **Type**: Full database dumps using `mongodump`
- **Storage**: Encrypted storage in cloud (S3, Azure Blob)

### 10.2 Recovery Procedures

1. **Identify Issue**: Determine data loss scope
2. **Select Backup**: Choose appropriate backup point
3. **Restore**: Use `mongorestore` to restore data
4. **Verify**: Check data integrity
5. **Sync**: Update to latest state if needed

---

## 11. Monitoring and Maintenance

### 11.1 Monitoring Metrics

- Query performance
- Index usage
- Database size growth
- Connection pool status
- Replication lag
- Disk I/O

### 11.2 Maintenance Tasks

**Daily**:
- Monitor slow queries
- Check error logs
- Verify backups

**Weekly**:
- Review index usage
- Analyze query patterns
- Check disk space

**Monthly**:
- Performance audit
- Index optimization
- Capacity planning review

---

## 12. Scaling Strategy

### 12.1 Vertical Scaling
- Increase server resources (CPU, RAM, storage)
- Optimize queries and indexes
- Implement caching

### 12.2 Horizontal Scaling (Future)

**Sharding Strategy**:
- **Shard Key**: User ID for user-specific collections
- **Shard Key**: Product Category for products
- **Shard Key**: Order Date for orders

**Replica Sets**:
- 3-member replica set minimum
- Read preference: secondary for read-heavy operations
- Write concern: majority for critical operations

---

## 13. Sample Queries

### 13.1 Common Queries

```javascript
// Get products by category with pagination
db.products.find({ 
  category: ObjectId("..."), 
  status: "published",
  isActive: true 
})
.sort({ 'ratings.average': -1 })
.skip(0)
.limit(20);

// Get user order history
db.orders.find({ 
  user: ObjectId("...") 
})
.sort({ createdAt: -1 })
.limit(10);

// Search products
db.products.find({
  $text: { $search: "laptop gaming" }
}, {
  score: { $meta: "textScore" }
})
.sort({ score: { $meta: "textScore" } });

// Get low stock products
db.products.find({
  'inventory.quantity': { $lte: 10 },
  status: "published",
  isActive: true
});

// Aggregate sales by category
db.orders.aggregate([
  { $unwind: "$items" },
  { $lookup: {
      from: "products",
      localField: "items.product",
      foreignField: "_id",
      as: "productInfo"
  }},
  { $group: {
      _id: "$productInfo.category",
      totalSales: { $sum: "$items.subtotal" },
      orderCount: { $sum: 1 }
  }}
]);
```

---

## 14. Conclusion

This database design provides a solid foundation for the E-Commerce System with:
- Scalable schema design
- Optimized indexing strategy
- Data integrity and security
- Performance considerations
- Clear migration and maintenance procedures

The design will evolve as requirements change, and this document should be updated accordingly.

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-23  
**Next Review Date**: 2025-12-23  
**Document Owner**: Database Administrator / Lead Developer
