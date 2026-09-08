import prisma from '../src/config/database'

const branding: Array<[string, string]> = [
  ['contactPhone', '01273587216'],
  ['contactEmail', 'essamloay2@gmail.com'],
  ['contactAddress', 'الإسكندرية، العجمي'],
  ['socialLinkedin', 'https://www.linkedin.com/in/loay-essam/'],
  ['socialFacebook', 'https://www.facebook.com/lolo.3300/'],
  ['logo', '/le-logo.png'],
  ['platformName', 'Eng. Loay Essam'],
]

const general: Array<[string, string]> = [
  ['support_email', 'essamloay2@gmail.com'],
  ['timezone', 'Africa/Cairo'],
]

async function main() {
  for (const [key, value] of branding) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value, group: 'branding' },
      create: { key, value, group: 'branding' },
    })
  }
  for (const [key, value] of general) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: 'general' },
    })
  }
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: [...branding, ...general].map(([k]) => k) } },
  })
  for (const r of rows) console.log(r.key, '=', r.value)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
