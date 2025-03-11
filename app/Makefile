stageName ?= develop
get-api-docs:
	python ./backend/scripts/get_api_docs.py $(stageName)

run-docs-local:
	docker build -f backend/docs/Dockerfile -t lin-gest-docs backend/docs
	docker run -p 80:80 lin-gest-docs
