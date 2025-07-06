const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config(); // make sure .env has MONGO_URI

const rawProducts = [
  {
    name: 'iPhone 15 Pro Max',
    price: 1199.99,
    imageUrl: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Latest iPhone with titanium design and advanced camera system',
    inStock: true,
    rating: 4.8,
    reviews: 2847,
  },
  {
    name: 'MacBook Pro 16"',
    price: 2499.99,
    imageUrl: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Powerful laptop with M3 Pro chip for professional workflows',
    inStock: true,
    rating: 4.9,
    reviews: 1523,
  },
  {
    name: 'Sony WH-1000XM5',
    price: 399.99,
    imageUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Industry-leading noise canceling wireless headphones',
    inStock: true,
    rating: 4.7,
    reviews: 3421,
  },
  {
    name: 'Samsung 65" QLED TV',
    price: 1299.99,
    imageUrl: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: '4K QLED Smart TV with quantum dot technology',
    inStock: true,
    rating: 4.6,
    reviews: 892,
  },

  {
    
    name: 'iPad Air 5th Gen',
    price: 599.99,
    imageUrl: 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Powerful tablet with M1 chip and stunning Liquid Retina display',
    inStock: true,
    rating: 4.8,
    reviews: 1876,
  },
  {
   
    name: 'Nintendo Switch OLED',
    price: 349.99,
    imageUrl: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Gaming console with vibrant OLED screen',
    inStock: true,
    rating: 4.7,
    reviews: 2134,
  },
  {
    
    name: 'Canon EOS R6 Mark II',
    price: 2499.99,
    imageUrl: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Professional mirrorless camera with 24.2MP sensor',
    inStock: false,
    rating: 4.9,
    reviews: 567,
  },
  {
  
    name: 'Apple Watch Series 9',
    price: 429.99,
    imageUrl: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Advanced smartwatch with health monitoring features',
    inStock: true,
    rating: 4.8,
    reviews: 3245,
  },
  {
   
    name: 'Dyson V15 Detect',
    price: 749.99,
    imageUrl: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'Cordless vacuum with laser dust detection',
    inStock: true,
    rating: 4.6,
    reviews: 1432,
  },
  {
    
    name: 'Tesla Model Y Charger',
    price: 599.99,
    imageUrl: 'https://images.pexels.com/photos/7078619/pexels-photo-7078619.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Electronics',
    description: 'High-speed home charging solution for Tesla vehicles',
    inStock: true,
    rating: 4.7,
    reviews: 823,
  },
  {
    
    name: 'Premium Cotton T-Shirt',
    price: 29.99,
    imageUrl: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Soft, breathable cotton t-shirt in classic fit',
    inStock: true,
    rating: 4.5,
    reviews: 1234,
  },
  {
   
    name: 'Slim Fit Denim Jeans',
    price: 89.99,
    imageUrl: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Modern slim fit jeans with stretch comfort',
    inStock: true,
    rating: 4.6,
    reviews: 2156,
  },
  {
    
    name: 'Wool Blend Suit Jacket',
    price: 299.99,
    imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Tailored wool blend blazer for professional occasions',
    inStock: true,
    rating: 4.8,
    reviews: 567,
  },
  {
    
    name: 'Casual Button-Down Shirt',
    price: 59.99,
    imageUrl: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Versatile cotton shirt perfect for casual or business casual',
    inStock: true,
    rating: 4.4,
    reviews: 1876,
  },
  {
    
    name: 'Athletic Performance Shorts',
    price: 39.99,
    imageUrl: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Moisture-wicking shorts for workouts and sports',
    inStock: true,
    rating: 4.7,
    reviews: 2341,
  },
  {
    
    name: 'Leather Dress Shoes',
    price: 179.99,
    imageUrl: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Genuine leather oxford shoes for formal occasions',
    inStock: true,
    rating: 4.6,
    reviews: 892,
  },
  {
    
    name: 'Hooded Sweatshirt',
    price: 69.99,
    imageUrl: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Comfortable fleece hoodie for casual wear',
    inStock: true,
    rating: 4.5,
    reviews: 1654,
  },
  {
    
    name: 'Winter Puffer Jacket',
    price: 149.99,
    imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Insulated jacket for cold weather protection',
    inStock: false,
    rating: 4.8,
    reviews: 743,
  },
  {
    
    name: 'Running Sneakers',
    price: 129.99,
    imageUrl: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Lightweight running shoes with advanced cushioning',
    inStock: true,
    rating: 4.7,
    reviews: 2987,
  },
  {
    
    name: 'Polo Shirt',
    price: 49.99,
    imageUrl: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Men',
    description: 'Classic polo shirt in premium pique cotton',
    inStock: true,
    rating: 4.4,
    reviews: 1432,
  },
  {
    
    name: 'Floral Summer Dress',
    price: 79.99,
    imageUrl: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Elegant floral print dress perfect for summer occasions',
    inStock: true,
    rating: 4.6,
    reviews: 1876,
  },
  {
   
    name: 'High-Waisted Skinny Jeans',
    price: 94.99,
    imageUrl: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Flattering high-waisted jeans with stretch fabric',
    inStock: true,
    rating: 4.7,
    reviews: 2543,
  },
  {
    
    name: 'Silk Blouse',
    price: 119.99,
    imageUrl: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Luxurious silk blouse for professional and evening wear',
    inStock: true,
    rating: 4.8,
    reviews: 987,
  },
  {
    
    name: 'Yoga Leggings',
    price: 54.99,
    imageUrl: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'High-performance leggings for yoga and fitness',
    inStock: true,
    rating: 4.9,
    reviews: 3421,
  },
  {
   
    name: 'Cashmere Sweater',
    price: 189.99,
    imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Soft cashmere sweater for luxury comfort',
    inStock: true,
    rating: 4.8,
    reviews: 1234,
  },
  {
    
    name: 'Designer Handbag',
    price: 249.99,
    imageUrl: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Elegant leather handbag with gold hardware',
    inStock: true,
    rating: 4.7,
    reviews: 1654,
  },
  {
    
    name: 'High Heel Pumps',
    price: 139.99,
    imageUrl: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Classic pointed-toe pumps for formal occasions',
    inStock: true,
    rating: 4.5,
    reviews: 876,
  },
  {
    
    name: 'Maxi Skirt',
    price: 69.99,
    imageUrl: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Flowing maxi skirt in breathable fabric',
    inStock: false,
    rating: 4.6,
    reviews: 1432,
  },
  {
    
    name: 'Sports Bra',
    price: 34.99,
    imageUrl: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Supportive sports bra for high-intensity workouts',
    inStock: true,
    rating: 4.7,
    reviews: 2876,
  },
  {
    
    name: 'Trench Coat',
    price: 199.99,
    imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Women',
    description: 'Classic trench coat for timeless style',
    inStock: true,
    rating: 4.8,
    reviews: 1098,
  },
  {
    name: 'Organic Avocados (6 pack)',
    price: 8.99,
    imageUrl: 'https://images.pexels.com/photos/557659/pexels-photo-557659.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Fresh organic avocados, perfect for healthy meals',
    inStock: true,
    rating: 4.5,
    reviews: 432,
  },
  {
    
    name: 'Wild Salmon Fillet',
    price: 24.99,
    imageUrl: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Premium wild-caught salmon, rich in omega-3',
    inStock: true,
    rating: 4.8,
    reviews: 876,
  },
  {
   
    name: 'Artisan Sourdough Bread',
    price: 6.99,
    imageUrl: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Freshly baked sourdough with crispy crust',
    inStock: true,
    rating: 4.7,
    reviews: 654,
  },
  {
    
    name: 'Organic Baby Spinach',
    price: 4.99,
    imageUrl: 'https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Fresh organic baby spinach leaves',
    inStock: true,
    rating: 4.6,
    reviews: 321,
  },
  {
    
    name: 'Free-Range Eggs (12 count)',
    price: 7.99,
    imageUrl: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Farm-fresh free-range eggs from happy hens',
    inStock: true,
    rating: 4.8,
    reviews: 1234,
  },
  {
    
    name: 'Greek Yogurt (32oz)',
    price: 5.99,
    imageUrl: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Creamy Greek yogurt packed with protein',
    inStock: true,
    rating: 4.5,
    reviews: 987,
  },
  {
   
    name: 'Organic Quinoa (2 lbs)',
    price: 12.99,
    imageUrl: 'https://images.pexels.com/photos/793785/pexels-photo-793785.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Nutritious organic quinoa, complete protein source',
    inStock: true,
    rating: 4.7,
    reviews: 543,
  },
  {
    
    name: 'Grass-Fed Ground Beef (1 lb)',
    price: 16.99,
    imageUrl: 'https://images.pexels.com/photos/3688/food-dinner-lunch-unhealthy.jpg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Premium grass-fed ground beef, 85% lean',
    inStock: false,
    rating: 4.9,
    reviews: 765,
  },
  {
    
    name: 'Organic Blueberries (1 pint)',
    price: 6.99,
    imageUrl: 'https://images.pexels.com/photos/357573/pexels-photo-357573.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Sweet organic blueberries, antioxidant-rich',
    inStock: true,
    rating: 4.6,
    reviews: 432,
  },
  {
   
    name: 'Almond Milk (64oz)',
    price: 4.49,
    imageUrl: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Groceries',
    description: 'Unsweetened almond milk, dairy-free alternative',
    inStock: true,
    rating: 4.4,
    reviews: 876,
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await Product.deleteMany(); // Clear old data
    const inserted = await Product.insertMany(rawProducts);
    console.log("✅ Products inserted:");
    console.table(inserted.map(p => ({ name: p.name, _id: p._id.toString() })));
    mongoose.disconnect();
  })
  .catch(err => console.error("❌ Error:", err));
