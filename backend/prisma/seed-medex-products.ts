import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const sampleProducts = [
  // B&B Implant Systems
  {
    title: "B&B 3P Implant Fixture - Ø3.75 x 11.5mm",
    titleAr: "B&B 3P زرعة - قطر 3.75 × 11.5 مم",
    description: "Premium titanium implant fixture from B&B Dental Italy. Features a tapered design with micro-threads for optimal primary stability and osseointegration. Suitable for all bone types.",
    price: 1200,
    category: "implants",
    type: "PHYSICAL",
    stock: 50,
    status: "active",
  },
  {
    title: "B&B EV Implant Fixture - Ø4.0 x 10mm",
    titleAr: "B&B EV زرعة - قطر 4.0 × 10 مم",
    description: "B&B EV line implant with conical connection and platform switching. Excellent for aesthetic zone cases. Made in Italy with Grade 5 titanium.",
    price: 1350,
    category: "implants",
    type: "PHYSICAL",
    stock: 40,
    status: "active",
  },
  {
    title: "B&B Titanium Abutment - Straight",
    titleAr: "B&B دعامة تيتانيوم مستقيمة",
    description: "Precision-machined titanium abutment for B&B 3P and EV implant systems. Available in various gingival heights. Perfect marginal fit guaranteed.",
    price: 450,
    category: "abutments",
    type: "PHYSICAL",
    stock: 80,
    status: "active",
  },
  {
    title: "B&B Titanium Abutment - Angled 15°",
    titleAr: "B&B دعامة تيتانيوم بزاوية 15 درجة",
    description: "Angled titanium abutment for correcting implant angulation. Compatible with B&B 3P and EV systems. Multiple heights available.",
    price: 500,
    category: "abutments",
    type: "PHYSICAL",
    stock: 60,
    status: "active",
  },
  {
    title: "B&B Healing Abutment Pack (5 pcs)",
    titleAr: "B&B مجموعة غطاء الشفاء (5 قطع)",
    description: "Pack of 5 healing abutments for B&B implant systems. Various diameters and heights included. Promotes optimal soft tissue healing.",
    price: 350,
    category: "abutments",
    type: "PHYSICAL",
    stock: 100,
    status: "active",
  },

  // Macros Implant Systems
  {
    title: "Macros Implant Fixture - Ø3.5 x 13mm",
    titleAr: "ماكروس زرعة - قطر 3.5 × 13 مم",
    description: "High-quality dental implant from Macros Turkey. Double-thread design for fast insertion. SLA surface treatment for enhanced osseointegration.",
    price: 900,
    category: "implants",
    type: "PHYSICAL",
    stock: 70,
    status: "active",
  },
  {
    title: "Macros Implant Fixture - Ø4.5 x 10mm",
    titleAr: "ماكروس زرعة - قطر 4.5 × 10 مم",
    description: "Wide-body implant ideal for molar regions. Aggressive thread design for excellent primary stability even in compromised bone. Turkish quality.",
    price: 950,
    category: "implants",
    type: "PHYSICAL",
    stock: 55,
    status: "active",
  },
  {
    title: "Macros Surgical Kit - Complete",
    titleAr: "ماكروس طقم جراحي كامل",
    description: "Complete surgical instrument kit for Macros implant system. Includes drills, depth gauges, torque wrench, and all necessary tools in a sterilizable cassette.",
    price: 4500,
    category: "surgical-kits",
    type: "PHYSICAL",
    stock: 15,
    status: "active",
  },

  // Powerbone Products
  {
    title: "Powerbone Bone Graft - 0.5cc",
    titleAr: "باوربون عظم صناعي - 0.5 سم³",
    description: "Bovine-derived bone graft material from Powerbone Turkey. 0.25-1mm particle size, ideal for socket preservation and ridge augmentation. Biocompatible and osteoconductive.",
    price: 600,
    category: "biomaterials",
    type: "PHYSICAL",
    stock: 120,
    status: "active",
  },
  {
    title: "Powerbone Bone Graft - 1.0cc",
    titleAr: "باوربون عظم صناعي - 1.0 سم³",
    description: "Xenograft bone substitute material. Larger volume for sinus lift procedures and major bone augmentation. Slow resorption rate for long-term results.",
    price: 950,
    category: "biomaterials",
    type: "PHYSICAL",
    stock: 90,
    status: "active",
  },
  {
    title: "Powerbone Collagen Membrane - 20x30mm",
    titleAr: "باوربون غشاء كولاجين - 20×30 مم",
    description: "Resorbable collagen membrane for guided bone regeneration (GBR). Easy to handle, conforms to defect morphology. 4-6 month resorption time.",
    price: 450,
    category: "biomaterials",
    type: "PHYSICAL",
    stock: 80,
    status: "active",
  },
  {
    title: "Powerbone Collagen Membrane - 30x40mm",
    titleAr: "باوربون غشاء كولاجين - 30×40 مم",
    description: "Large-size resorbable collagen membrane for extensive GBR procedures. Double-layer structure for optimal barrier function and tissue integration.",
    price: 650,
    category: "biomaterials",
    type: "PHYSICAL",
    stock: 60,
    status: "active",
  },

  // MCTBIO Mplant
  {
    title: "MCTBIO Mplant Fixture - Ø3.5 x 11.5mm",
    titleAr: "MCTBIO Mplant زرعة - قطر 3.5 × 11.5 مم",
    description: "Korean-made premium implant with RBM surface treatment. Conical connection with built-in platform switching. Excellent for immediate loading protocols.",
    price: 1100,
    category: "implants",
    type: "PHYSICAL",
    stock: 45,
    status: "active",
  },
  {
    title: "MCTBIO Mplant Fixture - Ø4.0 x 13mm",
    titleAr: "MCTBIO Mplant زرعة - قطر 4.0 × 13 مم",
    description: "Long implant for cases requiring deep engagement. Progressive thread design reduces crestal bone stress. Ideal for posterior regions.",
    price: 1150,
    category: "implants",
    type: "PHYSICAL",
    stock: 35,
    status: "active",
  },
  {
    title: "MCTBIO Surgical Drill Kit",
    titleAr: "MCTBIO طقم مثاقب جراحية",
    description: "Complete drilling sequence kit for MCTBIO Mplant system. Color-coded drills, countersink, bone tap, and implant drivers. Premium Korean steel.",
    price: 3800,
    category: "surgical-kits",
    type: "PHYSICAL",
    stock: 20,
    status: "active",
  },

  // Dental Tools & Instruments
  {
    title: "Implant Torque Wrench - Universal",
    titleAr: "مفتاح عزم الزرعات - عالمي",
    description: "Precision torque wrench with adjustable settings from 10-45 Ncm. Compatible with most implant systems. Autoclavable stainless steel construction.",
    price: 1800,
    category: "instruments",
    type: "PHYSICAL",
    stock: 30,
    status: "active",
  },
  {
    title: "Bone Scraper - Double Ended",
    titleAr: "مكشطة عظام - مزدوجة الأطراف",
    description: "Precision bone scraper for harvesting autogenous bone chips. Two working ends with different curvatures. Ergonomic handle for comfortable grip.",
    price: 350,
    category: "instruments",
    type: "PHYSICAL",
    stock: 45,
    status: "active",
  },
  {
    title: "Sinus Lift Instrument Kit",
    titleAr: "طقم أدوات رفع الجيب الأنفي",
    description: "Complete sinus lift instrument set including osteotomes, curettes, and membrane elevators. Designed for lateral and crestal sinus augmentation approaches.",
    price: 2800,
    category: "surgical-kits",
    type: "PHYSICAL",
    stock: 18,
    status: "active",
  },
  {
    title: "PRF Centrifuge - Digital",
    titleAr: "جهاز طرد مركزي PRF - ديجيتال",
    description: "Digital centrifuge for Platelet-Rich Fibrin preparation. Preset programs for L-PRF and A-PRF protocols. Quiet operation, compact design suitable for any dental clinic.",
    price: 8500,
    category: "devices",
    type: "PHYSICAL",
    stock: 10,
    status: "active",
  },
  {
    title: "Dental Implant Motor - Surgical",
    titleAr: "موتور زرع أسنان جراحي",
    description: "Brushless surgical implant motor with 20:1 contra-angle. LED display, torque control 5-80 Ncm, speed range 15-40,000 RPM. Includes foot pedal and irrigation system.",
    price: 15000,
    category: "devices",
    type: "PHYSICAL",
    stock: 8,
    status: "active",
  },

  // Consumables
  {
    title: "Implant Cover Screw Pack (10 pcs)",
    titleAr: "مجموعة براغي الغطاء (10 قطع)",
    description: "Pack of 10 cover screws compatible with B&B and Macros implant systems. Precision-machined titanium. Sterilized and individually packed.",
    price: 200,
    category: "accessories",
    type: "PHYSICAL",
    stock: 200,
    status: "active",
  },
  {
    title: "Impression Coping - Open Tray (5 pcs)",
    titleAr: "طبعة مفتوحة (5 قطع)",
    description: "Open tray impression copings for accurate implant-level impressions. Compatible with B&B 3P system. Includes lab analogs.",
    price: 380,
    category: "accessories",
    type: "PHYSICAL",
    stock: 75,
    status: "active",
  },
  {
    title: "Temporary Abutment - PEEK (3 pcs)",
    titleAr: "دعامة مؤقتة - PEEK (3 قطع)",
    description: "PEEK temporary abutments for chairside provisional restorations. Easily customizable with composite. Compatible with multiple implant platforms.",
    price: 280,
    category: "abutments",
    type: "PHYSICAL",
    stock: 90,
    status: "active",
  },
  {
    title: "Suture Kit - Dental (Assorted)",
    titleAr: "طقم خياطة أسنان - متنوع",
    description: "Assorted dental suture kit containing resorbable and non-resorbable sutures. Various needle types and sizes for oral surgical procedures. 12 packets included.",
    price: 320,
    category: "consumables",
    type: "PHYSICAL",
    stock: 150,
    status: "active",
  },
]

async function main() {
  console.log("Seeding Medex sample dental products...")

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  })

  if (!admin) {
    console.error("No admin user found. Please create an admin user first.")
    process.exit(1)
  }

  const sellerId = admin.id

  let created = 0
  for (const prod of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { title: prod.title },
    })
    if (existing) {
      console.log(`  [skip] "${prod.title}" already exists`)
      continue
    }
    await prisma.product.create({
      data: {
        sellerId,
        title: prod.title,
        titleAr: prod.titleAr,
        description: prod.description,
        price: prod.price,
        currency: "EGP",
        type: prod.type,
        category: prod.category,
        stock: prod.stock,
        status: prod.status,
      },
    })
    created++
    console.log(`  [+] "${prod.title}"`)
  }

  console.log(`\nDone! Created ${created} new products (${sampleProducts.length - created} skipped).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
