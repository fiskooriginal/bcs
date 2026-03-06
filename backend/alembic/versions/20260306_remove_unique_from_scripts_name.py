"""Remove unique constraint from scripts.name

Revision ID: 20260306_remove_unique
Revises: 44f968607e8a
Create Date: 2026-03-06

Names may be duplicated; filename remains the unique identifier.

"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260306_remove_unique"
down_revision: Union[str, None] = "44f968607e8a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("scripts_name_key", "scripts", type_="unique")


def downgrade() -> None:
    op.create_unique_constraint("scripts_name_key", "scripts", ["name"])
