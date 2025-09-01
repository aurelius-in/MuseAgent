from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

try:
    from .api.v1 import router as api_v1
except Exception:
    # Fallback import path when running as a module-less script
    from api.v1 import router as api_v1  # type: ignore


def create_app() -> FastAPI:
    app = FastAPI(title="MuseAgent API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_v1, prefix="/")
    # Serve static frontend under /ui and assets under /assets
    app.mount("/ui", StaticFiles(directory="frontend", html=True), name="ui")
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")
    app.mount("/data", StaticFiles(directory="museagent/backend/data"), name="data")
    app.mount("/reports", StaticFiles(directory="museagent/backend/reports"), name="reports")

    @app.get("/")
    def root_redirect():
        return RedirectResponse(url="/ui/")
    return app


app = create_app()


