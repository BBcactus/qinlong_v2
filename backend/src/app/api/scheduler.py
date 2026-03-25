from fastapi import APIRouter, Request, HTTPException
import asyncio
import inspect

router = APIRouter(prefix="/scheduler", tags=["调度器"])

JOB_NAMES = {
    "all_stocks": "全市场股票",
    "market_overview": "市场概览（指数+涨跌停）",
    "hot_plates": "热门板块",
    "plate_stocks": "板块成分股",
}


@router.get("/jobs")
async def list_jobs(request: Request):
    scheduler = request.app.state.scheduler
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": JOB_NAMES.get(job.id, job.id),
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
            "pending": job.pending,
        })
    return {"data": jobs}


@router.post("/jobs/{job_id}/run")
async def run_job(job_id: str, request: Request):
    scheduler = request.app.state.scheduler
    job = scheduler.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    if inspect.iscoroutinefunction(job.func):
        await job.func()
    else:
        await asyncio.to_thread(job.func)
    return {"ok": True}
