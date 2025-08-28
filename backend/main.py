from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import settings

app = FastAPI()

# CORS configuration
# Allow all origins for development purposes
# In a production environment, this should be restricted to the specific frontend URL
origins = ["*"]

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
