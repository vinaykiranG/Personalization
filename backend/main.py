from fastapi import FastAPI
from backend.api import settings

app = FastAPI()

app.include_router(settings.router, prefix="/api")

@app.get("/")
def read_root():
    return {"Hello": "World"}
