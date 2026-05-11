.PHONY: dev build test test-watch lint type-check clean setup

## Setup: install dependencies
setup:
	npm install

## Dev: start development server with hot reload
dev:
	npm run dev

## Build: production build
build:
	npm run build

## Test: run all tests once
test:
	npm run test

## Test Watch: TDD watch mode (RED-GREEN cycle)
test-watch:
	npm run test:watch

## Lint: lint + type check
lint:
	npm run lint && npm run type-check

## Type-check: TypeScript strict mode check
type-check:
	npm run type-check

## Clean: remove build artifacts
clean:
	rm -rf .next coverage

## Help: show available commands
help:
	@grep -E '^## ' Makefile | sed 's/## //'
