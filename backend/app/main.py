import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import datasets, eda, model_builder, chatbot

app = FastAPI(title="ML Studio Backend")

# ✅ CORS configuration
origins = [
    "http://localhost:3000",           # React dev server
    "https://machinelearningstudio.netlify.app"  # ✅ Add your Netlify domain here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
app.include_router(eda.router, prefix="/eda", tags=["eda"])
app.include_router(model_builder.router, prefix="/model", tags=["model"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])

@app.get("/")
def root():
    return {"service": "ML Studio Backend", "status": "ok"}

# ✅ Uvicorn entry point for local dev & Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render will set $PORT
    # reload=True is useful locally, but you can set it to False in production
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
