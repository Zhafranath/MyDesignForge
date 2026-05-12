FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime

ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/models/huggingface

WORKDIR /app

COPY image_service/requirements.txt /app/image_service/requirements.txt
RUN python -m pip install --upgrade pip \
  && python -m pip install --no-cache-dir -r /app/image_service/requirements.txt

COPY image_service /app/image_service

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "image_service.server:app", "--host", "0.0.0.0", "--port", "8000"]
