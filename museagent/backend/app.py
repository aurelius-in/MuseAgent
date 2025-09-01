from fastapi import FastAPI
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
    return app


app = create_app()


