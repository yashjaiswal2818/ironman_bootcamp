from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from fastapi import APIRouter, Depends, FastAPI, Body, Form, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from models.model import Registration
from models.contests import Contest
from models.probelms import Problem
from service.registration_service import registration_service
from service.contest_service import create_contest
from service.round_2_service import submit_round_2_service
from service.round_3_service import submit_round_3_service
from service.submission_service import submission_service
from service.problems_service import create_problem
from schemas.problem_schema import ProblemCreate
from schemas.contest_schema import ContestCreate
from schemas.registration_schema import RegistrationCreate
from schemas.submission_schema import Submission
from schemas.round_5_schema import Round_5_Submit
from service.round_5_service import submit_round_5_service
from service.problems_service import get_problem_by_id
from schemas.round_4_schema import Round_4_Submit
from service.round_4_service import submit_round_4_service
from service.leaderboard_service import get_records_desc


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend origin

   # allow_origins=
    #    "http://127.0.0.1:5500",
    #    "http://localhost:5500",
    #    "http://127.0.0.1:3000",
    #    "http://localhost:3000",
    #],  '''
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Verify this is the main API (register, submit, problem routes)."""
    return {"message": "Stark Industries API", "routes": ["/register", "/submit", "/problem/{id}"]}


@app.post("/register")
async def register_team(registration: RegistrationCreate, db: AsyncSession = Depends(get_db)):
    res = await registration_service(registration.Team_Name, team_members=[mem.dict() for mem in registration.team_members], db=db)
    return res


@app.post("/contest")
async def api_create_contest(
    contest: ContestCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_contest(
        db,
        contest.contest_id,
        contest.description,
        contest.start_time,
        contest.end_time
    )


@app.post("/problem")
async def api_create_problem(
    problem: ProblemCreate,
    db: AsyncSession = Depends(get_db)
):
    new_problem = Problem(
        contest_id=problem.contest_id,
        title=problem.title,
        description=problem.description,
        test_cases=[tc.dict() for tc in problem.test_cases],
        score=problem.score,
        post_code=[poc.dict() for poc in problem.post_code],
        pre_code=[prc.dict() for prc in problem.pre_code]
    )

    db.add(new_problem)

    await db.commit()
    await db.refresh(new_problem)

    return {
        "message": "Problem created successfully",
        "problem_id": new_problem.problem_id
    }


@app.post("/submit")
async def api_new_submission(
    submission: Submission,
    db: AsyncSession = Depends(get_db)
):
    return await submission_service(
        db,
        submission.Team_Name,
        submission.contest_id,
        submission.problem_id,
        submission.code,
        submission.status,
        submission.score
    )
@app.get("/problem/{problem_id}")
async def api_get_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_problem_by_id(db, problem_id)  
    # team = Registration(
    #    Team_Name=team_name,
    #    team_members=team_members
    # )
    # db.add(team)
    # await db.commit()
    # return {"message": "Team registered"}


# "members": [
#                {"name": "Aryan", "role": "Leader", "email" : "aryan@example.com"},
#                {"name": "John", "role": "member", "email" : "john@example.com"},
#                {"name": "Jane", "role": "member", "email" : "jane@example.com"}
#
#            ]

@app.post("/round_5")
async def submit_round_5_endpoint(
    Team_Name: str = Form(...),
    abstract: str = Form(...),
    score_5: int = Form(...),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):

    event, uploaded_urls = await submit_round_5_service(
        db=db,
        Team_Name=Team_Name,
        abstract=abstract,
        score_5=score_5,
        files=files
    )

    return {
        "message": "Submitted successfully",
        "urls": uploaded_urls
    }

@app.post("/round_2")
async def submit_round_2_endpoint(
    Team_Name: str = Form(...),
    git_hub_link: str = Form(...),
    hosted_link: str = Form(...),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):

    event, uploaded_urls = await submit_round_2_service(
        db=db,
        Team_Name=Team_Name,
        git_hub_link=git_hub_link,
        hosted_link=hosted_link,
        status="Submitted",
            score_2=0,
        files=files
    )

    return {
        "message": "Submitted successfully",
        "urls": uploaded_urls
    }

@app.post("/round_3")
async def submit_round_3_endpoint(
    Team_Name: str = Form(...),
    figma_links: str = Form(...),
    description: str = Form(...),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    event, uploaded_urls, already_submitted = await submit_round_3_service(
        db=db,
        Team_Name=Team_Name,
        figma_links=figma_links,
        description=description,
        status_3="Submitted",
        score_3=0,
        files=files
    )
    if already_submitted:
        return {
            "message": "Already submitted",
            "urls": [],
            "already_submitted": True
        }
    return {
        "message": "Submitted successfully",
        "urls": uploaded_urls,
        "already_submitted": False
    }


@app.post("/round_4")
async def submit_round_4_endpoint(
    round_4: Round_4_Submit,
    db: AsyncSession = Depends(get_db)
):
    event, already_submitted = await submit_round_4_service(
        db=db,
        Team_Name=round_4.Team_Name,
        structured_submission=round_4.structured_submission,
        status_4=round_4.status_4,
        question=round_4.question,
        score_4=round_4.score_4
    )
    if already_submitted:
        return {
            "message": "Already submitted",
            "event": event,
            "already_submitted": True
        }
    return {
        "message": "Submitted successfully",
        "event": event,
        "already_submitted": False
    }

@app.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    records = await get_records_desc(db)
    return records