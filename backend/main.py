from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import settings

app = FastAPI()

# CORS configuration
# CORS configuration
origins = [
    "http://localhost:4200",
    "https://us-central1-demos-dev-467317.cloudfunctions.net",
    "https://script.google.com",
    "https://n-k42wgrg5jok3zda5cwz6mm3ufq-script.googleusercontent.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings.router)

@app.get("/")
def read_root():
    return {"Hello": "World"}
