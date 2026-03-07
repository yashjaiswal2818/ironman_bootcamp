import cloudinary.uploader
import cloudinary.api
import cloudinary
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Tuple
from fastapi import UploadFile

load_dotenv()
from models.round_5 import Round_5
from service.leaderboard_service import update_leaderboard_score


cloudinary.config(
    cloud_name='dokzyijqo',
    api_key='519149328713126',
    api_secret='LLeSvMpg1xwzdvtPNp4w6dmTnvs'
)

async def submit_round_5_service(
    db: AsyncSession,
    Team_Name: str,
    abstract: str,
    score_5: int,
    files: List[UploadFile]
) -> Tuple[Round_5, List[str], bool]:
    """
    One submission per team (group). Returns (event, uploaded_urls, already_submitted).
    If team already has a submission, returns existing record and True.
    """
    existing = await db.execute(
        select(Round_5).where(Round_5.Team_Name == Team_Name)
    )
    existing_event = existing.scalar_one_or_none()
    if existing_event:
        return existing_event, [], True

    uploaded_urls = []

    for file in files:
        result = cloudinary.uploader.upload(
            file.file,
            resource_type="auto"
        )

        uploaded_urls.append(result["secure_url"])

    # store as comma-separated OR JSON (depending on your model)
    ppt_links = ",".join(uploaded_urls)

    event = Round_5(
        Team_Name=Team_Name,
        abstract=abstract,
        score_5=score_5,
        ppt_link=ppt_links
    )

    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Update leaderboard score
    await update_leaderboard_score(db, Team_Name)

    return event, uploaded_urls, False
