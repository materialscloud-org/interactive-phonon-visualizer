from fastapi import FastAPI, UploadFile, File, HTTPException
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

# 2GB disk-backed LRU cache
cache = Cache(
    "./phonon_cache",
    size_limit=2 * 1024 * 1024 * 1024  # 2 GB
)

@app.get("/results/{result_id}")
async def get_result(result_id: str):
    result = cache.get(result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@app.post("/convert_phonons")
async def convert_phonons(
    pw_input_file: UploadFile = File(...),
    pw_output_file: UploadFile = File(...),
    matdyn_file: UploadFile = File(...),
):
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

    # cache by first part of uuid
    result_id = str(uuid.uuid4()).split("-")[0]
    
    # Store in disk LRU cache
    cache.set(result_id, phonon_data)

    # pass the result to the front frontend so it can be fetched
    return {"result_id": result_id}