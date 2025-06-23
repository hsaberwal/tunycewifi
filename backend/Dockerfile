FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy app files
COPY ./main.py /app/main.py
COPY ./static /app/static
COPY ./routers /app/routers
COPY config.json /app/config.json

# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn[standard] psycopg2-binary asyncpg python-dotenv python-multipart

# Run the FastAPI app with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

