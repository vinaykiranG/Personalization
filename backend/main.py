from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import settings

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:4200",
    "http://localhost:8080", # Adding this just in case, based on user's error log
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings.router, prefix="/api")

@app.get("/")
def read_root():
    return {"Hello": "World"}
