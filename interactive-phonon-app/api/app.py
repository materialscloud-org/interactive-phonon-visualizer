from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from phonon_web_tools import convert_qe_phonon_data
from typing import List
import io
import uuid

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store
RESULTS_STORE: dict[str, dict] = {}

@app.get("/results/{result_id}")
async def get_result(result_id: str):
    print(RESULTS_STORE)
    if result_id not in RESULTS_STORE:
        return {"error": "Result not found"}
    return RESULTS_STORE[result_id]

@app.post("/convert_phonons")
async def convert_phonons(
    pw_input_file: UploadFile = File(...),
    pw_output_file: UploadFile = File(...),
    matdyn_file: UploadFile = File(...),
):
    """
    Accept Quantum ESPRESSO phonon files:
      - pw_input_file: aiida.in
      - pw_output_file: aiida.out
      - matdyn_file: phonon_displacements.dat
    Converts them to a JSON-ready phonon dictionary.
    """
    try:
        # Read bytes
        f1_bytes = await pw_input_file.read()
        f2_bytes = await pw_output_file.read()
        f3_bytes = await matdyn_file.read()

        # Convert to string safely (replace non-UTF-8 characters)
        f1_text = f1_bytes.decode(errors="replace")
        f2_text = f2_bytes.decode(errors="replace")
        f3_text = f3_bytes.decode(errors="replace")

        # Wrap in StringIO (text-based file-like object)
        f1_stream = io.StringIO(f1_text)
        f2_stream = io.StringIO(f2_text)
        f3_stream = io.StringIO(f3_text)

        phonon_data = convert_qe_phonon_data(
            f1_stream,
            f2_stream,
            f3_stream,
        )   
    except Exception as e:
        import traceback
        traceback.print_exc()  # log full traceback
        raise HTTPException(status_code=500, detail=f"Conversion pipeline failed: {str(e)}")

    # store result in memory
    result_id = str(uuid.uuid4())
    RESULTS_STORE[result_id] = phonon_data


    # pass the result to the front frontend so it can be fetched
    return {"result_id": result_id}