import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  const categoriesData = [
    { name: 'Home Decor', slug: 'home-decor', description: 'Decorative items for home.' },
    { name: 'Jewelry', slug: 'jewelry', description: 'Handmade jewelry and accessories.' },
    { name: 'Stationery', slug: 'stationery', description: 'Artisanal stationery and paper goods.' }
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
      name: 'Handwoven Basket',
      slug: 'handwoven-basket',
      description: 'Natural fiber handwoven storage basket.',
      price: new Prisma.Decimal('29.99'),
      sku: 'BASKET-001',
      quantity: 25,
      categorySlug: 'home-decor',
      images: ['https://placehold.co/600x400?text=basket']
    },
    {
      name: 'Silver Beaded Necklace',
      slug: 'silver-beaded-necklace',
      description: 'Elegant silver and bead necklace.',
      price: new Prisma.Decimal('79.50'),
      sku: 'NECK-001',
      quantity: 10,
      categorySlug: 'jewelry',
      images: ['https://placehold.co/600x400?text=necklace']
    },
    {
      name: 'Handmade Sketchbook',
      slug: 'handmade-sketchbook',
      description: 'Recycled-paper sketchbook for artists.',
      price: new Prisma.Decimal('14.00'),
      sku: 'SKETCH-001',
      quantity: 50,
      categorySlug: 'stationery',
      images: ['https://placehold.co/600x400?text=sketchbook']
    }
  ]

  for (const it of itemsData) {
    const category = categories[it.categorySlug]
    if (!category) continue

    await prisma.item.upsert({
      where: { slug: it.slug },
      update: {
        name: it.name,
        description: it.description,
        price: it.price,
        sku: it.sku,
        quantity: it.quantity,
        category_id: category.id,
        images: it.images,
        updated_at: new Date()
      },
      create: {
        name: it.name,
        slug: it.slug,
        description: it.description,
        price: it.price,
        sku: it.sku,
        quantity: it.quantity,
        category_id: category.id,
        images: it.images
      }
    })
  }

  // Create an admin user for testing (Auth0 integration will use different auth0_id in production)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Seed Admin',
      email_verified: true,
      role: 'admin',
      updated_at: new Date()
    },
    create: {
      auth0_id: 'seed-admin',
      email: 'admin@example.com',
      email_verified: true,
      name: 'Seed Admin',
      role: 'admin',
      permissions: ['admin']
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
