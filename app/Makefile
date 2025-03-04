generate-docs:
	python ./backend/scripts/generate_go_docs.py

stageName ?= develop
structure-docs:
	python ./backend/scripts/structure_go_docs.py $(stageName)

run-docs-local:
	docker build -f backend/docs/Dockerfile -t hands-of-hope-docs backend/docs
	docker run -p 80:80 hands-of-hope-docs