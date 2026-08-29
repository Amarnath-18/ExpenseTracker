# import os
# from celery import Celery

# # We grab the Redis URL from the environment (docker-compose sets this), 
# # or default to localhost if you are running it natively outside docker.
# redis_url = os.getenv("REDIS_URL","redis://localhost:6379/0")

# celery_app = Celery(
#     "expense_tracker_worker",
#     broker=redis_url,
#     backend=redis_url,
# )

# celery_app.conf.update(
#     task_serializer="json",
#     accept_content=["json"],
#     result_serializer="json",
#     timezone="UTC",
#     enable_utc=True,
# )

# celery_app.autodiscover_tasks(["app.tasks.process_image"])