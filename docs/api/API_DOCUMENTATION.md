# E-Commerce System - API Documentation

## 1. API Overview

### 1.1 Introduction
This document provides comprehensive documentation for the E-Commerce System REST API. The API enables interaction with all system components including user management, product catalog, shopping cart, orders, and payments.

### 1.2 Base URL
- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging-api.ecommerce.com/api`
- **Production**: `https://api.ecommerce.com/api`

### 1.3 API Version
Current Version: **v1**

### 1.4 Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### 1.5 Response Format
All responses follow a consistent JSON structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### 1.6 HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### 1.7 Rate Limiting
- **Authenticated Users**: 1000 requests per hour
- **Guest Users**: 100 requests per hour
- **Admin Users**: 5000 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635724800
```

---

## 2. Authentication Endpoints

### 2.1 User Registration
**Endpoint**: `POST /api/auth/register`

**Description**: Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer",
  "phoneNumber": "+1234567890"
}
```

**Validation Rules**:
- `email`: Valid email format, unique, required
- `password`: Minimum 8 characters, required
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters
- `role`: Optional, enum ['customer', 'seller'], default: 'customer'
- `phoneNumber`: Optional, valid phone format

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "isEmailVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

---

### 2.2 User Login
**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Login successful"
}
```

---

### 2.3 Get Current User
**Endpoint**: `GET /api/auth/me`

**Authentication**: Required

**Description**: Get authenticated user's profile information.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "phoneNumber": "+1234567890",
      "avatar": "https://...",
      "isEmailVerified": true,
      "addresses": [...],
      "wishlist": [...]
    }
  }
}
```

---

### 2.4 Update Password
**Endpoint**: `PATCH /api/auth/update-password`

**Authentication**: Required

**Request Body**:
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### 2.5 Forgot Password
**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### 2.6 Reset Password
**Endpoint**: `POST /api/auth/reset-password/:token`

**Request Body**:
```json
{
  "password": "NewPassword456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 3. Product Endpoints

### 3.1 Get All Products
**Endpoint**: `GET /api/products`

**Description**: Get paginated list of products with filtering and sorting.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `category`: Filter by category ID
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `search`: Search term for product name/description
- `sort`: Sort field (e.g., 'price', '-createdAt', 'ratings.average')
- `featured`: Filter featured products (true/false)
- `status`: Filter by status (for admin/seller)

**Example**: `/api/products?page=1&limit=20&category=electronics&sort=-ratings.average`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Wireless Headphones",
        "slug": "wireless-headphones",
        "description": "High-quality wireless headphones",
        "price": {
          "regular": 99.99,
          "sale": 79.99,
          "currency": "USD"
        },
        "images": [...],
        "category": {...},
        "ratings": {
          "average": 4.5,
          "count": 128
        },
        "inventory": {
          "quantity": 50,
          "status": "in_stock"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "totalItems": 95
    }
  }
}
```

---

### 3.2 Get Product by ID
**Endpoint**: `GET /api/products/:id`

**Description**: Get detailed information about a specific product.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Headphones",
      "slug": "wireless-headphones",
      "description": "Detailed description...",
      "shortDescription": "Brief description",
      "sku": "WH-2023-001",
      "price": {...},
      "images": [...],
      "specifications": {...},
      "dimensions": {...},
      "shipping": {...},
      "ratings": {...},
      "reviews": [...],
      "relatedProducts": [...]
    }
  }
}
```

---

### 3.3 Create Product
**Endpoint**: `POST /api/products`

**Authentication**: Required (Seller/Admin)

**Request Body**:
```json
{
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "shortDescription": "Premium wireless headphones",
  "sku": "WH-2023-001",
  "category": "507f1f77bcf86cd799439011",
  "price": {
    "regular": 99.99,
    "sale": 79.99
  },
  "inventory": {
    "quantity": 100,
    "lowStockThreshold": 10
  },
  "images": [
    {
      "url": "https://...",
      "alt": "Front view",
      "isPrimary": true
    }
  ],
  "specifications": {
    "brand": "AudioTech",
    "color": "Black",
    "connectivity": "Bluetooth 5.0"
  },
  "tags": ["wireless", "bluetooth", "noise-cancellation"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "product": {...}
  },
  "message": "Product created successfully"
}
```

---

### 3.4 Update Product
**Endpoint**: `PATCH /api/products/:id`

**Authentication**: Required (Seller/Admin)

**Request Body**: Same as Create Product (partial update allowed)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "product": {...}
  },
  "message": "Product updated successfully"
}
```

---

### 3.5 Delete Product
**Endpoint**: `DELETE /api/products/:id`

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### 3.6 Search Products
**Endpoint**: `GET /api/products/search`

**Query Parameters**:
- `q`: Search query (required)
- `page`: Page number
- `limit`: Items per page

**Example**: `/api/products/search?q=wireless+headphones`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [...],
    "searchTerm": "wireless headphones",
    "totalResults": 42
  }
}
```

---

## 4. Category Endpoints

### 4.1 Get All Categories
**Endpoint**: `GET /api/categories`

**Description**: Get hierarchical list of all categories.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and accessories",
        "level": 0,
        "productCount": 156,
        "children": [
          {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Audio",
            "slug": "audio",
            "level": 1,
            "productCount": 42
          }
        ]
      }
    ]
  }
}
```

