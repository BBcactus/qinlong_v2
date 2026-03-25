.PHONY: dev-backend dev-frontend install-backend install-frontend migrate fmt

dev-backend:
	cd backend && uv run uvicorn src.app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

install-backend:
	cd backend && uv sync

install-frontend:
	cd frontend && npm install

install: install-backend install-frontend

migrate:
	for f in backend/migrations/0*.sql; do psql $$DATABASE_URL -f $$f; done

fmt:
	cd backend && uv run ruff format src/

lint:
	cd backend && uv run ruff check src/
