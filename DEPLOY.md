# Railway-ге деплой (Postgres дерекқорымен)

Жоба **Railway + Postgres** арқылы деплой етіледі. Дерекқор бөлек басқарылатын
Postgres сервисінде сақталады — деплойлар арасында **ешқашан жоғалмайды**.

## 1-қадам. Postgres дерекқор қосу

1. Railway жобаңызды ашыңыз.
2. **+ Create** (немесе **New**) → **Database** → **Add PostgreSQL**.
3. Railway автоматты түрде Postgres сервисін құрады.

## 2-қадам. Қосымшаны Postgres-ке жалғау

1. Қосымша (Next.js) сервисін ашыңыз → **Variables**.
2. `DATABASE_URL` айнымалысын қосыңыз және мәні ретінде **Postgres сервисінің
   сілтемесін** беріңіз:
   - Ең сенімдісі — Railway айнымалы сілтемесі:
     `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
     (мұндағы `Postgres` — дерекқор сервисінің аты; басқаша болса, соны жазыңыз).
   - Немесе Postgres сервисі → **Variables/Connect** → `DATABASE_URL`-ды көшіріп,
     қосымша сервисіне қойыңыз.

## 3-қадам. Қалған айнымалылар

Қосымша сервисі → **Variables**:

| Name | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (2-қадам) |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | **мықты құпия сөз** (есте сақтаңыз) |
| `ADMIN_NAME` | `Жүйе әкімшісі` |

> Ескі `DATABASE_URL=file:/data/...` мен Volume енді қажет емес — оларды өшіруге болады.

## 4-қадам. Домен

Қосымша сервисі → **Settings** → **Networking** → **Generate Domain**.

## 5-қадам. Деплой

Айнымалылар қойылғанда Railway автоматты қайта деплой етеді (болмаса — **Deploy**).

Іске қосу кезінде автоматты орындалады (`npm run start:prod`):
1. `prisma db push` — Postgres-те кестелерді құрады/жаңартады,
2. `node prisma/seed.mjs` — admin аккаунтын жасайды (бір рет, идемпотентті),
3. `next start` — қосымшаны іске қосады.

Сілтемеге кіріп, **admin** / (сіз қойған `ADMIN_PASSWORD`) арқылы кіріңіз.

---

## Жаңарту (кейін код өзгергенде)

```
git add .
git commit -m "өзгеріс сипаттамасы"
git push
```

Railway push-ты байқап автоматты қайта деплой етеді. **Деректер сақталады**
(Postgres бөлек сервисте).

## Жергілікті даму (қаласаңыз)

Жергілікті `npm run dev` үшін `.env` ішіндегі `DATABASE_URL`-ды нақты Postgres-ке
бағыттаңыз (Railway Postgres-тің публикалық URL-ы немесе жергілікті Postgres).
Содан кейін: `npx prisma db push` → `npm run db:seed` → `npm run dev`.
