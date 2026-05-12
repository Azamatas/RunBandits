from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
import backend.models  # ensure all models are registered before create_all
from backend.routers import auth, users, activities, feed, stats, kudos

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RunBanditsRun")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(activities.router)
app.include_router(kudos.router)
app.include_router(feed.router)
app.include_router(stats.router)


@app.get("/")
def health():
    return {"status": "ok"}
