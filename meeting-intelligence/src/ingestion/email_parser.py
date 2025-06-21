from __future__ import annotations

from email import policy
from email.parser import BytesParser
from email.utils import parsedate_to_datetime, getaddresses
from pathlib import Path
from typing import Optional, List

from pydantic import BaseModel


class MeetingData(BaseModel):
    meeting_id: str
    subject: str
    date: Optional[str]
    participants: List[str]
    body: str


class EmailParser:
    """Parses .eml files and extracts meeting information."""

    def parse(self, path: Path) -> Optional[MeetingData]:
        try:
            with path.open("rb") as f:
                msg = BytesParser(policy=policy.default).parse(f)
        except Exception as exc:
            raise RuntimeError(f"Failed to parse email: {exc}") from exc

        body = msg.get_body(preferencelist=("plain", "html"))
        content = body.get_content() if body else ""

        addresses = getaddresses(msg.get_all("from", []) + msg.get_all("to", []) + msg.get_all("cc", []))
        participants = [addr for name, addr in addresses]

        date_hdr = msg.get("date")
        parsed_date = None
        if date_hdr:
            try:
                parsed_date = parsedate_to_datetime(date_hdr).isoformat()
            except Exception:
                parsed_date = None

        meeting_id = msg.get("Message-ID", "")

        return MeetingData(
            meeting_id=meeting_id.strip("<>") if meeting_id else "",
            subject=msg.get("subject", "").strip(),
            date=parsed_date,
            participants=participants,
            body=content,
        )
