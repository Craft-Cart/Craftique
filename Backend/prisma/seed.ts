import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  const categoriesData = [
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Discover our curated collection of premium accessories designed to complement your style. From everyday essentials to statement pieces, find the perfect finishing touches for any outfit.',
      image_url: null
    },
    {
      name: 'Tech Gadgets',
      slug: 'tech-gadgets',
      description: 'Explore cutting-edge technology and innovative gadgets that enhance your daily life. From smart devices to premium audio equipment, discover the latest in tech excellence.',
      image_url: null
    },
    {
      name: 'Home & Office',
      slug: 'home-office',
      description: 'Transform your living and working spaces with our thoughtfully designed home and office products. Combining functionality with modern aesthetics.',
      image_url: null
    },
    {
      name: 'Eyewear',
      slug: 'eyewear',
      description: 'Protect your eyes in style with our premium sunglasses and eyewear collection. Featuring UV protection and contemporary designs.',
      parent_id: null
    },
    {
      name: 'Watches',
      slug: 'watches',
      description: 'Elegant timepieces that combine precision engineering with sophisticated design. Perfect for any occasion.',
      parent_id: null
    },
    {
      name: 'Audio',
      slug: 'audio',
      description: 'Experience superior sound quality with our premium headphones and audio equipment. Designed for audiophiles and casual listeners alike.',
      parent_id: null
    },
    {
      name: 'Computer Accessories',
      slug: 'computer-accessories',
      description: 'Enhance your computing experience with our premium accessories. Ergonomic designs meet cutting-edge functionality.',
      parent_id: null
    },
    {
      name: 'Travel Essentials',
      slug: 'travel-essentials',
      description: 'Travel in style and convenience with our carefully curated travel accessories. From bags to organizers, everything you need for your journey.',
      parent_id: null
    }
  ]

  const categories: Record<string, any> = {}
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { ...c, updated_at: new Date() },
      create: c
    })
    categories[c.slug] = cat
  }

  const itemsData = [
    {
      name: 'Premium Aviator Sunglasses',
      slug: 'premium-aviator-sunglasses',
      description: 'Crafted with high-quality metal frames and UV400 protection lenses, these aviator sunglasses offer timeless style and superior eye protection. The polarized lenses reduce glare and provide crystal-clear vision in bright conditions. Perfect for driving, outdoor activities, or making a fashion statement.',
      price: new Prisma.Decimal('149.99'),
      compare_at_price: new Prisma.Decimal('199.99'),
      cost: new Prisma.Decimal('75.00'),
      sku: 'SUN-AVI-001',
      barcode: '8901234567890',
      quantity: 45,
      categorySlug: 'eyewear',
      images: ['/aviator-sunglasses.png'],
      is_featured: true,
      weight: new Prisma.Decimal('0.05'),
      dimensions: { width: 14.5, height: 5.2, depth: 14.5, unit: 'cm' },
      metadata: { brand: 'LuxView', material: 'Metal, Glass', warranty: '1 year' }
    },
    {
      name: 'Smart Watch Series X',
      slug: 'smart-watch-series-x',
      description: 'The ultimate smartwatch featuring a stunning AMOLED display, advanced health monitoring, and seamless smartphone integration. Track your fitness goals, receive notifications, and enjoy up to 7 days of battery life. Water-resistant up to 50 meters, perfect for swimming and intense workouts.',
      price: new Prisma.Decimal('349.99'),
      compare_at_price: new Prisma.Decimal('399.99'),
      cost: new Prisma.Decimal('180.00'),
      sku: 'WATCH-SMX-001',
      barcode: '8901234567891',
      quantity: 30,
      categorySlug: 'watches',
      images: ['/modern-smart-watch-black.jpg'],
      is_featured: true,
      weight: new Prisma.Decimal('0.15'),
      dimensions: { width: 4.4, height: 3.8, depth: 1.1, unit: 'cm' },
      metadata: { brand: 'TechFit', material: 'Aluminum, Glass', warranty: '2 years', features: ['AMOLED Display', 'Health Tracking', 'GPS', 'Water Resistant'] }
    },
    {
      name: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      description: 'Immerse yourself in high-fidelity audio with our premium wireless headphones. Featuring active noise cancellation, 40-hour battery life, and memory foam ear cushions for all-day comfort. The foldable design makes them perfect for travel.',
      price: new Prisma.Decimal('279.99'),
      compare_at_price: new Prisma.Decimal('329.99'),
      cost: new Prisma.Decimal('140.00'),
      sku: 'AUDIO-WHP-001',
      barcode: '8901234567892',
      quantity: 35,
      categorySlug: 'audio',
      images: ['/premium-black-wireless-headphones.jpg'],
      is_featured: true,
      weight: new Prisma.Decimal('0.25'),
      dimensions: { width: 18.5, height: 20.0, depth: 8.5, unit: 'cm' },
      metadata: { brand: 'SoundPro', material: 'Plastic, Metal, Foam', warranty: '2 years', features: ['Active Noise Cancellation', '40h Battery', 'Bluetooth 5.3', 'Foldable'] }
    },
    {
      name: 'RGB Mechanical Gaming Keyboard',
      slug: 'rgb-mechanical-keyboard',
      description: 'Elevate your gaming experience with this premium mechanical keyboard. Featuring customizable RGB backlighting, tactile blue switches, and a durable aluminum frame. The N-key rollover ensures every keystroke is registered, perfect for competitive gaming.',
      price: new Prisma.Decimal('129.99'),
      compare_at_price: new Prisma.Decimal('159.99'),
      cost: new Prisma.Decimal('65.00'),
      sku: 'KEY-MECH-001',
      barcode: '8901234567893',
      quantity: 25,
      categorySlug: 'computer-accessories',
      images: ['/mechanical-keyboard-rgb.jpg'],
      is_featured: true,
      weight: new Prisma.Decimal('0.95'),
      dimensions: { width: 44.0, height: 4.0, depth: 13.5, unit: 'cm' },
      metadata: { brand: 'KeyMaster', material: 'Aluminum, ABS', warranty: '1 year', features: ['RGB Backlighting', 'Blue Switches', 'N-Key Rollover', 'Anti-Ghosting'] }
    },
    {
      name: 'Ergonomic Wireless Mouse',
      slug: 'ergonomic-wireless-mouse',
      description: 'Designed for comfort during long work sessions, this ergonomic wireless mouse features a contoured shape that reduces hand strain. With adjustable DPI settings up to 1600, programmable buttons, and a rechargeable battery that lasts up to 30 days.',
      price: new Prisma.Decimal('49.99'),
      compare_at_price: new Prisma.Decimal('69.99'),
      cost: new Prisma.Decimal('25.00'),
      sku: 'MOUSE-ERG-001',
      barcode: '8901234567894',
      quantity: 50,
      categorySlug: 'computer-accessories',
      images: ['/wireless-computer-mouse.jpg'],
      is_featured: false,
      weight: new Prisma.Decimal('0.12'),
      dimensions: { width: 7.5, height: 4.5, depth: 12.0, unit: 'cm' },
      metadata: { brand: 'ClickTech', material: 'Plastic, Rubber', warranty: '1 year', features: ['Ergonomic Design', '1600 DPI', '30-Day Battery', 'Programmable Buttons'] }
    },
    {
      name: 'Minimalist Black Backpack',
      slug: 'minimalist-black-backpack',
      description: 'A sleek and functional backpack designed for the modern professional. Features a padded laptop compartment (up to 15"), multiple organizer pockets, water-resistant material, and comfortable padded straps. Perfect for daily commuting or weekend getaways.',
      price: new Prisma.Decimal('89.99'),
      compare_at_price: new Prisma.Decimal('119.99'),
      cost: new Prisma.Decimal('45.00'),
      sku: 'BAG-MIN-001',
      barcode: '8901234567895',
      quantity: 40,
      categorySlug: 'travel-essentials',
      images: ['/minimalist-black-backpack.jpg'],
      is_featured: false,
      weight: new Prisma.Decimal('0.65'),
      dimensions: { width: 30.0, height: 45.0, depth: 15.0, unit: 'cm' },
      metadata: { brand: 'UrbanPack', material: 'Nylon, Polyester', warranty: '1 year', features: ['15" Laptop Compartment', 'Water Resistant', 'Multiple Pockets', 'Padded Straps'] }
    },
    {
      name: 'Genuine Leather Wallet',
      slug: 'genuine-leather-wallet',
      description: 'Handcrafted from premium full-grain leather, this classic bifold wallet develops a beautiful patina over time. Features multiple card slots, a clear ID window, bill compartments, and RFID blocking technology to protect your cards from electronic theft.',
      price: new Prisma.Decimal('69.99'),
      compare_at_price: new Prisma.Decimal('89.99'),
      cost: new Prisma.Decimal('35.00'),
      sku: 'WALL-LEA-001',
      barcode: '8901234567896',
      quantity: 60,
      categorySlug: 'travel-essentials',
      images: ['/brown-leather-wallet.png'],
      is_featured: false,
      weight: new Prisma.Decimal('0.08'),
      dimensions: { width: 9.5, height: 11.5, depth: 1.5, unit: 'cm' },
      metadata: { brand: 'LeatherCraft', material: 'Full-Grain Leather', warranty: 'Lifetime', features: ['RFID Blocking', 'Multiple Card Slots', 'ID Window', 'Bifold Design'] }
    },
    {
      name: 'Portable Battery Charger 20000mAh',
      slug: 'portable-battery-charger',
      description: 'Never run out of power with this high-capacity 20000mAh portable charger. Features dual USB-A and USB-C ports for simultaneous charging, fast charging support up to 18W, and a digital display showing remaining power. Compact and lightweight design perfect for travel.',
      price: new Prisma.Decimal('59.99'),
      compare_at_price: new Prisma.Decimal('79.99'),
      cost: new Prisma.Decimal('30.00'),
      sku: 'PWR-BAT-001',
      barcode: '8901234567897',
      quantity: 55,
      categorySlug: 'tech-gadgets',
      images: ['/portable-battery-charger.jpg'],
      is_featured: false,
      weight: new Prisma.Decimal('0.42'),
      dimensions: { width: 7.0, height: 14.5, depth: 2.8, unit: 'cm' },
      metadata: { brand: 'PowerMax', material: 'Plastic, Lithium', warranty: '1 year', features: ['20000mAh', '18W Fast Charging', 'Dual USB', 'LED Display'] }
    }
  ]

  const items: Record<string, any> = {}
  for (const it of itemsData) {
    const category = categories[it.categorySlug]
    if (!category) continue

    const item = await prisma.item.upsert({
      where: { slug: it.slug },
      update: {
        name: it.name,
        description: it.description,
        price: it.price,
        compare_at_price: it.compare_at_price,
        cost: it.cost,
        sku: it.sku,
        barcode: it.barcode,
        quantity: it.quantity,
        category_id: category.id,
        images: it.images,
        is_featured: it.is_featured,
        weight: it.weight,
        dimensions: it.dimensions,
        metadata: it.metadata,
        updated_at: new Date()
      },
      create: {
        name: it.name,
        slug: it.slug,
        description: it.description,
        price: it.price,
        compare_at_price: it.compare_at_price,
        cost: it.cost,
        sku: it.sku,
        barcode: it.barcode,
        quantity: it.quantity,
        category_id: category.id,
        images: it.images,
        is_featured: it.is_featured,
        weight: it.weight,
        dimensions: it.dimensions,
        metadata: it.metadata
      }
    })
    items[it.slug] = item
  }

  const usersData = [
    {
      auth0_id: 'seed-admin',
      email: 'admin@craftique.com',
      email_verified: true,
      name: 'Admin User',
      role: 'admin',
      permissions: ['admin', 'manage_users', 'manage_orders', 'manage_products']
    },
    {
      auth0_id: 'seed-moderator',
      email: 'moderator@craftique.com',
      email_verified: true,
      name: 'Moderator User',
      role: 'moderator',
      permissions: ['moderate_reviews', 'manage_orders']
    },
    {
      auth0_id: 'seed-customer1',
      email: 'customer1@example.com',
      email_verified: true,
      name: 'John Doe',
      role: 'customer',
      permissions: [],
      phone: '+201234567890',
      address: {
        street: '123 Main St',
        city: 'Cairo',
        country: 'Egypt',
        postal_code: '11511'
      }
    },
    {
      auth0_id: 'seed-customer2',
      email: 'customer2@example.com',
      email_verified: true,
      name: 'Sarah Smith',
      role: 'customer',
      permissions: [],
      phone: '+201234567891',
      address: {
        street: '456 Oak Ave',
        city: 'Alexandria',
        country: 'Egypt',
        postal_code: '21511'
      }
    },
    {
      auth0_id: 'seed-customer3',
      email: 'customer3@example.com',
      email_verified: false,
      name: 'Ahmed Hassan',
      role: 'customer',
      permissions: [],
      phone: '+201234567892'
    }
  ]

  const users: Record<string, any> = {}
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        email_verified: u.email_verified,
        role: u.role,
        permissions: u.permissions,
        phone: u.phone,
        address: u.address,
        updated_at: new Date()
      },
      create: u
    })
    users[u.email] = user
  }

  const reviewsData = [
    {
      itemSlug: 'premium-aviator-sunglasses',
      userEmail: 'customer1@example.com',
      rating: 5,
      title: 'Excellent quality!',
      comment: 'These sunglasses exceeded my expectations. The build quality is fantastic and they look great. Highly recommend!',
      verified_purchase: true,
      is_approved: true
    },
    {
      itemSlug: 'smart-watch-series-x',
      userEmail: 'customer2@example.com',
      rating: 4,
      title: 'Great smartwatch with minor battery issue',
      comment: 'Love the features and design. Battery life is good but not quite 7 days as advertised. Still a great purchase.',
      verified_purchase: true,
      is_approved: true
    },
    {
      itemSlug: 'rgb-mechanical-keyboard',
      userEmail: 'customer1@example.com',
      rating: 5,
      title: 'Best keyboard for gaming',
      comment: 'The tactile feel of the blue switches is amazing. RGB lighting is customizable and looks fantastic in my setup.',
      verified_purchase: false,
      is_approved: true
    },
    {
      itemSlug: 'premium-wireless-headphones',
      userEmail: 'customer3@example.com',
      rating: 5,
      title: 'Crystal clear sound',
      comment: 'The noise cancellation is incredibly effective. Perfect for my daily commute. Comfortable to wear for hours.',
      verified_purchase: true,
      is_approved: true
    },
    {
      itemSlug: 'minimalist-black-backpack',
      userEmail: 'customer2@example.com',
      rating: 4,
      title: 'Sleek and functional',
      comment: 'Great backpack for work. Fits my laptop perfectly with room to spare. Only wish it had more small pockets.',
      verified_purchase: true,
      is_approved: true
    }
  ]

  for (const r of reviewsData) {
    const item = items[r.itemSlug]
    const user = users[r.userEmail]
    if (!item || !user) continue

    await prisma.review.upsert({
      where: {
        id: `${item.id}-${user.id}`
      },
      update: {
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        verified_purchase: r.verified_purchase,
        is_approved: r.is_approved,
        updated_at: new Date()
      },
      create: {
        item_id: item.id,
        user_id: user.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        verified_purchase: r.verified_purchase,
        is_approved: r.is_approved
      }
    })
  }

  const ordersData = [
    {
      userEmail: 'customer1@example.com',
      order_number: 'ORD-2024-001',
      status: 'delivered',
      items: [
        {
          item_id: items['premium-aviator-sunglasses'].id,
          name: 'Premium Aviator Sunglasses',
          quantity: 1,
          price: items['premium-aviator-sunglasses'].price
        },
        {
          item_id: items['genuine-leather-wallet'].id,
          name: 'Genuine Leather Wallet',
          quantity: 2,
          price: items['genuine-leather-wallet'].price
        }
      ],
      subtotal: new Prisma.Decimal('289.97'),
      tax: new Prisma.Decimal('28.99'),
      shipping: new Prisma.Decimal('25.00'),
      discount: new Prisma.Decimal('0'),
      total: new Prisma.Decimal('343.96'),
      shipping_address: {
        street: '123 Main St',
        city: 'Cairo',
        country: 'Egypt',
        postal_code: '11511',
        recipient_name: 'John Doe',
        phone: '+201234567890'
      },
      payment_method: 'card',
      payment_status: 'paid'
    },
    {
      userEmail: 'customer2@example.com',
      order_number: 'ORD-2024-002',
      status: 'shipped',
      items: [
        {
          item_id: items['smart-watch-series-x'].id,
          name: 'Smart Watch Series X',
          quantity: 1,
          price: items['smart-watch-series-x'].price
        }
      ],
      subtotal: new Prisma.Decimal('349.99'),
      tax: new Prisma.Decimal('34.99'),
      shipping: new Prisma.Decimal('25.00'),
      discount: new Prisma.Decimal('35.00'),
      total: new Prisma.Decimal('374.98'),
      shipping_address: {
        street: '456 Oak Ave',
        city: 'Alexandria',
        country: 'Egypt',
        postal_code: '21511',
        recipient_name: 'Sarah Smith',
        phone: '+201234567891'
      },
      payment_method: 'card',
      payment_status: 'paid'
    },
    {
      userEmail: 'customer3@example.com',
      order_number: 'ORD-2024-003',
      status: 'processing',
      items: [
        {
          item_id: items['rgb-mechanical-keyboard'].id,
          name: 'RGB Mechanical Gaming Keyboard',
          quantity: 1,
          price: items['rgb-mechanical-keyboard'].price
        },
        {
          item_id: items['ergonomic-wireless-mouse'].id,
          name: 'Ergonomic Wireless Mouse',
          quantity: 1,
          price: items['ergonomic-wireless-mouse'].price
        }
      ],
      subtotal: new Prisma.Decimal('179.98'),
      tax: new Prisma.Decimal('17.99'),
      shipping: new Prisma.Decimal('25.00'),
      discount: new Prisma.Decimal('0'),
      total: new Prisma.Decimal('222.97'),
      shipping_address: {
        street: '789 Elm St',
        city: 'Giza',
        country: 'Egypt',
        postal_code: '12511',
        recipient_name: 'Ahmed Hassan',
        phone: '+201234567892'
      },
      payment_method: 'card',
      payment_status: 'paid'
    }
  ]

  for (const o of ordersData) {
    const user = users[o.userEmail]
    if (!user) continue

    await prisma.order.upsert({
      where: { order_number: o.order_number },
      update: {
        status: o.status,
        items: o.items,
        subtotal: o.subtotal,
        tax: o.tax,
        shipping: o.shipping,
        discount: o.discount,
        total: o.total,
        shipping_address: o.shipping_address,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        updated_at: new Date()
      },
      create: {
        order_number: o.order_number,
        user_id: user.id,
        status: o.status,
        items: o.items,
        subtotal: o.subtotal,
        tax: o.tax,
        shipping: o.shipping,
        discount: o.discount,
        total: o.total,
        shipping_address: o.shipping_address,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        currency: 'EGP'
      }
    })
  }

  const notificationsData = [
    {
      userEmail: 'customer1@example.com',
      title: 'Order Delivered',
      message: 'Your order ORD-2024-001 has been delivered successfully. Enjoy your purchase!',
      type: 'order'
    },
    {
      userEmail: 'customer2@example.com',
      title: 'Order Shipped',
      message: 'Your order ORD-2024-002 has been shipped. Track your package for updates.',
      type: 'order'
    },
    {
      userEmail: 'customer2@example.com',
      title: 'Special Offer!',
      message: 'Get 20% off on all tech gadgets this weekend. Don\'t miss out!',
      type: 'promotion'
    },
    {
      userEmail: 'customer3@example.com',
      title: 'Order Processing',
      message: 'Your order ORD-2024-003 is being prepared for shipment.',
      type: 'order'
    }
  ]

  for (const n of notificationsData) {
    const user = users[n.userEmail]
    if (!user) continue

    await prisma.notification.create({
      data: {
        user_id: user.id,
        title: n.title,
        message: n.message,
        type: n.type
      }
    })
  }

  console.log('Seeding finished.')
  console.log(`Created ${Object.keys(categories).length} categories`)
  console.log(`Created ${Object.keys(items).length} items`)
  console.log(`Created ${Object.keys(users).length} users`)
  console.log(`Created ${reviewsData.length} reviews`)
  console.log(`Created ${ordersData.length} orders`)
  console.log(`Created ${notificationsData.length} notifications`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
