import bcrypt from 'bcryptjs'
import prisma from '../src/config/database'

const EMAIL = 'loay@eng.com'
const PASSWORD = 'Loay#1234l'
const NAME = 'Eng. Loay Essam'

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 12)

  const existing = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
  })

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: EMAIL,
          name: NAME,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          password: hashed,
        },
      })
    : await prisma.user.create({
        data: {
          email: EMAIL,
          name: NAME,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          password: hashed,
        },
      })

  console.log('admin ready', user.email, user.role, user.status, user.id)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
