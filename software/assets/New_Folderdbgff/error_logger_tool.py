import os

def log_error(error_msg: str):
    """Logs the error message to error_report.txt."""
    try:
        with open("error_report.txt", "w") as f:
            f.write(error_msg)
        print(f"Error logged to error_report.txt")
        return True
    except Exception as e:
        print(f"Failed to log error: {e}")
        return False