---

### 4.2 Get Category by ID
**Endpoint**: `GET /api/categories/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "category": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices",
      "image": "https://...",
      "parent": null,
      "level": 0,
      "productCount": 156,
      "subcategories": [...]
    }
  }
}
```

---

## 5. Cart Endpoints

### 5.1 Get Cart
**Endpoint**: `GET /api/cart`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "507f1f77bcf86cd799439011",
      "user": "507f1f77bcf86cd799439012",
      "items": [
        {
          "product": {
            "_id": "...",
            "name": "Wireless Headphones",
            "price": 79.99,
            "image": "https://..."
          },
          "quantity": 2,
          "price": 79.99,
          "subtotal": 159.98
        }
      ],
      "totals": {
        "subtotal": 159.98,
        "tax": 12.80,
        "shipping": 5.99,
        "total": 178.77
      }
    }
  }
}
```

---

### 5.2 Add Item to Cart
**Endpoint**: `POST /api/cart/items`

**Authentication**: Required

**Request Body**:
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2,
  "variant": "Black/Large"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart": {...}
  },
  "message": "Item added to cart"
}
```

---

### 5.3 Update Cart Item
**Endpoint**: `PATCH /api/cart/items/:itemId`

**Authentication**: Required

**Request Body**:
```json
{
  "quantity": 3
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart": {...}
  },
  "message": "Cart updated"
}
```

---

### 5.4 Remove Item from Cart
**Endpoint**: `DELETE /api/cart/items/:itemId`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart": {...}
  },
  "message": "Item removed from cart"
}
```

---

### 5.5 Clear Cart
**Endpoint**: `DELETE /api/cart`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## 6. Order Endpoints

### 6.1 Create Order
**Endpoint**: `POST /api/orders`

**Authentication**: Required

**Request Body**:
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  },
  "billingAddress": { ... },
  "shippingMethod": "express",
  "paymentMethod": "credit_card",
  "couponCode": "SAVE10"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-20251023-00001",
      "status": "pending",
      "items": [...],
      "pricing": {
        "subtotal": 159.98,
        "tax": 12.80,
        "shipping": 9.99,
        "discount": 16.00,
        "total": 166.77
      },
      "shippingAddress": {...},
      "createdAt": "2025-10-23T11:22:00Z"
    }
  },
  "message": "Order created successfully"
}
```

---

### 6.2 Get User Orders
**Endpoint**: `GET /api/orders`

**Authentication**: Required

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "...",
        "orderNumber": "ORD-20251023-00001",
        "status": "shipped",
        "items": [...],
        "pricing": {...},
        "createdAt": "..."
      }
    ],
    "pagination": {...}
  }
}
```

---

### 6.3 Get Order by ID
**Endpoint**: `GET /api/orders/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-20251023-00001",
      "status": "shipped",
      "items": [...],
      "pricing": {...},
      "shippingAddress": {...},
      "tracking": {
        "carrier": "FedEx",
        "trackingNumber": "123456789",
        "trackingUrl": "https://...",
        "estimatedDelivery": "2025-10-25"
      },
      "timeline": [
        {
          "status": "confirmed",
          "timestamp": "2025-10-23T11:30:00Z",
          "note": "Order confirmed"
        },
        {
          "status": "shipped",
          "timestamp": "2025-10-23T14:00:00Z",
          "note": "Package shipped"
        }
      ]
    }
  }
}
```

---

### 6.4 Cancel Order
**Endpoint**: `POST /api/orders/:id/cancel`

**Authentication**: Required

**Request Body**:
```json
{
  "reason": "Changed my mind"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "order": {...}
  },
  "message": "Order cancelled successfully"
}
```

---

## 7. Payment Endpoints

### 7.1 Process Payment
**Endpoint**: `POST /api/payments`

**Authentication**: Required

**Request Body**:
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "method": "credit_card",
  "gateway": "stripe",
  "paymentToken": "tok_visa",
  "billingAddress": {...}
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "payment": {
      "_id": "...",
      "order": "...",
      "amount": 166.77,
      "status": "completed",
      "transactionId": "ch_3L...",
      "method": "credit_card"
    }
  },
  "message": "Payment processed successfully"
}
```

---

### 7.2 Get Payment Details
**Endpoint**: `GET /api/payments/:id`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "payment": {
      "_id": "...",
      "order": {...},
      "amount": 166.77,
      "status": "completed",
      "method": "credit_card",
      "paymentDetails": {
        "last4": "4242",
        "brand": "Visa"
      },
      "paidAt": "2025-10-23T11:35:00Z"
    }
  }
}
```

---

## 8. Review Endpoints

### 8.1 Get Product Reviews
**Endpoint**: `GET /api/products/:productId/reviews`

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `sort`: Sort by (e.g., '-helpful.count', '-createdAt')

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "...",
        "user": {
          "firstName": "John",
          "lastName": "D.",
          "avatar": "..."
        },
        "rating": 5,
        "title": "Excellent product!",
        "comment": "Very satisfied with this purchase.",
        "isVerifiedPurchase": true,
        "helpful": {
          "count": 12
        },
        "createdAt": "2025-10-20T10:00:00Z"
      }
    ],
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 128,
      "ratingDistribution": {
        "5": 80,
        "4": 30,
        "3": 10,
        "2": 5,
        "1": 3
      }
    }
  }
}
```

