from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html

import json
import os
import uvicorn

app = FastAPI(docs_url=None, redoc_url=None)

# Loading swagger json files
with open(os.path.join("utils", "Service1Api.json"), "r") as f:
  service1_docs = json.load(f)

# Adding routes for swagger files
@app.get("/Service1Api.json", include_in_schema=False)
async def custom_openapi():
  return JSONResponse(service1_docs)

@app.get("/service1", include_in_schema=False)
async def custom_swagger_ui():
  return get_swagger_ui_html(openapi_url="/Service1Api.json", title="docs")

# Mounting static files from the "public" directory
app.mount("/", StaticFiles(directory="public", html=True), name="public")

if __name__ == "__main__":
  uvicorn.run(app, host="0.0.0.0", port=80)