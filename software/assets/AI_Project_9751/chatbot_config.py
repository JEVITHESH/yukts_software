from yukta import Config
import logging

# Global Yukta Configuration
YUKTA_CONFIG = {
    "api_key": "",
    "base_url": "",
    "log_level": logging.INFO,
}

def setup():
    """Setup the global environment."""
    logging.basicConfig(level=YUKTA_CONFIG["log_level"])
    print("Yukta environment configured.")

if __name__ == "__main__":
    setup()
