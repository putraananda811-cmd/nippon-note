from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

import os, secrets, logging, bcrypt, jwt
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
app = FastAPI(title="NIPPON NOTE API")
api = APIRouter(prefix="/api")
JWT_ALGORITHM = "HS256"

def now(): return datetime.now(timezone.utc).isoformat()
def hash_password(value): return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()
def verify_password(value, hashed): return bcrypt.checkpw(value.encode(), hashed.encode())
def token(user):
    return jwt.encode({"sub": user["id"], "email": user["email"], "role": user["role"], "exp": datetime.now(timezone.utc)+timedelta(days=1)}, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

class Login(BaseModel):
    email: str
    password: str

class ContentInput(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)

async def current_admin(request: Request):
    raw = request.cookies.get("access_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not raw: raise HTTPException(401, "Silakan masuk sebagai admin")
    try:
        payload = jwt.decode(raw, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user or user.get("role") != "admin": raise HTTPException(403, "Akses admin diperlukan")
        return user
    except jwt.InvalidTokenError: raise HTTPException(401, "Sesi admin sudah berakhir")

async def seed_collection(name, items):
    if await db[name].count_documents({}) == 0: await db[name].insert_many(items)

SEED = {
 "articles": [
  {"id":"tokyo-konbini","slug":"tokyo-konbini","title":"Mengapa Konbini Jadi Ritme Hidup Jepang?","excerpt":"Di balik pintu otomatis yang selalu terbuka, ada cara Jepang merancang kenyamanan sehari-hari.","category":"CULTURE","author":"Nara Putri","date":"12 JUN 2026","reading":"6 min","image":"https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1400&q=85","featured":True,"content":"Konbini bukan sekadar toko. Ia adalah titik temu kecil antara teknologi, kebiasaan, dan rasa ingin tahu."},
  {"id":"city-pop-return","slug":"city-pop-return","title":"City pop kembali menemukan malamnya","excerpt":"Playlist yang terasa seperti lampu kota dari balik kaca kereta.","category":"MUSIC","author":"Raka Seno","date":"08 JUN 2026","reading":"4 min","image":"https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=85","featured":False,"content":"Ada sesuatu tentang bass yang santai dan chorus yang berkilau. City pop terus hidup dalam cara baru."},
  {"id":"kyoto-slow","slug":"kyoto-slow","title":"Kyoto, dipelankan untuk didengarkan","excerpt":"Rute kecil, kedai teh, dan pagi yang tidak perlu dikejar.","category":"TRAVEL","author":"Mika Ardi","date":"02 JUN 2026","reading":"7 min","image":"https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=85","featured":False,"content":"Perjalanan terbaik kadang dimulai ketika itinerary berhenti menjadi daftar."}
 ],
 "anime": [
  {"id":"orbit-echo","slug":"orbit-echo","title":"Orbit Echo","japanese_title":"オービット・エコー","poster":"https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=700&q=85","cover_image":"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=85","genre":"Sci-fi · Drama","studio":"Studio Hoshi","status":"AIRING","season":"SUMMER","episodes":"08 / 12","airing_schedule":"Setiap Jumat, 22:00 JST","synopsis":"Di kota yang mengorbit bumi, seorang kurir muda menemukan pesan yang seharusnya tidak pernah sampai."},
  {"id":"paper-moon","slug":"paper-moon","title":"Paper Moon Club","japanese_title":"ペーパームーンクラブ","poster":"https://images.unsplash.com/photo-1560972550-aba3456b5564?auto=format&fit=crop&w=700&q=85","cover_image":"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85","genre":"Slice of life · Music","studio":"Lumen Works","status":"COMPLETED","season":"SPRING","episodes":"12 / 12","airing_schedule":"Selesai tayang","synopsis":"Empat sahabat merawat klub radio sekolah dan menemukan suara mereka sendiri."},
  {"id":"neon-bento","slug":"neon-bento","title":"Neon Bento","japanese_title":"ネオン弁当","poster":"https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=700&q=85","cover_image":"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85","genre":"Comedy · Food","studio":"Mikan","status":"AIRING","season":"SUMMER","episodes":"05 / 12","airing_schedule":"Setiap Selasa, 24:30 JST","synopsis":"Kompetisi bekal tengah malam membuat sebuah distrik kecil jadi panggung terbesar."}
 ],
 "destinations": [
  {"id":"tokyo","slug":"tokyo","name":"TOKYO","region":"KANTO","image":"https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1400&q=85","description":"Di mana tradisi bertemu dengan hari esok.","food":"Sushi, curry, kissaten","culture":"Street style, design, subculture","travel_info":"Shibuya · Koenji · Kiyosumi"},
  {"id":"kyoto","slug":"kyoto","name":"KYOTO","region":"KANSAI","image":"https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=85","description":"Kota yang mengajarkan cara berjalan lebih pelan.","food":"Matcha, tofu, kaiseki","culture":"Machiya, temple gardens, craft","travel_info":"Gion · Arashiyama · Demachiyanagi"},
  {"id":"osaka","slug":"osaka","name":"OSAKA","region":"KANSAI","image":"https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1400&q=85","description":"Hangat, keras kepala, dan selalu punya satu gigitan lagi.","food":"Takoyaki, okonomiyaki, kushikatsu","culture":"Comedy, night markets, baseball","travel_info":"Dotonbori · Nakazakicho · Shinsekai"}
 ],
 "words": [{"id":"meccha","japanese":"めっちゃ","romaji":"MECCHA","meaning":"Banget / sangat","example":"めっちゃおいしい！","example_translation":"Enak banget!","audio_url":""}],
 "artists": [{"id":"mio-lune","slug":"mio-lune","name":"MIO LUNE","image":"https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=85","genre":"J-pop · City pop","bio":"Suara malam dari Yokohama. MIO LUNE menggabungkan synth vintage dengan lirik yang terasa personal — sebuah surat kabar musikal untuk kota yang tidak pernah benar-benar tidur.","latest_release":"Neon After Rain","album":"NIGHT DRIVE TAPES","spotify_url":"https://open.spotify.com/embed/playlist/37i9dQZEVXbKXQ4mDTEBXq","featured":True}]
}

@api.get("/")
async def root(): return {"message":"NIPPON NOTE API ready"}

@api.post("/auth/login")
async def login(body: Login, response: Response, request: Request):
    email = body.email.lower(); identifier = email; attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("locked_until", 0) > datetime.now(timezone.utc).timestamp(): raise HTTPException(429, "Terlalu banyak percobaan. Coba lagi dalam 15 menit.")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        failed = (attempt or {}).get("failed", 0) + 1; locked = datetime.now(timezone.utc).timestamp() + 900 if failed >= 5 else 0
        await db.login_attempts.update_one({"identifier": identifier},{"$set":{"failed":failed,"locked_until":locked}},upsert=True); raise HTTPException(401, "Email atau password salah")
    await db.login_attempts.delete_one({"identifier": identifier})
    access = token(user); response.set_cookie("access_token", access, httponly=True, samesite="lax", max_age=86400)
    return {"id":user["id"],"email":user["email"],"role":user["role"],"token":access}

@api.get("/auth/me")
async def me(user=Depends(current_admin)): return {k:v for k,v in user.items() if k != "password_hash"}

@api.post("/auth/logout")
async def logout(response: Response): response.delete_cookie("access_token"); return {"ok":True}

@api.get("/content/all")
async def all_content():
    return {name: await db[name].find({}, {"_id":0}).to_list(100) for name in SEED}

@api.get("/content/{collection}")
async def content(collection: str):
    if collection not in SEED: raise HTTPException(404, "Konten tidak ditemukan")
    return await db[collection].find({}, {"_id":0}).to_list(100)

@api.post("/admin/{collection}")
async def create(collection: str, body: ContentInput, user=Depends(current_admin)):
    if collection not in SEED: raise HTTPException(404, "Collection tidak ditemukan")
    item = dict(body.data); item.setdefault("id", secrets.token_urlsafe(8)); await db[collection].insert_one(item); item.pop("_id", None); return item

@api.put("/admin/{collection}/{item_id}")
async def update(collection: str, item_id: str, body: ContentInput, user=Depends(current_admin)):
    if collection not in SEED: raise HTTPException(404, "Collection tidak ditemukan")
    item = dict(body.data); item["id"] = item_id; await db[collection].replace_one({"id":item_id}, item, upsert=True); return item

@api.delete("/admin/{collection}/{item_id}")
async def delete(collection: str, item_id: str, user=Depends(current_admin)):
    await db[collection].delete_one({"id":item_id}); return {"ok":True}

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=[os.environ["FRONTEND_URL"], "http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    admin = await db.users.find_one({"email":os.environ["ADMIN_EMAIL"]})
    if not admin: await db.users.insert_one({"id":"admin-001","email":os.environ["ADMIN_EMAIL"],"password_hash":hash_password(os.environ["ADMIN_PASSWORD"]),"role":"admin","name":"Nippon Editor"})
    elif not verify_password(os.environ["ADMIN_PASSWORD"], admin["password_hash"]): await db.users.update_one({"email":os.environ["ADMIN_EMAIL"]},{"$set":{"password_hash":hash_password(os.environ["ADMIN_PASSWORD"])}})
    for name, items in SEED.items(): await seed_collection(name, items)
    # Restore featured artist record to canonical shape (fix any test-agent corruption)
    await db.artists.replace_one({"id":"mio-lune"}, {"id":"mio-lune","slug":"mio-lune","name":"MIO LUNE","image":"https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=85","genre":"J-pop · City pop","bio":"Suara malam dari Yokohama. MIO LUNE menggabungkan synth vintage dengan lirik yang terasa personal — sebuah surat kabar musikal untuk kota yang tidak pernah benar-benar tidur.","latest_release":"Neon After Rain","album":"NIGHT DRIVE TAPES","spotify_url":"https://open.spotify.com/embed/playlist/37i9dQZEVXbKXQ4mDTEBXq","featured":True}, upsert=True)
    # Remove leftover placeholder artist entries from previous test runs
    await db.artists.delete_many({"name":{"$exists":False},"id":{"$ne":"mio-lune"}})

@app.on_event("shutdown")
async def shutdown(): client.close()