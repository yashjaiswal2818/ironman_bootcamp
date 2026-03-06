from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Tuple

load_dotenv()
from models.round_4 import Round_4
from service.leaderboard_service import update_leaderboard_score


async def submit_round_4_service(
    db: AsyncSession,
    Team_Name: str,
    structured_submission: str,
    status_4: str,
    question: str,
    score_4: int,
) -> Tuple[Round_4, bool]:
    """
    One submission per team (group). Returns (event, already_submitted).
    If team already has a submission, returns existing record and True.
    """
    existing = await db.execute(
        select(Round_4).where(Round_4.Team_Name == Team_Name)
    )
    existing_event = existing.scalar_one_or_none()
    if existing_event:
        return existing_event, True

    event = Round_4(
        Team_Name=Team_Name,
        structured_submission=structured_submission,
        status_4=status_4,
        question=question,
        score_4=score_4,
    )

    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Update leaderboard score
    await update_leaderboard_score(db, Team_Name)

    return event, False
