stageName ?= develop
get-api-docs:
	python ./backend/scripts/get_api_docs.py $(stageName)

run-docs-local:
	docker build -f backend/docs/Dockerfile -t gestura-docs backend/docs
	docker run --name gestura-docs -p 80:80 gestura-docs

stop-docs-local:
	docker stop gestura-docs
	docker rm gestura-docs
