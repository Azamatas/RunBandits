import os

from fastapi import Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")


def mount_static_files(app):
    if not os.path.isdir(STATIC_DIR):
        return

    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/favicon.svg")
    async def favicon():
        return FileResponse(os.path.join(STATIC_DIR, "favicon.svg"))

    @app.get("/assets/{path:path}")
    async def assets(path: str):
        file_path = os.path.join(STATIC_DIR, "assets", path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{path:path}")
    async def spa_fallback(request: Request, path: str):
        file_path = os.path.join(STATIC_DIR, path)
        if path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))