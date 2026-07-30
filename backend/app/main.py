from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401  (ensures models are registered on Base.metadata)
from app.routers import auth, tasks, documents, search, analytics

# Creates tables that don't exist yet. Run seed.py separately to bootstrap
# roles + a default admin user.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Task & Knowledge Management System",
    description="Admin uploads documents & assigns tasks; users semantically search "
                "documents (FAISS + local embeddings) and complete assigned tasks.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(documents.router)
app.include_router(search.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Task & Knowledge Management API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