---

### 8.2 Create Review
**Endpoint**: `POST /api/products/:productId/reviews`

**Authentication**: Required

**Request Body**:
```json
{
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very satisfied with this purchase.",
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "review": {...}
  },
  "message": "Review submitted successfully"
}
```

---

### 8.3 Update Review
**Endpoint**: `PATCH /api/reviews/:id`

**Authentication**: Required (Review owner)

**Request Body**:
```json
{
  "rating": 4,
  "comment": "Updated review text"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "review": {...}
  },
  "message": "Review updated"
}
```

---

### 8.4 Delete Review
**Endpoint**: `DELETE /api/reviews/:id`

**Authentication**: Required (Review owner/Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Review deleted"
}
```

---

### 8.5 Mark Review as Helpful
**Endpoint**: `POST /api/reviews/:id/helpful`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "helpfulCount": 13
  },
  "message": "Marked as helpful"
}
```

---

## 9. Admin Endpoints

### 9.1 Dashboard Statistics
**Endpoint**: `GET /api/admin/dashboard`

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalOrders": 1234,
      "totalRevenue": 123456.78,
      "totalCustomers": 5678,
      "totalProducts": 234,
      "recentOrders": [...],
      "topProducts": [...],
      "salesByCategory": [...]
    }
  }
}
```

---

### 9.2 Manage Users
**Endpoint**: `GET /api/admin/users`

**Authentication**: Required (Admin)

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `role`: Filter by role
- `status`: Filter by status

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {...}
  }
}
```

---

### 9.3 Update Order Status
**Endpoint**: `PATCH /api/admin/orders/:id/status`

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "status": "shipped",
  "tracking": {
    "carrier": "FedEx",
    "trackingNumber": "123456789"
  },
  "note": "Package dispatched"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "order": {...}
  },
  "message": "Order status updated"
}
```

---

## 10. Webhooks

### 10.1 Payment Webhook
**Endpoint**: `POST /api/webhooks/payment`

**Description**: Receive payment gateway webhooks (Stripe, PayPal, etc.)

**Authentication**: Signature verification

**Example Payload** (Stripe):
```json
{
  "id": "evt_...",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 16677,
      "currency": "usd",
      "status": "succeeded"
    }
  }
}
```

---

## 11. Error Codes

### 11.1 Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Token expired |
| `AUTH_003` | Insufficient permissions |
| `PROD_001` | Product not found |
| `PROD_002` | Insufficient stock |
| `CART_001` | Cart not found |
| `CART_002` | Invalid cart item |
| `ORDER_001` | Order not found |
| `ORDER_002` | Cannot cancel order |
| `PAY_001` | Payment failed |
| `PAY_002` | Invalid payment method |
| `VAL_001` | Validation error |
| `SYS_001` | Internal server error |

---

## 12. Pagination

All list endpoints support pagination with consistent parameters:

**Request**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 95,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 13. Filtering and Sorting

### 13.1 Filtering
Use query parameters to filter results:
```
GET /api/products?category=electronics&minPrice=50&maxPrice=200
```

### 13.2 Sorting
Use the `sort` parameter:
```
GET /api/products?sort=-price          // Descending price
GET /api/products?sort=name            // Ascending name
GET /api/products?sort=-createdAt      // Newest first
```

---

## 14. Versioning

API versions are included in the URL:
- Current: `/api/v1/...`
- Future: `/api/v2/...`

Version deprecation will be announced 6 months in advance.

---

## 15. SDK and Libraries

### 15.1 JavaScript/TypeScript
```typescript
import { ECommerceAPI } from '@ecommerce/sdk';

const api = new ECommerceAPI({
  baseURL: 'https://api.ecommerce.com',
  apiKey: 'your-api-key'
});

// Get products
const products = await api.products.list({ 
  page: 1, 
  limit: 20 
});
```

### 15.2 Python
```python
from ecommerce_sdk import ECommerceAPI

api = ECommerceAPI(
    base_url='https://api.ecommerce.com',
    api_key='your-api-key'
)

# Get products
products = api.products.list(page=1, limit=20)
```

---

## 16. Testing

### 16.1 Postman Collection
Download the Postman collection: [E-Commerce API.postman_collection.json]

### 16.2 Test Environment
- Base URL: `https://staging-api.ecommerce.com`
- Test credentials provided upon request

---

## 17. Support

For API support:
- **Email**: api-support@ecommerce.com
- **Documentation**: https://docs.ecommerce.com
- **Status Page**: https://status.ecommerce.com

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-23  
**API Version**: v1  
**Document Owner**: API Team Lead
