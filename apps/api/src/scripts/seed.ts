import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const products = [
  // FRESH FAMILY
  {
    name: 'Azure Morning',
    slug: 'azure-morning',
    description: 'A crisp, invigorating fragrance that captures the essence of dawn by the Mediterranean Sea.',
    emotion_story: 'Like the first breath of morning air on a coastal cliff, Azure Morning awakens your senses with its refreshing blend of citrus and aquatic notes. It embodies the freedom of endless horizons and the promise of new beginnings.',
    base_price: 45000,
    family: 'Fresh',
    scent_notes: {
      top: ['Bergamot', 'Sea Salt', 'Lemon Zest'],
      heart: ['Water Lily', 'Green Tea', 'Cucumber'],
      base: ['White Musk', 'Driftwood', 'Amber']
    },
    images: [
      '/assets/images/INITIATE.png',
      '/assets/images/ASCEND.png'
    ],
    stock_level: 50
  },
  {
    name: 'Citrus Soleil',
    slug: 'citrus-soleil',
    description: 'A vibrant celebration of sunshine captured in a bottle, perfect for the optimist in you.',
    emotion_story: 'Citrus Soleil is joy personified. Each spritz transports you to sun-drenched orange groves where laughter echoes and worries fade. It\'s the scent of pure happiness and endless summer days.',
    base_price: 42000,
    family: 'Fresh',
    scent_notes: {
      top: ['Mandarin', 'Grapefruit', 'Yuzu'],
      heart: ['Neroli', 'Orange Blossom', 'Petitgrain'],
      base: ['Vetiver', 'Cedarwood', 'Tonka Bean']
    },
    images: [
      'http://localhost:8181/assets/images/REVOLT.png',
      'http://localhost:8181/assets/images/LOVERS-SCRIPT.png'
    ],
    stock_level: 45
  },

  // FLORAL FAMILY
  {
    name: 'Midnight Rose',
    slug: 'midnight-rose',
    description: 'An elegant, mysterious floral that blooms in the twilight hours, for the romantic soul.',
    emotion_story: 'In the quiet hours when stars whisper secrets, Midnight Rose unfolds like a love letter written in petals. It speaks of stolen glances, moonlit walks, and the courage to follow your heart.',
    base_price: 52000,
    family: 'Floral',
    scent_notes: {
      top: ['Bulgarian Rose', 'Blackcurrant', 'Pink Pepper'],
      heart: ['Jasmine Sambac', 'Peony', 'Violet'],
      base: ['Patchouli', 'Vanilla', 'Benzoin']
    },
    images: [
      'http://localhost:8181/assets/images/ASCEND.png',
      'http://localhost:8181/assets/images/INITIATE.png'
    ],
    stock_level: 35
  },
  {
    name: 'Garden of Eden',
    slug: 'garden-of-eden',
    description: 'A lush, intoxicating bouquet that captures the essence of paradise on earth.',
    emotion_story: 'Step into a world where time stands still and beauty knows no bounds. Garden of Eden is the scent of pure bliss, a reminder that heaven can be found in the smallest moments of wonder.',
    base_price: 48000,
    family: 'Floral',
    scent_notes: {
      top: ['Magnolia', 'Freesia', 'Green Leaves'],
      heart: ['Tuberose', 'Lily of the Valley', 'Iris'],
      base: ['Sandalwood', 'Musk', 'Amber']
    },
    images: [
      'http://localhost:8181/assets/images/LOVERS-SCRIPT.png',
      'http://localhost:8181/assets/images/REVOLT.png'
    ],
    stock_level: 40
  },
  {
    name: 'Silk Petals',
    slug: 'silk-petals',
    description: 'Soft, delicate, and utterly feminine - a fragrance that whispers rather than shouts.',
    emotion_story: 'Like gentle fingers tracing poetry on skin, Silk Petals celebrates the power of subtlety. It\'s for those quiet moments of self-reflection and the strength found in gentleness.',
    base_price: 46000,
    family: 'Floral',
    scent_notes: {
      top: ['White Tea', 'Peach Blossom', 'Bergamot'],
      heart: ['Rose de Mai', 'Osmanthus', 'Heliotrope'],
      base: ['Cashmere Wood', 'Vanilla', 'White Musk']
    },
    images: [
      '/assets/images/INITIATE.png',
      '/assets/images/ASCEND.png'
    ],
    stock_level: 38
  },

  // WOODY FAMILY
  {
    name: 'Oud Majesty',
    slug: 'oud-majesty',
    description: 'A regal, sophisticated blend featuring the finest oud, for those who command presence.',
    emotion_story: 'Oud Majesty is confidence incarnate. It\'s the scent of boardroom victories and quiet leadership, of knowing your worth and never settling for less. Wear it when you need to remind yourself of your own power.',
    base_price: 65000,
    family: 'Woody',
    scent_notes: {
      top: ['Saffron', 'Cardamom', 'Lavender'],
      heart: ['Oud', 'Rose', 'Geranium'],
      base: ['Agarwood', 'Patchouli', 'Leather']
    },
    images: [
      'http://localhost:8181/assets/images/REVOLT.png',
      'http://localhost:8181/assets/images/LOVERS-SCRIPT.png'
    ],
    stock_level: 25
  },
  {
    name: 'Forest Haven',
    slug: 'forest-haven',
    description: 'An earthy, grounding fragrance that connects you to nature\'s ancient wisdom.',
    emotion_story: 'In the heart of the woods, where sunlight filters through ancient trees, Forest Haven offers sanctuary. It\'s the scent of finding peace in solitude and strength in stillness.',
    base_price: 50000,
    family: 'Woody',
    scent_notes: {
      top: ['Cypress', 'Juniper Berry', 'Pine Needles'],
      heart: ['Cedarwood', 'Vetiver', 'Oakmoss'],
      base: ['Sandalwood', 'Amber', 'Musk']
    },
    images: [
      'http://localhost:8181/assets/images/ASCEND.png',
      'http://localhost:8181/assets/images/INITIATE.png'
    ],
    stock_level: 42
  },

  // ORIENTAL FAMILY
  {
    name: 'Desert Dreams',
    slug: 'desert-dreams',
    description: 'A warm, opulent fragrance inspired by Arabian nights and ancient trade routes.',
    emotion_story: 'Desert Dreams is wanderlust bottled. It speaks of adventure under starlit skies, of stories told around campfires, and the thrill of discovering the unknown.',
    base_price: 58000,
    family: 'Oriental',
    scent_notes: {
      top: ['Dates', 'Cardamom', 'Cinnamon'],
      heart: ['Frankincense', 'Myrrh', 'Amber'],
      base: ['Oud', 'Vanilla', 'Tonka Bean']
    },
    images: [
      'http://localhost:8181/assets/images/LOVERS-SCRIPT.png',
      'http://localhost:8181/assets/images/REVOLT.png'
    ],
    stock_level: 30
  },
  {
    name: 'Golden Hour',
    slug: 'golden-hour',
    description: 'A luminous, sensual fragrance that captures the magic of sunset.',
    emotion_story: 'That fleeting moment when day kisses night - Golden Hour preserves it forever. It\'s the scent of gratitude, of counting blessings, and finding beauty in transitions.',
    base_price: 54000,
    family: 'Oriental',
    scent_notes: {
      top: ['Honey', 'Apricot', 'Bergamot'],
      heart: ['Ylang-Ylang', 'Jasmine', 'Orris'],
      base: ['Amber', 'Vanilla', 'Benzoin']
    },
    images: [
      '/assets/images/INITIATE.png',
      '/assets/images/ASCEND.png'
    ],
    stock_level: 36
  },

  // SPICY FAMILY
  {
    name: 'Ember & Silk',
    slug: 'ember-and-silk',
    description: 'A bold, captivating blend of spice and sensuality for the fearless.',
    emotion_story: 'Ember & Silk is passion unbound. It\'s the courage to be unapologetically yourself, the fire in your belly when chasing dreams, and the warmth of living authentically.',
    base_price: 56000,
    family: 'Spicy',
    scent_notes: {
      top: ['Pink Pepper', 'Ginger', 'Black Pepper'],
      heart: ['Cinnamon', 'Clove', 'Nutmeg'],
      base: ['Tobacco', 'Leather', 'Vanilla']
    },
    images: [
      'http://localhost:8181/assets/images/REVOLT.png',
      'http://localhost:8181/assets/images/LOVERS-SCRIPT.png'
    ],
    stock_level: 33
  },
  {
    name: 'Midnight Spice',
    slug: 'midnight-spice',
    description: 'An intoxicating evening fragrance with a mysterious, seductive edge.',
    emotion_story: 'When the world sleeps and inhibitions fade, Midnight Spice awakens. It\'s the scent of secret rendezvous, whispered confessions, and the thrill of the unexpected.',
    base_price: 53000,
    family: 'Spicy',
    scent_notes: {
      top: ['Star Anise', 'Cardamom', 'Rum'],
      heart: ['Cinnamon Bark', 'Black Rose', 'Saffron'],
      base: ['Oud', 'Patchouli', 'Incense']
    },
    images: [
      'http://localhost:8181/assets/images/ASCEND.png',
      'http://localhost:8181/assets/images/INITIATE.png'
    ],
    stock_level: 28
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing products
    console.log('Clearing existing products...');
    await client.query('DELETE FROM products');
    
    // Insert products
    console.log('Inserting products...\n');
    
    for (const product of products) {
      const id = uuidv4();
      
      await client.query(
        `INSERT INTO products (
          id, name, slug, description, emotion_story, base_price,
          scent_notes, family, images, stock_level, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          product.name,
          product.slug,
          product.description,
          product.emotion_story,
          product.base_price,
          JSON.stringify(product.scent_notes),
          product.family,
          JSON.stringify(product.images),
          product.stock_level,
          true
        ]
      );
      
      console.log(`✅ ${product.name} (${product.family}) - ₦${product.base_price.toLocaleString()}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${products.length} products!`);
    console.log('\nProducts by family:');
    console.log(`  Fresh: ${products.filter(p => p.family === 'Fresh').length}`);
    console.log(`  Floral: ${products.filter(p => p.family === 'Floral').length}`);
    console.log(`  Woody: ${products.filter(p => p.family === 'Woody').length}`);
    console.log(`  Oriental: ${products.filter(p => p.family === 'Oriental').length}`);
    console.log(`  Spicy: ${products.filter(p => p.family === 'Spicy').length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeder
seedDatabase()
  .then(() => {
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
