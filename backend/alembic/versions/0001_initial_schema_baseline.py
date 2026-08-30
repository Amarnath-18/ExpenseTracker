"""initial_schema_baseline

Revision ID: 0001_initial_baseline
Revises: 
Create Date: 2026-08-29 23:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_initial_baseline'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    # 1. Users Table
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('email', sa.String(length=100), nullable=False),
            sa.Column('hashed_password', sa.String(length=200), nullable=False),
            sa.Column('full_name', sa.String(length=100), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
            sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    else:
        user_columns = [c['name'] for c in insp.get_columns('users')]
        if 'is_verified' not in user_columns:
            op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false')))

    # 2. Transactions Table
    if 'transactions' not in existing_tables:
        op.create_table(
            'transactions',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('merchant', sa.String(length=100), nullable=True),
            sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
            sa.Column('category', sa.String(length=50), nullable=True),
            sa.Column('description', sa.String(length=200), nullable=True),
            sa.Column('date', sa.Date(), nullable=False),
            sa.Column('payment_method', sa.String(length=50), nullable=True),
            sa.Column('raw_ocr_text', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
        op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
    else:
        tx_columns = [c['name'] for c in insp.get_columns('transactions')]
        if 'description' not in tx_columns:
            op.add_column('transactions', sa.Column('description', sa.String(length=200), nullable=True))
        if 'user_id' not in tx_columns:
            op.add_column('transactions', sa.Column('user_id', sa.Uuid(), nullable=False))
            op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
            op.create_foreign_key(None, 'transactions', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # 3. Refresh Tokens Table
    if 'refresh_tokens' not in existing_tables:
        op.create_table(
            'refresh_tokens',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('token_hash', sa.String(length=250), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('token_hash')
        )
        op.create_index(op.f('ix_refresh_tokens_id'), 'refresh_tokens', ['id'], unique=False)
        op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)

    # 4. Upload Jobs Table (Safe Enum creation for PostgreSQL)
    res = bind.execute(sa.text("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jobstatus')"))
    type_exists = res.scalar()
    if not type_exists:
        op.execute("CREATE TYPE jobstatus AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')")
    from sqlalchemy.dialects.postgresql import ENUM as pgENUM
    job_status_enum = pgENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='jobstatus', create_type=False)

    if 'upload_jobs' not in existing_tables:
        op.create_table(
            'upload_jobs',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('file_path', sa.String(length=500), nullable=False),
            sa.Column('status', job_status_enum, nullable=False),
            sa.Column('error_message', sa.String(length=1000), nullable=True),
            sa.Column('transaction_id', sa.Uuid(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_upload_jobs_id'), 'upload_jobs', ['id'], unique=False)
        op.create_index(op.f('ix_upload_jobs_status'), 'upload_jobs', ['status'], unique=False)
        op.create_index(op.f('ix_upload_jobs_user_id'), 'upload_jobs', ['user_id'], unique=False)

    # 5. Expenses Table (Legacy Support)
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


def downgrade() -> None:
    op.drop_table('expenses')
    op.drop_table('upload_jobs')
    op.drop_table('refresh_tokens')
    op.drop_table('transactions')
    op.drop_table('users')
    sa.Enum(name='jobstatus').drop(op.get_bind(), checkfirst=False)
