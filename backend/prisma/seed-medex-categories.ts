import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Medex dental product categories...');

  // Update branding settings for Medex
  const brandingSettings = [
    { key: 'platformName', value: 'Medex', group: 'branding' },
    { key: 'logo', value: '/medex-logo.png', group: 'branding' },
    { key: 'headerColor', value: '#FFFFFF', group: 'branding' },
    { key: 'footerColor', value: '#1a1a2e', group: 'branding' },
    { key: 'contactPhone', value: '01287333308', group: 'branding' },
    { key: 'contactEmail', value: 'info@medex-med.com', group: 'branding' },
    { key: 'contactAddress', value: '157 Sudan Street, Second Floor - Giza - Egypt', group: 'branding' },
    { key: 'socialTwitter', value: 'https://x.com/MedexDental', group: 'branding' },
    { key: 'socialLinkedin', value: 'https://www.linkedin.com/in/medex-dental-solutions-7565a5243/', group: 'branding' },
    { key: 'socialYoutube', value: 'https://www.youtube.com/channel/UCov3k4Ay09M0cf5CQA3GvYQ', group: 'branding' },
    { key: 'socialFacebook', value: 'https://www.facebook.com/Medex.Dental.Solutions', group: 'branding' },
    { key: 'socialInstagram', value: 'https://www.instagram.com/medex.dental.solutions/', group: 'branding' },
  ];

  for (const s of brandingSettings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('Branding settings updated.');

  // Update general settings
  const generalSettings = [
    { key: 'platform_name', value: 'Medex', group: 'general' },
    { key: 'currency', value: 'EGP', group: 'general' },
    { key: 'support_email', value: 'info@medex-med.com', group: 'general' },
    { key: 'primary_color', value: '#EB2D3C', group: 'appearance' },
    { key: 'secondary_color', value: '#ffffff', group: 'appearance' },
  ];
  for (const s of generalSettings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // Enable store
  await prisma.platformSetting.upsert({
    where: { key: 'store_enabled' },
    update: { value: 'true' },
    create: { key: 'store_enabled', value: 'true', group: 'features' },
  });

  // Create product categories as store categories
  // Parent categories
  const parentCategories = [
    { name: 'B&B | 3P & EV Implant Lines', nameEn: 'B&B | 3P & EV Implant Lines', slug: 'bb-3p-ev-implant-lines', service: 'store', position: 0 },
    { name: 'Macros | Implants Systems - Turkish', nameEn: 'Macros | Implants Systems - Turkish', slug: 'macros-implants-systems-turkish', service: 'store', position: 1 },
    { name: 'Powerbone - Implants Systems - Turkish', nameEn: 'Powerbone - Implants Systems - Turkish', slug: 'powerbone-implants-systems-turkish', service: 'store', position: 2 },
    { name: 'MCTBIO Mplant - Korean', nameEn: 'MCTBIO Mplant - Korean', slug: 'mctbio-mplant-korean', service: 'store', position: 3 },
    { name: 'Biomaterials | Membrane & Bone', nameEn: 'Biomaterials | Membrane & Bone', slug: 'biomaterials-membrane-bone', service: 'store', position: 4 },
  ];

  const childrenMap: Record<string, { name: string; nameEn: string; slug: string; position: number }[]> = {
    'bb-3p-ev-implant-lines': [
      { name: 'B&B | Implants( Fixture )', nameEn: 'B&B | Implants (Fixture)', slug: 'bb-implants-fixture', position: 0 },
      { name: 'B&B | Titanium Abutments', nameEn: 'B&B | Titanium Abutments', slug: 'bb-titanium-abutments', position: 1 },
      { name: 'B&B | Healing Abutment', nameEn: 'B&B | Healing Abutment', slug: 'bb-healing-abutment', position: 2 },
      { name: 'B&B | Transfer & Analogs', nameEn: 'B&B | Transfer & Analogs', slug: 'bb-transfer-analogs', position: 3 },
      { name: 'B&B | Digital Dentistry', nameEn: 'B&B | Digital Dentistry', slug: 'bb-digital-dentistry', position: 4 },
      { name: 'B&B | Multi-Unit Solutions', nameEn: 'B&B | Multi-Unit Solutions', slug: 'bb-multi-unit-solutions', position: 5 },
      { name: 'B&B | Surgical Kits & Tools', nameEn: 'B&B | Surgical Kits & Tools', slug: 'bb-surgical-kits-tools', position: 6 },
      { name: 'B&B | Ball Abutment (SPHERICAL)', nameEn: 'B&B | Ball Abutment (SPHERICAL)', slug: 'bb-ball-abutment-spherical', position: 7 },
    ],
    'macros-implants-systems-turkish': [
      { name: 'Macros | Implants( Fixture )', nameEn: 'Macros | Implants (Fixture)', slug: 'macros-implants-fixture', position: 0 },
      { name: 'Macros | Straight & Angled Abutments', nameEn: 'Macros | Straight & Angled Abutments', slug: 'macros-straight-angled-abutments', position: 1 },
      { name: 'Macros | Healing Abutment', nameEn: 'Macros | Healing Abutment', slug: 'macros-healing-abutment', position: 2 },
      { name: 'Macros | Impression Copings & Analogs', nameEn: 'Macros | Impression Copings & Analogs', slug: 'macros-impression-copings-analogs', position: 3 },
      { name: 'Macros | Multi-Unit Solutions', nameEn: 'Macros | Multi-Unit Solutions', slug: 'macros-multi-unit-solutions', position: 4 },
      { name: 'Macros | Surgical Kits & Tools', nameEn: 'Macros | Surgical Kits & Tools', slug: 'macros-surgical-kits-tools', position: 5 },
      { name: 'Macros | Ball Abutment', nameEn: 'Macros | Ball Abutment', slug: 'macros-ball-abutment', position: 6 },
      { name: 'Macros | Castable Abutment', nameEn: 'Macros | Castable Abutment', slug: 'macros-castable-abutment', position: 7 },
      { name: 'Macros | Locator', nameEn: 'Macros | Locator', slug: 'macros-locator', position: 8 },
      { name: 'Macros | Milling Abutment', nameEn: 'Macros | Milling Abutment', slug: 'macros-milling-abutment', position: 9 },
      { name: 'MACROSS | Plastic Abutments', nameEn: 'MACROSS | Plastic Abutments', slug: 'macross-plastic-abutments', position: 10 },
      { name: 'MACROSS Ti-Base Abutment', nameEn: 'MACROSS Ti-Base Abutment', slug: 'macross-ti-base-abutment', position: 11 },
    ],
    'powerbone-implants-systems-turkish': [
      { name: 'Powerbone | Implants( Fixture )', nameEn: 'Powerbone | Implants (Fixture)', slug: 'powerbone-implants-fixture', position: 0 },
      { name: 'Powerbone | Straight & Angled Abutments', nameEn: 'Powerbone | Straight & Angled Abutments', slug: 'powerbone-straight-angled-abutments', position: 1 },
      { name: 'Powerbone | Healing Abutment', nameEn: 'Powerbone | Healing Abutment', slug: 'powerbone-healing-abutment', position: 2 },
      { name: 'Powerbone | Impression Coping', nameEn: 'Powerbone | Impression Coping', slug: 'powerbone-impression-coping', position: 3 },
      { name: 'Powerbone | Analogs', nameEn: 'Powerbone | Analogs', slug: 'powerbone-analogs', position: 4 },
      { name: 'Fortis | Digital Dentistry', nameEn: 'Fortis | Digital Dentistry', slug: 'fortis-digital-dentistry', position: 5 },
      { name: 'Powerbone | Multi-Unit Solutions', nameEn: 'Powerbone | Multi-Unit Solutions', slug: 'powerbone-multi-unit-solutions', position: 6 },
      { name: 'Powerbone | Surgical Kits & Tools', nameEn: 'Powerbone | Surgical Kits & Tools', slug: 'powerbone-surgical-kits-tools', position: 7 },
    ],
    'mctbio-mplant-korean': [
      { name: 'MCTBIO Mplant| ( Fixture )', nameEn: 'MCTBIO Mplant | Fixture', slug: 'mctbio-mplant-fixture', position: 0 },
      { name: 'MCTBIO Mplant | Titanium Abutments', nameEn: 'MCTBIO Mplant | Titanium Abutments', slug: 'mctbio-mplant-titanium-abutments', position: 1 },
      { name: 'MCTBIO Mplant | Healing Abutment', nameEn: 'MCTBIO Mplant | Healing Abutment', slug: 'mctbio-mplant-healing-abutment', position: 2 },
      { name: 'MCTBIO Mplant | Impression Coping', nameEn: 'MCTBIO Mplant | Impression Coping', slug: 'mctbio-mplant-impression-coping', position: 3 },
      { name: 'MCTBIO Mplant | Analogs', nameEn: 'MCTBIO Mplant | Analogs', slug: 'mctbio-mplant-analogs', position: 4 },
      { name: 'MCTBIO Mplant | Digital Dentistry', nameEn: 'MCTBIO Mplant | Digital Dentistry', slug: 'mctbio-mplant-digital-dentistry', position: 5 },
      { name: 'MCTBIO Mplant| Multi-Unit Solutions', nameEn: 'MCTBIO Mplant | Multi-Unit Solutions', slug: 'mctbio-mplant-multi-unit-solutions', position: 6 },
    ],
    'biomaterials-membrane-bone': [
      { name: 'Dora Allograft Made in Turkey', nameEn: 'Dora Allograft Made in Turkey', slug: 'dora-allograft-turkey', position: 0 },
      { name: 'B&B | Membrane & Bone - Italy', nameEn: 'B&B | Membrane & Bone - Italy', slug: 'bb-membrane-bone-italy', position: 1 },
      { name: 'Powerbone | Bone Graft |Biomaterials -Turkey', nameEn: 'Powerbone | Bone Graft | Biomaterials - Turkey', slug: 'powerbone-bone-graft-biomaterials-turkey', position: 2 },
    ],
  };

  // Delete existing store categories
  await prisma.category.deleteMany({ where: { service: 'store' } });

  for (const parent of parentCategories) {
    const createdParent = await prisma.category.create({
      data: {
        name: parent.name,
        nameEn: parent.nameEn,
        slug: parent.slug,
        service: parent.service,
        position: parent.position,
        status: 'active',
      },
    });

    const children = childrenMap[parent.slug] || [];
    for (const child of children) {
      await prisma.category.create({
        data: {
          name: child.name,
          nameEn: child.nameEn,
          slug: child.slug,
          service: 'store',
          position: child.position,
          status: 'active',
          parentId: createdParent.id,
        },
      });
    }
  }

  console.log('Medex dental product categories seeded successfully!');
  console.log(`Created ${parentCategories.length} parent categories with subcategories.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
