import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const imageMap: Record<string, string> = {
  'implant': 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&h=600&fit=crop',
  'abutment': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=600&fit=crop',
  'surgical': 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=600&fit=crop',
  'bone': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=600&fit=crop',
  'membrane': 'https://images.unsplash.com/photo-1583912267550-d974311a9a6e?w=600&h=600&fit=crop',
  'instrument': 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=600&fit=crop',
  'scaler': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=600&fit=crop',
  'light': 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&h=600&fit=crop',
  'cement': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=600&fit=crop',
  'composite': 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&h=600&fit=crop',
  'impression': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=600&fit=crop',
  'default': 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=600&fit=crop',
};

function getImageForProduct(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('implant') || t.includes('fixture')) return imageMap.implant;
  if (t.includes('abutment')) return imageMap.abutment;
  if (t.includes('surgical') || t.includes('kit') || t.includes('driver')) return imageMap.surgical;
  if (t.includes('bone') || t.includes('graft') || t.includes('substitute')) return imageMap.bone;
  if (t.includes('membrane') || t.includes('collagen')) return imageMap.membrane;
  if (t.includes('scaler') || t.includes('curette')) return imageMap.scaler;
  if (t.includes('light') || t.includes('curing') || t.includes('lamp')) return imageMap.light;
  if (t.includes('cement') || t.includes('adhesive')) return imageMap.cement;
  if (t.includes('composite') || t.includes('filling')) return imageMap.composite;
  if (t.includes('impression') || t.includes('tray') || t.includes('alginate')) return imageMap.impression;
  if (t.includes('instrument') || t.includes('forcep') || t.includes('elevator')) return imageMap.instrument;
  return imageMap.default;
}

async function main() {
  console.log('Updating product images...');

  const products = await prisma.product.findMany({ select: { id: true, title: true, thumbnail: true } });

  let updated = 0;
  for (const p of products) {
    const newImage = getImageForProduct(p.title);
    await prisma.product.update({
      where: { id: p.id },
      data: { thumbnail: newImage },
    });
    updated++;
    console.log(`Updated: ${p.title}`);
  }

  console.log(`Updated ${updated} product images.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
