from __future__ import annotations

from email.parser import BytesParser
from email.policy import default
from pathlib import Path
from typing import Optional


class EmailParser:
    """Parses .eml files and extracts basic metadata."""

    def parse(self, path: Path) -> Optional[str]:
        with path.open('rb') as f:
            msg = BytesParser(policy=default).parse(f)
        return msg.get_body(preferencelist=('plain', 'html')).get_content()
