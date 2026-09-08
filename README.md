# DemoLMS

منصة تعليمية (LMS) هجينة — Udemy + Teachable + Marketplace + School LMS

## تشغيل المشروع

```bash
# تثبيت الاعتماديات (مرة واحدة)
npm install --legacy-peer-deps
cd backend && npm install && cd ..

# تشغيل الباك إند + الفرونت إند معاً
npm run dev:all
```

بعد التشغيل:
- **الفرونت إند:** http://localhost:3000
- **الباك إند API:** http://localhost:5001/api

## حسابات تجريبية (بعد db:seed)

| الدور | البريد | كلمة المرور |
|------|--------|-------------|
| Admin | admin@animka.com | admin123 |
| Instructor | instructor@animka.com | instructor123 |
| Teacher | teacher@animka.com | teacher123 |
| Student | student1@animka.com | student123 |
| Parent | parent@animka.com | parent123 |

## أوامر إضافية

```bash
# تشغيل منفصل
npm run dev:backend   # الباك إند فقط
npm run dev:frontend  # الفرونت إند فقط

# قاعدة البيانات
cd backend
npm run db:generate   # توليد Prisma client
npm run db:push       # تطبيق schema
npm run db:seed       # بيانات تجريبية
npm run db:studio     # Prisma Studio
```
