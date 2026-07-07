GO111MODULE=on

.PHONY: build
build: build-vue3 gocron node

.PHONY: build-race
build-race: enable-race build

# 完整启动（重新构建前端 + statik 嵌入 + Go 编译 + 启动服务）
.PHONY: run
run: build kill
	./bin/gocron web -e dev

# 开发模式：前端 Vite 热重载 + 后端守护进程
.PHONY: dev
dev: kill
	cd web/vue3 && npm run dev &
	$(MAKE) gocron
	./bin/gocron web -e dev

.PHONY: run-race
run-race: enable-race run

.PHONY: kill
kill:
	-killall gocron gocron-node 2>/dev/null; true

.PHONY: gocron
gocron:
	go build $(RACE) -o bin/gocron ./cmd/gocron

.PHONY: node
node:
	go build $(RACE) -o bin/gocron-node ./cmd/node

.PHONY: test
test:
	go test $(RACE) ./...

.PHONY: test-race
test-race: enable-race test

.PHONY: enable-race
enable-race:
	$(eval RACE = -race)

# 构建前端 + statik 嵌入
.PHONY: install-vue3
install-vue3:
	cd web/vue3 && [ -d node_modules ] && echo "node_modules exists" || npm install

.PHONY: build-vue3
build-vue3: install-vue3
	cd web/vue3 && npm run build
	rm -rf web/public && mkdir -p web/public
	cp -r web/vue3/dist/* web/public/
	cd cmd/gocron && go run github.com/rakyll/statik -src=../../web/public -dest=../../internal -f 2>/dev/null

# 前端开发服务器（热重载，API 代理到 :5920）
.PHONY: dev-vue3
dev-vue3: install-vue3
	cd web/vue3 && npm run dev

.PHONY: statik
statik:
	cd cmd/gocron && go run github.com/rakyll/statik -src=../web/public -dest=../internal -f

# 生产打包
# Linux 交叉编译（amd64 + arm64）
.PHONY: build-linux
build-linux: build-vue3
	GOOS=linux GOARCH=amd64 go build -o bin/gocron-linux-amd64 ./cmd/gocron
	GOOS=linux GOARCH=amd64 go build -o bin/gocron-node-linux-amd64 ./cmd/node
	GOOS=linux GOARCH=arm64 go build -o bin/gocron-linux-arm64 ./cmd/gocron
	GOOS=linux GOARCH=arm64 go build -o bin/gocron-node-linux-arm64 ./cmd/node

.PHONY: package
package: build-vue3
	bash ./package.sh

.PHONY: package-all
package-all: build-vue3
	bash ./package.sh -p 'linux darwin windows'

.PHONY: lint
lint:
	golangci-lint run ./...

.PHONY: clean
clean:
	rm -rf bin/
	rm -rf web/vue3/dist/
	rm -rf web/public/
	rm -rf web/vue3/node_modules/
