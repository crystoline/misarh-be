# Admin API Reference

Base URL: `/api/admin`

All endpoints require:
- Authentication: `Bearer <JWT_TOKEN>`
- Admin role: `is_admin = true`

## Order Management

### List Orders
```
GET /admin/orders?status={status}&page={page}&limit={limit}
```
**Query Parameters:**
- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### Update Order Status
```
PUT /admin/orders/:id/status
```
**Body:**
```json
{
  "status": "processing",
  "tracking_number": "TRACK123",
  "notes": "Order is being prepared"
}
```

### Get Order Statistics
```
GET /admin/orders/stats
```

### Bulk Update Order Status
```
POST /admin/orders/bulk-status
```
**Body:**
```json
{
  "order_ids": ["uuid1", "uuid2", "uuid3"],
  "status": "shipped"
}
```

### Assign Order to Staff
```
PUT /admin/orders/:id/assign
```
**Body:**
```json
{
  "staff_id": "staff-uuid"
}
```

### Update Order Priority
```
PUT /admin/orders/:id/priority
```
**Body:**
```json
{
  "priority": "urgent"
}
```
**Priority values:** `normal`, `high`, `urgent`

---

## Consultation Management

### List Consultations
```
GET /admin/consultations?status={status}&date_from={date}&date_to={date}&page={page}&limit={limit}
```

### Get Consultation Details
```
GET /admin/consultations/:id
```

### Update Consultation Status
```
PUT /admin/consultations/:id/status
```
**Body:**
```json
{
  "status": "completed",
  "notes": "Session completed successfully"
}
```
**Status values:** `booked`, `confirmed`, `completed`, `cancelled`

---

## Availability Calendar

### Get Availability Settings
```
GET /admin/availability
```

### Update Availability Slot
```
PUT /admin/availability/:id
```
**Body:**
```json
{
  "is_available": false
}
```

---

## Formula Recording

### Record Custom Formula
```
POST /admin/formulas
```
**Body:**
```json
{
  "consultation_id": "uuid",
  "customer_id": "uuid",
  "fragrance_name": "Midnight Rose Custom",
  "bottle_number": "MR-001",
  "ingredients": [
    {
      "name": "Bulgarian Rose",
      "percentage": 30,
      "notes": "Top note"
    },
    {
      "name": "Vanilla",
      "percentage": 20,
      "notes": "Base note"
    }
  ],
  "mixing_notes": "Mix at room temperature",
  "images": ["url1", "url2"]
}
```

### List Formulas
```
GET /admin/formulas?customer_id={id}&page={page}&limit={limit}
```

---

## Customer Database

### List Customers
```
GET /admin/customers?search={query}&page={page}&limit={limit}
```
**Query Parameters:**
- `search` (optional): Search by name or email

### Get Customer Details
```
GET /admin/customers/:id
```
**Response includes:**
- Customer information
- Order statistics (count, total spent)
- Recent orders (last 5)
- Consultations (last 5)

---

## Analytics

### Overview Dashboard
```
GET /admin/analytics/overview
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 1500000,
    "total_orders": 250,
    "total_consultations": 45,
    "total_customers": 180,
    "revenue_by_month": [
      { "month": "2026-01", "revenue": 150000 },
      ...
    ],
    "top_products": [
      {
        "id": "uuid",
        "name": "Oud Majesty",
        "sales_count": 50,
        "total_revenue": 325000
      },
      ...
    ],
    "consultation_trends": [
      { "date": "2026-01-22", "count": 3 },
      ...
    ]
  }
}
```

### Sales Analytics
```
GET /admin/analytics/sales?period={period}
```
**Query Parameters:**
- `period` (optional): `7days`, `30days`, `90days`, `1year` (default: `30days`)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30days",
    "sales_by_day": [...],
    "sales_by_status": [...],
    "sales_by_family": [...]
  }
}
```

---

## Export Functionality

### Export Orders (CSV)
```
GET /admin/export/orders?status={status}&date_from={date}&date_to={date}
```
**Response:** CSV file download

**CSV Columns:**
- Order Number
- Date
- Customer Name
- Customer Email
- Subtotal
- Discount
- Total
- Status
- Payment Status
- Tracking Number

### Export Customers (CSV)
```
GET /admin/export/customers
```
**Response:** CSV file download

**CSV Columns:**
- Email
- Name
- Phone
- Joined Date
- Order Count
- Total Spent

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `500` - Internal Server Error
