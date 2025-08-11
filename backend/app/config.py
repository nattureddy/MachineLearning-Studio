import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Storage type: 'local' or 's3'
    storage_backend: str = os.getenv("STORAGE_BACKEND", "local")
    
    # Correct path to the datasets directory at the project root
    upload_dir: str = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets"))

    # AWS S3 settings
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    aws_s3_bucket: str = os.getenv("AWS_S3_BUCKET", "")

settings = Settings()