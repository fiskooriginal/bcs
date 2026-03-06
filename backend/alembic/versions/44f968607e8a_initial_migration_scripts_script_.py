"""Initial migration: scripts, script_executions, script_logs tables

Revision ID: 44f968607e8a
Revises:
Create Date: 2026-03-06 10:41:29.913551

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "44f968607e8a"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scripts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cron_expression", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("filename"),
    )
    op.create_index(op.f("ix_scripts_name"), "scripts", ["name"], unique=False)
    op.create_index(op.f("ix_scripts_is_active"), "scripts", ["is_active"], unique=False)

    op.create_table(
        "script_executions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("script_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("triggered_by", sa.String(length=50), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("exit_code", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["script_id"], ["scripts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_script_executions_script_id"),
        "script_executions",
        ["script_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_script_executions_status"),
        "script_executions",
        ["status"],
        unique=False,
    )

    op.create_table(
        "script_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("execution_id", sa.UUID(), nullable=False),
        sa.Column("level", sa.String(length=20), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("stream", sa.String(length=10), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["execution_id"],
            ["script_executions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_script_logs_execution_id"),
        "script_logs",
        ["execution_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_script_logs_timestamp"),
        "script_logs",
        ["timestamp"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_script_logs_timestamp"), table_name="script_logs")
    op.drop_index(op.f("ix_script_logs_execution_id"), table_name="script_logs")
    op.drop_table("script_logs")

    op.drop_index(op.f("ix_script_executions_status"), table_name="script_executions")
    op.drop_index(op.f("ix_script_executions_script_id"), table_name="script_executions")
    op.drop_table("script_executions")

    op.drop_index(op.f("ix_scripts_is_active"), table_name="scripts")
    op.drop_index(op.f("ix_scripts_name"), table_name="scripts")
    op.drop_table("scripts")
