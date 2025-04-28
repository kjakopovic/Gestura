from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html

import json
import os
import uvicorn

app = FastAPI(docs_url=None, redoc_url=None)

# Loading swagger json files
with open(os.path.join("utils", "UsersApi.json"), "r") as f:
    users_docs = json.load(f)

with open(os.path.join("utils", "LearningApi.json"), "r") as f:
    learning_docs = json.load(f)


# Adding routes for swagger files
@app.get("/UsersApi.json", include_in_schema=False)
async def custom_openapi():
    return JSONResponse(users_docs)


@app.get("/LearningApi.json", include_in_schema=False)
async def custom_openapi2():
    return JSONResponse(learning_docs)


@app.get("/users", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(openapi_url="/UsersApi.json", title="users docs")


@app.get("/learning", include_in_schema=False)
async def custom_swagger_ui2():
    return get_swagger_ui_html(openapi_url="/LearningApi.json", title="learning docs")


# Mounting static files from the "public" directory
app.mount("/", StaticFiles(directory="public", html=True), name="public")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=80)
