from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from phonon_web_tools import convert_qe_phonon_data
import io
import uuid
from diskcache import Cache

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TWO_MONTHS = 60 * 60 * 24 * 60
FIVE_GB = 5 * 1024 * 1024 * 1024
# 2GB disk-backed LRU cache
cache = Cache(
    "./phonon_cache",
    size_limit=FIVE_GB
)

@app.get("/results/{result_id}")
async def get_result(result_id: str):
    result = cache.get(result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@app.post("/share_phononvis")
async def share_phononvis(
    file: UploadFile = File(...),
    key: str = Form(...)
):
    import json
    try:
        text = (await file.read()).decode(errors="replace")
        data = json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")

    # Use the frontend-supplied hash as the cache key
    cache.set(key, data)
    return {"result_id": key}


@app.post("/convert_phonons")
async def convert_phonons(
    pw_input_file: UploadFile = File(...),
    pw_output_file: UploadFile = File(...),
    matdyn_file: UploadFile = File(...),
):
    """
    Convert QE phonon data and return directly.
    No caching or result_id is generated here.
    """
    try:
        f1_text = (await pw_input_file.read()).decode(errors="replace")
        f2_text = (await pw_output_file.read()).decode(errors="replace")
        f3_text = (await matdyn_file.read()).decode(errors="replace")

        phonon_data = convert_qe_phonon_data(
            io.StringIO(f1_text),
            io.StringIO(f2_text),
            io.StringIO(f3_text),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Conversion pipeline failed: {str(e)}"
        )
    return phonon_data


# Mount the frontend last to make sure you dont overwrite other routes
app.mount("/", StaticFiles(directory="./frontend/dist", html=True), name="frontend")