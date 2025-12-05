.PHONY: build run test clean deps

build:
	go build -o management-server main.go

run:
	go run main.go

test:
	go test ./...

clean:
	rm -f management-server

deps:
	go mod download
	go mod tidy

