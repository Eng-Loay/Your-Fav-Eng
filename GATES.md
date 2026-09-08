# Gates: Vercel-only DemoLMS port

Scope: Host Eng-Loay/Your-Fav-Eng fully on Vercel (Services + Express export + Neon + Blob + Redis sockets) with a working production deploy and no VPS.

- [x] G1: No multer disk storage or runtime upload mkdir/writeFile in backend/src
  CHECK: rg -n "diskStorage|mkdirSync|writeFileSync|createWriteStream" backend/src --glob '*.ts'
  EXPECT: /^$/
  EVIDENCE: empty rg output 2026-09-08; multer.memoryStorage + persistUpload to Blob

- [x] G2: Prisma datasource is postgresql with DIRECT_URL pooling fields
  CHECK: rg -n "provider|url|directUrl" backend/prisma/schema.prisma | head -20
  EXPECT: postgresql
  EVIDENCE: provider postgresql; url DATABASE_URL; directUrl DIRECT_URL; runtime adds pgbouncer=true&connection_limit=1

- [x] G3: typescript.ignoreBuildErrors is not enabled
  CHECK: rg -n "ignoreBuildErrors" next.config.mjs
  EXPECT: /^$/
  EVIDENCE: no match in next.config.mjs; remote Next build ran "Running TypeScript" and succeeded

- [x] G4: Stripe webhook still mounts express.raw before json parser
  CHECK: rg -n "payments/webhook|express.raw|express.json" backend/src/index.ts
  EXPECT: express.raw
  EVIDENCE: index.ts line 61 express.raw then line 63 express.json; live POST /api/payments/webhook → 400 Missing stripe-signature header

- [x] G5: Production health endpoint returns ok
  CHECK: curl -sS https://your-fav-eng-lms.vercel.app/api/health
  EXPECT: "status":"ok"
  EVIDENCE: {"status":"ok","timestamp":"2026-09-08T19:12:12.763Z","db":"up"}

- [x] G6: Production deploy is READY on Vercel
  CHECK: vercel inspect https://your-fav-eng-lms.vercel.app
  EXPECT: Ready
  EVIDENCE: status Ready; aliased https://your-fav-eng-lms.vercel.app; services/backend + services/frontend

- [x] G7: WebSocket servers export via http.Server and Redis pub/sub (no listen on Vercel)
  CHECK: rg -n "export default server|VERCEL|publishChannel" backend/src/index.ts backend/src/realtime/*.ts
  EXPECT: export default server
  EVIDENCE: export default server; listen only if !env.isVercel; HTTP/1.1 upgrade to /api/messages/ws returns 101 Switching Protocols then Missing token

- [x] G8: Uploads persist via @vercel/blob put()
  CHECK: rg -n "@vercel/blob|persistUpload" backend/src --glob '*.ts'
  EXPECT: @vercel/blob
  EVIDENCE: backend/src/lib/blob.ts put(); middleware/upload.ts wrapBlob persistUpload
