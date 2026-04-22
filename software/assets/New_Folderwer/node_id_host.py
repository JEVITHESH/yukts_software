from yukta import YuktaFrameworkAgent
import uvicorn

# Host Configuration for MCP/API services
HOST = "0.0.0.0"
PORT = 8000

def serve():
    print(f"Starting Yukta Host on {HOST}:{PORT}...")
    # Logic to start an API server or MCP host goes here

if __name__ == "__main__":
    serve()
