# MongoDB Atlas Connection Guide

## Step 1: Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in and navigate to your cluster
3. Click **"Connect"** button
4. Choose **"Drivers"** (for Node.js)
5. Select your Node.js version and driver version
6. Copy the connection string that looks like:
   ```
   mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
   ```

## Step 2: Update `.env.local` File

Replace the placeholder in `.env.local` with your actual MongoDB Atlas connection string:

```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database-name?retryWrites=true&w=majority
NODE_ENV=development
```

**Important:**
- Replace `your-username` with your MongoDB Atlas username
- Replace `your-password` with your MongoDB Atlas password
- Replace `your-cluster` with your cluster name
- Replace `your-database-name` with your database name

## Step 3: Install Required Packages

Run the following command to ensure all dependencies are installed:

```bash
npm install
```

The project already has the required packages:
- `mongoose` - MongoDB object modeling
- `mongodb` - MongoDB driver
- `next` - Next.js framework

## Step 4: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/bills-entry`

3. Fill in the form and click "Save to Database"

4. You should see a success message if the connection works

## Step 5: Verify Data in MongoDB Atlas

1. Go to MongoDB Atlas
2. Find your cluster and click **"Browse Collections"**
3. Navigate to your database → **billentries** collection
4. You should see your submitted bills

## API Endpoints

### Submit a Bill (POST)
**Endpoint:** `/api/bills`

**Request Body:**
```json
{
  "billNumber": "BILL-001",
  "billDate": "2024-04-06",
  "partyName": "Company A",
  "materialList": [
    {
      "material": "Item 1",
      "qty": 5,
      "rate": 100,
      "amount": 500
    }
  ],
  "personName": "John Doe"
}
```

### Get All Bills (GET)
**Endpoint:** `/api/bills`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "billNumber": "BILL-001",
      "totalAmount": 500,
      "createdAt": "2024-04-06T..."
    }
  ]
}
```

## Troubleshooting

### Connection String Issues
- Ensure your IP is whitelisted in MongoDB Atlas (Security → Network Access)
- Check that the username/password are correct
- Verify database name exists

### Port Already in Use
```bash
npm run dev -- -p 3001
```

### Clear Cache
```bash
rm -rf .next
npm run dev
```

## Environment Variables

The app uses the following environment variables:
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - development or production

These should be in `.env.local` file (for local development).

For Vercel deployment, add these to your environment variables in the Vercel dashboard.
