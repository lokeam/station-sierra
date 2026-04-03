.PHONY: setup dev phoenix check test test-gen reset-db stop logs help

VENV := .venv
PHOENIX_BIN := $(VENV)/bin/python
PHOENIX_LOG := .phoenix.log
ENV_FILE := .env.local

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

setup: _check_prereqs _node_modules _venv _supabase _env ## First-time project bootstrap (idempotent)
	@echo ""
	@echo "Setup complete."
	@echo ""
	@echo "Quick start (one command):"
	@echo "  make dev"
	@echo ""
	@echo "Or run services separately:"
	@echo "  make phoenix        (foreground, in its own terminal)"
	@echo "  npm run dev         (in another terminal)"

_check_prereqs:
	@command -v node >/dev/null 2>&1 || { echo "ERROR: node is required"; exit 1; }
	@command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 is required"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "ERROR: docker is required (for Supabase)"; exit 1; }
	@command -v supabase >/dev/null 2>&1 || { echo "ERROR: supabase CLI is required"; exit 1; }

_node_modules:
	@if [ ! -d node_modules ]; then \
		echo "Installing npm dependencies..."; \
		npm install; \
	else \
		echo "node_modules/ exists, skipping npm install."; \
	fi

_venv:
	@if [ ! -d $(VENV) ]; then \
		echo "Creating Python virtual environment..."; \
		python3 -m venv $(VENV); \
		$(PHOENIX_BIN) -m pip install --quiet arize-phoenix; \
		echo "arize-phoenix installed in $(VENV)/"; \
	else \
		echo "$(VENV)/ exists, skipping venv creation."; \
	fi

_supabase:
	@if supabase status >/dev/null 2>&1; then \
		echo "Supabase is already running."; \
	else \
		echo "Starting Supabase..."; \
		supabase start; \
	fi

_env:
	@touch $(ENV_FILE)
	@if ! grep -q 'NEXT_PUBLIC_SUPABASE_URL' $(ENV_FILE) 2>/dev/null; then \
		echo "Populating Supabase env vars in $(ENV_FILE)..."; \
		API_URL=$$(supabase status -o json | python3 -c "import sys,json; print(json.load(sys.stdin)['API_URL'])"); \
		ANON_KEY=$$(supabase status -o json | python3 -c "import sys,json; print(json.load(sys.stdin)['ANON_KEY'])"); \
		SERVICE_KEY=$$(supabase status -o json | python3 -c "import sys,json; print(json.load(sys.stdin)['SERVICE_ROLE_KEY'])"); \
		echo "" >> $(ENV_FILE); \
		echo "NEXT_PUBLIC_SUPABASE_URL=$$API_URL" >> $(ENV_FILE); \
		echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$$ANON_KEY" >> $(ENV_FILE); \
		echo "SUPABASE_SERVICE_ROLE_KEY=$$SERVICE_KEY" >> $(ENV_FILE); \
	else \
		echo "Supabase env vars already in $(ENV_FILE), skipping."; \
	fi
	@if ! grep -q 'OPENAI_API_KEY' $(ENV_FILE) 2>/dev/null || \
	    [ -z "$$(grep 'OPENAI_API_KEY' $(ENV_FILE) | cut -d= -f2-)" ]; then \
		echo ""; \
		echo "WARNING: OPENAI_API_KEY is not set in $(ENV_FILE)."; \
		echo "  Add it manually: echo 'OPENAI_API_KEY=sk-...' >> $(ENV_FILE)"; \
	fi

# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

dev: ## Start all services + Next.js (one-stop)
	@if [ ! -d $(VENV) ]; then \
		echo "ERROR: venv not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@if curl -sf http://localhost:6006 >/dev/null 2>&1; then \
		echo "Phoenix already running on :6006"; \
	else \
		echo "Starting Phoenix in background (logs: $(PHOENIX_LOG))..."; \
		$(PHOENIX_BIN) -m phoenix.server.main serve > $(PHOENIX_LOG) 2>&1 & \
	fi
	@echo "Starting Next.js..."
	npm run dev

phoenix: ## Start Phoenix in foreground (for debugging)
	@if [ ! -d $(VENV) ]; then \
		echo "ERROR: venv not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@echo "Starting Phoenix at http://localhost:6006 ..."
	$(PHOENIX_BIN) -m phoenix.server.main serve

logs: ## Tail Phoenix background log
	@if [ ! -f $(PHOENIX_LOG) ]; then \
		echo "No log file found. Start Phoenix with 'make dev' first."; \
		exit 1; \
	fi
	tail -f $(PHOENIX_LOG)

# ---------------------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------------------

check: ## Verify Supabase, Phoenix, and Next.js are responding
	@echo "Checking services..."
	@PASS=0; FAIL=0; \
	if curl -sf http://127.0.0.1:54321/rest/v1/ -H "apikey: none" >/dev/null 2>&1 || \
	   supabase status >/dev/null 2>&1; then \
		echo "  OK  Supabase"; PASS=$$((PASS+1)); \
	else \
		echo "  FAIL  Supabase (not responding)"; FAIL=$$((FAIL+1)); \
	fi; \
	if curl -sf http://localhost:6006 >/dev/null 2>&1; then \
		echo "  OK  Phoenix"; PASS=$$((PASS+1)); \
	else \
		echo "  FAIL  Phoenix (not responding at :6006)"; FAIL=$$((FAIL+1)); \
	fi; \
	if curl -sf http://localhost:3000 >/dev/null 2>&1; then \
		echo "  OK  Next.js"; PASS=$$((PASS+1)); \
	else \
		echo "  FAIL  Next.js (not responding at :3000)"; FAIL=$$((FAIL+1)); \
	fi; \
	echo ""; \
	if [ $$FAIL -gt 0 ]; then \
		echo "$$FAIL service(s) not responding."; \
		exit 1; \
	else \
		echo "All services healthy."; \
	fi

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------

test: ## Run unit tests (vitest)
	npx vitest run

test-gen: check ## Run build gate generations (requires all services)
	bash scripts/build-gate.sh

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

reset-db: ## Drop and re-create database (migrations + seed)
	supabase db reset

# ---------------------------------------------------------------------------
# Teardown
# ---------------------------------------------------------------------------

stop: ## Stop Phoenix and Supabase
	@echo "Stopping Phoenix..."
	@-pkill -f "phoenix.server.main serve" 2>/dev/null || true
	@echo "Stopping Supabase..."
	@supabase stop
	@echo "Done."
