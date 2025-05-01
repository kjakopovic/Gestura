stageName ?= develop
get-api-docs:
	python ./backend/scripts/get_api_docs.py $(stageName)

run-docs-local:
	docker build -f backend/docs/Dockerfile -t gestura-docs backend/docs
	docker run --name gestura-docs -p 80:80 gestura-docs

stop-docs-local:
	docker stop gestura-docs
	docker rm gestura-docs

insert-items-into-table:
	python ./backend/scripts/insert_into_table.py --table items-$(stageName) --items-file ./backend/seeder/items.json --region eu-central-1

insert-tasks-into-table:
	python ./backend/scripts/insert_into_table.py --table tasks-$(stageName) --items-file ./backend/seeder/tasks.json --region eu-central-1

insert-languages-into-table:
	python ./backend/scripts/insert_into_table.py --table languages-$(stageName) --items-file ./backend/seeder/languages.json --region eu-central-1
