import os
import uvicorn

def main():
    host = os.environ.get("BACKEND_HOST", "0.0.0.0")
    port = int(os.environ.get("BACKEND_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port)

if __name__ == "__main__":
    main()
