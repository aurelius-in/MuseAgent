from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from .config.settings import settings

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
    # Warm-start background: rebuild embedding index
    try:
        from .api.v1 import warm_start  # type: ignore
        warm_start()
    except Exception:
        pass
    # Serve static frontend under /ui and assets under /assets
    app.mount("/ui", StaticFiles(directory="frontend", html=True), name="ui")
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")
    app.mount("/data", StaticFiles(directory="museagent/backend/data"), name="data")
    app.mount("/reports", StaticFiles(directory="museagent/backend/reports"), name="reports")

    @app.get("/")
    def root_redirect():
        return RedirectResponse(url="/ui/")

    # Optional API key enforcement via dependency (simple demo)
    if settings.REQUIRE_API_KEY and settings.API_KEY:
        from fastapi import Request, HTTPException

        @app.middleware("http")
        async def api_key_guard(request: "Request", call_next):
            # Allow static and health without key
            if request.url.path.startswith(("/ui", "/assets", "/data", "/reports", "/healthz", "/readyz")):
                return await call_next(request)
            key = request.headers.get("x-api-key") or request.query_params.get("api_key")
            if key != settings.API_KEY:
                raise HTTPException(status_code=401, detail="Invalid API key")
            return await call_next(request)
    return app


app = create_app()


