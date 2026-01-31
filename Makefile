.PHONY: run run-backend run-frontend install install-backend install-frontend clean setup-venv

# Run both backend and frontend
run:
	@echo "Starting backend and frontend..."
	@cd backend && . venv/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	@cd frontend && npm run dev

# Run backend only (uses virtual environment)
run-backend:
	@echo "Starting backend server on http://localhost:8000..."
	cd backend && . venv/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run frontend only
run-frontend:
	@echo "Starting frontend server..."
	cd frontend && npm run dev

# Install all dependencies
install: install-backend install-frontend

# Setup Python virtual environment
setup-venv:
	@echo "Creating Python virtual environment..."
	cd backend && python3 -m venv venv

# Install backend dependencies (in virtual environment)
install-backend: setup-venv
	@echo "Installing backend dependencies..."
	cd backend && source venv/bin/activate && pip install -r requirements.txt

# Install frontend dependencies
install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Clean generated files
clean:
	@echo "Cleaning up..."
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	rm -rf backend/app/**/__pycache__
	rm -rf backend/generated_videos/*
	rm -rf frontend/node_modules
	rm -rf frontend/dist
