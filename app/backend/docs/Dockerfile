# Use an official lightweight Python image.
FROM python:3.9-slim

# Set the working directory in the container.
WORKDIR /app

# Copy the dependency file and install dependencies.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Expose port 80 to the outside world.
EXPOSE 80

# Command to run the application using Uvicorn.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
