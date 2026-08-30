"""drop_legacy_expenses

Revision ID: 0002_drop_legacy_expenses
Revises: 0001_initial_baseline
Create Date: 2026-08-30 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_drop_legacy_expenses'
down_revision: Union[str, Sequence[str], None] = '0001_initial_baseline'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    if 'expenses' in existing_tables:
        op.drop_table('expenses')


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    if 'expenses' not in existing_tables:
        op.create_table(
            'expenses',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=100), nullable=False),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
